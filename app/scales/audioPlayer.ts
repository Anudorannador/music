import * as Tone from 'tone';

/**
 * Audio playback manager using Tone.js
 * Handles scale playback with note highlighting callbacks
 */

export type PlaybackDirection = 'ascending' | 'descending' | 'both';

export interface PlaybackOptions {
  midiNotes: number[];
  direction: PlaybackDirection;
  tempo?: number; // Note duration in seconds (default: 0.3)
  onNoteStart?: (midiNote: number, index: number) => void;
  onNoteEnd?: (midiNote: number, index: number) => void;
  onComplete?: () => void;
}

class ScaleAudioPlayer {
  private synth: Tone.Synth | null = null;
  private isPlaying = false;
  private currentTimeoutIds: number[] = [];

  async play(options: PlaybackOptions): Promise<void> {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.clearTimeouts();

    const {
      midiNotes,
      direction,
      tempo = 0.3,
      onNoteStart,
      onNoteEnd,
      onComplete,
    } = options;

    try {
      await Tone.start();

      // Create synth if not exists
      if (!this.synth) {
        this.synth = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 0.1,
          },
        }).toDestination();
      }

      // Prepare notes based on direction
      let notesToPlay = [...midiNotes];

      if (direction === 'descending') {
        notesToPlay = [...midiNotes].reverse();
      } else if (direction === 'both') {
        notesToPlay = [...midiNotes, ...midiNotes.slice(0, -1).reverse()];
      }

      // Schedule all notes
      const now = Tone.now();
      const noteDuration = tempo;

      notesToPlay.forEach((midiNote, index) => {
        const startTime = now + index * noteDuration;
        const freq = Tone.Frequency(midiNote, 'midi').toFrequency();

        // Schedule note playback
        this.synth!.triggerAttackRelease(freq, noteDuration * 0.8, startTime);

        // Schedule highlight callbacks
        const startTimeoutId = window.setTimeout(() => {
          onNoteStart?.(midiNote, index);
        }, (startTime - now) * 1000);

        const endTimeoutId = window.setTimeout(() => {
          onNoteEnd?.(midiNote, index);
        }, (startTime - now + noteDuration) * 1000);

        this.currentTimeoutIds.push(startTimeoutId, endTimeoutId);
      });

      // Schedule completion callback
      const completeTimeoutId = window.setTimeout(() => {
        this.isPlaying = false;
        this.clearTimeouts();
        onComplete?.();
      }, notesToPlay.length * noteDuration * 1000 + 200);
      this.currentTimeoutIds.push(completeTimeoutId);

    } catch {
      this.isPlaying = false;
      this.clearTimeouts();
      onComplete?.();
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.clearTimeouts();

    if (this.synth) {
      this.synth.triggerRelease();
    }
  }

  dispose(): void {
    this.stop();

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }

  private clearTimeouts(): void {
    this.currentTimeoutIds.forEach(id => window.clearTimeout(id));
    this.currentTimeoutIds = [];
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Singleton instance
let audioPlayerInstance: ScaleAudioPlayer | null = null;

export function getAudioPlayer(): ScaleAudioPlayer {
  if (!audioPlayerInstance) {
    audioPlayerInstance = new ScaleAudioPlayer();
  }
  return audioPlayerInstance;
}

export function disposeAudioPlayer(): void {
  if (audioPlayerInstance) {
    audioPlayerInstance.dispose();
    audioPlayerInstance = null;
  }
}
