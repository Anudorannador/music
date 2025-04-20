import * as Tone from 'tone';

export interface ChordPlaybackOptions {
  midiNotes: number[];            // MIDI numbers for chord notes (already octave-adjusted)
  tempo?: number;                 // seconds per note slot (kept for compatibility; arpeggio will use fixed 1.5s)
  sustainFactor?: number;         // multiplier applied to note duration (default 1.2 for longer sound)
  releaseFactor?: number;         // multiplier for envelope release (default 1.2)
  onNoteStart?: (index: number, midi: number) => void;
  onNoteEnd?: (index: number, midi: number) => void;
  onComplete?: () => void;
}

class ChordAudioPlayer {
  private synth: Tone.PolySynth | null = null;
  private arpSynth: Tone.Synth | null = null;
  private scheduledIds: number[] = [];
  private isPlaying = false;
  // Fixed durations per requirement
  private static readonly ARP_NOTE_TOTAL = 0.5;    // seconds per arpeggio note slot (match scales default tempo)
  private static readonly BLOCK_TOTAL = 1.0;       // total seconds the block chord is held before hand lift
  private static readonly ARP_RELEASE_TAIL = 0.05; // arpeggio short tail to avoid clicks
  // For a more natural "lift the hands" feel on acoustic piano, give the damper a short but perceptible tail
  private static readonly BLOCK_RELEASE_TAIL = 0.12;
  // Individual voices for glide control
  private voices: Tone.Synth[] = [];
  private currentTimeoutIds: number[] = [];

  // Use Tone.Transport for scheduling and Tone.Draw for UI callbacks to keep audio and UI in sync
  async playArpeggio(opts: ChordPlaybackOptions) {
    // Sequential arpeggio: play notes one by one with no gap; each slot = 1.0s (including short release tail)
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.clear();

    const { midiNotes, onNoteStart, onNoteEnd, onComplete } = opts;
    if (!midiNotes.length) {
      this.isPlaying = false;
      onComplete?.();
      return;
    }

    await Tone.start();

    // Create a single-voice synth for arpeggio, matching scales player timbre
    if (!this.arpSynth) {
      this.arpSynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 }
      }).toDestination();
    }

    const slot = ChordAudioPlayer.ARP_NOTE_TOTAL;
    // Mirror scales player: note sounds for ~80% of the slot, leaving a small release tail
    const dur = Math.max(0.01, slot * 0.8);
    // Follow scales: schedule by Tone.now and use window timeouts for UI callbacks
    const now = Tone.now();
    midiNotes.forEach((midi, index) => {
      const startTime = now + index * slot;
      const freq = Tone.Frequency(midi, 'midi').toFrequency();
      this.arpSynth!.triggerAttackRelease(freq, dur, startTime);

      const startId = window.setTimeout(() => onNoteStart?.(index, midi), (startTime - now) * 1000);
      const endId = window.setTimeout(() => onNoteEnd?.(index, midi), (startTime - now + slot) * 1000);
      this.currentTimeoutIds.push(startId, endId);
    });

    const completeId = window.setTimeout(() => {
      this.isPlaying = false;
      this.clearTimeouts();
      onComplete?.();
    }, midiNotes.length * slot * 1000 + 50);
    this.currentTimeoutIds.push(completeId);
  }

  async playBlock(opts: Omit<ChordPlaybackOptions, 'onNoteStart' | 'onNoteEnd'>) {
    // Block (natural): simulate a human pressing keys "together" with tiny micro-stagger and lift after 2.0s.
    // We humanize attack by up to ~12ms, vary velocity slightly per note, and use a piano-like envelope
    // (fast attack, decay to low sustain, short release) so the sound naturally decays while held.
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.clear();
    const { midiNotes, onComplete } = opts as ChordPlaybackOptions;
    if (!midiNotes.length) {
      this.isPlaying = false;
      onComplete?.();
      return;
    }

    await Tone.start();

    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        // Piano-like: very fast attack, noticeable decay, low sustain (energy decays while held), short damper release
        envelope: { attack: 0.003, decay: 0.6, sustain: 0.08, release: ChordAudioPlayer.BLOCK_RELEASE_TAIL }
      }).toDestination();
    } else {
      this.synth.set({ envelope: { attack: 0.003, decay: 0.6, sustain: 0.08, release: ChordAudioPlayer.BLOCK_RELEASE_TAIL } });
    }

    const now = Tone.now();
    // Humanize parameters
    const maxOffset = 0.012; // seconds (12ms window for near-simultaneous attack)
    // Random but stable ordering per run; offsets bounded [0, maxOffset)
    const attackPlan = midiNotes.map((midi) => ({
      midi,
      freq: Tone.Frequency(midi, 'midi').toFrequency(),
      offset: Math.random() * maxOffset,
      velocity: 0.75 + Math.random() * 0.2 // 0.75..0.95
    }));

    // Trigger attack per voice with slight offset; schedule release at common lift time (1.0s after earliest attack)
    const liftAt = now + ChordAudioPlayer.BLOCK_TOTAL;
    attackPlan.forEach(({ freq, offset, velocity }) => {
      const t = now + offset;
      this.synth!.triggerAttack(freq, t, velocity);
      // Release each voice exactly at lift time to simulate simultaneous hand lift
      this.synth!.triggerRelease(freq, liftAt);
    });

    const completeId = window.setTimeout(() => {
      this.isPlaying = false;
      this.clearTimeouts();
      onComplete?.();
    }, (ChordAudioPlayer.BLOCK_TOTAL + ChordAudioPlayer.BLOCK_RELEASE_TAIL) * 1000 + 20);
    this.currentTimeoutIds.push(completeId);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.clear();
    // Release current glide voices immediately
    this.voices.forEach(v => v.triggerRelease());
    this.voices.forEach(v => v.dispose());
    this.voices = [];
    this.synth?.releaseAll();
    this.arpSynth?.triggerRelease();
    this.clearTimeouts();
  }

  dispose() {
    this.stop();
    this.synth?.dispose();
    this.arpSynth?.dispose();
    this.synth = null;
    this.arpSynth = null;
  }

  private clear() {
    this.scheduledIds.forEach(id => Tone.Transport.clear(id));
    this.scheduledIds = [];
  }

  private clearTimeouts() {
    this.currentTimeoutIds.forEach(id => window.clearTimeout(id));
    this.currentTimeoutIds = [];
  }
}

let chordPlayerInstance: ChordAudioPlayer | null = null;

export function getChordAudioPlayer(): ChordAudioPlayer {
  if (!chordPlayerInstance) chordPlayerInstance = new ChordAudioPlayer();
  return chordPlayerInstance;
}

export function disposeChordAudioPlayer() {
  chordPlayerInstance?.dispose();
  chordPlayerInstance = null;
}

// Helper convert note name + octave to MIDI same as in ChordKeyboard (duplicated minimal logic to avoid circular imports)
export function noteToMidiSimple(note: string, octave: number): number {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const idx = names.indexOf(note);
  if (idx === -1) return -1;
  return (octave + 1) * 12 + idx;
}
