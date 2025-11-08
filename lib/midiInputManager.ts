/*
 * midiInputManager.ts
 * Dual-hand aware MIDI input buffering, chord detection, velocity normalization, and adaptive split point.
 *
 * No external dependencies beyond existing 'tonal'. Designed for real-time usage with WebMidi.
 * You can integrate by instantiating MidiInputManager and wiring in WebMidi event listeners.
 *
 * WHY: Human performance rarely triggers perfectly simultaneous note-on events; naive per-note chord detection mislabels
 * rolled chords, mixed hands, and bass lines. This manager introduces short buffering windows per hand plus adaptive
 * pitch-based split point and sustain pedal semantics to produce musically meaningful chord events.
 */

import { Chord } from 'tonal';

// Hand designation
export type Hand = 'L' | 'R';

// Configuration options with sensible defaults
export interface MidiInputManagerConfig {
  chordWindowMsRight?: number;      // Buffer window for right hand chord aggregation
  chordWindowMsLeft?: number;       // Buffer window for left hand chord aggregation
  earlyCloseCountRight?: number;    // Early finalize if this many notes arrive quickly (right hand)
  earlyCloseCountLeft?: number;     // Early finalize if this many notes arrive quickly (left hand)
  rollExtensionMsRight?: number;    // Allow extended rolled chords (right hand)
  rollExtensionMsLeft?: number;     // Allow extended rolled chords (left hand)
  splitInitialMidi?: number;        // Starting split point between hands
  splitMin?: number;                // Minimum allowed split point (avoid drifting too low)
  splitMax?: number;                // Maximum allowed split point (avoid drifting too high)
  splitAdaptIntervalMs?: number;    // Interval to reconsider adaptive split
  splitShiftThreshold?: number;     // Semi-tones shift trigger for split point adjustment
  leftBassArpGapMs?: number;        // Gap threshold to tag bass/arpeggio patterns
  velocityBlendRight?: number;      // Blend factor for right hand velocity normalization (0-1)
  velocityBlendLeft?: number;       // Blend factor for left hand velocity normalization (0-1)
  maxClusterSize?: number;          // Above this distinct pitch class count classify as Cluster
  sustainIncludesBuffer?: boolean;  // Include sustained notes still sounding when detecting new chord
}

// Internal buffered note representation
interface BufferedNote {
  midi: number;
  velocity: number;
  time: number; // high resolution timestamp (performance.now())
}

// Active sounding note (with sustain state)
interface ActiveNote extends BufferedNote {
  sustained: boolean;
  hand: Hand;
}

export type Role = 'Chord' | 'Dyad' | 'BassLine' | 'Arpeggio' | 'Cluster';

export interface ChordEvent {
  hand: Hand;
  name: string | null;  // Detected chord name or null
  inversion?: number;   // 0 root, 1 first inversion, etc.
  notes: number[];      // MIDI note numbers involved (sorted ascending)
  velocities: number[]; // Possibly normalized velocities
  role: Role;
  root?: number;        // Root MIDI (if discerned)
  pitchClasses: number[]; // Distinct pitch classes used
  timestamp: number;    // Emission time
  rawWindowMs: number;  // Aggregation window length used
}

export interface SplitChangeEvent {
  splitMidi: number;
  timestamp: number;
}

// Simple subscription pattern
type ChordCallback = (evt: ChordEvent) => void;
type SplitCallback = (evt: SplitChangeEvent) => void;

interface BufferState {
  notes: BufferedNote[];
  firstTime: number | null;
  timer: ReturnType<typeof setTimeout> | null;
  lastEmissionTime: number; // for rolled chords extension logic
}

const DEFAULTS: Required<MidiInputManagerConfig> = {
  chordWindowMsRight: 50,
  chordWindowMsLeft: 80,
  earlyCloseCountRight: 4,
  earlyCloseCountLeft: 3,
  rollExtensionMsRight: 180,
  rollExtensionMsLeft: 250,
  splitInitialMidi: 60, // Middle C
  splitMin: 52,         // E3
  splitMax: 64,         // E4
  splitAdaptIntervalMs: 1000,
  splitShiftThreshold: 5,
  leftBassArpGapMs: 120,
  velocityBlendRight: 0.5,
  velocityBlendLeft: 0.2,
  maxClusterSize: 7,
  sustainIncludesBuffer: true,
};

export class MidiInputManager {
  private cfg: Required<MidiInputManagerConfig>;
  private splitPoint: number;
  private chordCallbacks: Set<ChordCallback> = new Set();
  private splitCallbacks: Set<SplitCallback> = new Set();

  private bufferL: BufferState = { notes: [], firstTime: null, timer: null, lastEmissionTime: 0 };
  private bufferR: BufferState = { notes: [], firstTime: null, timer: null, lastEmissionTime: 0 };

  private activeNotes: Map<number, ActiveNote> = new Map();
  private pedalDown = false;

  private recentNoteOns: number[] = []; // pitch history for adaptive split
  private adaptTimer: ReturnType<typeof setInterval> | null = null;
  private disposed = false;

  constructor(config: MidiInputManagerConfig = {}) {
    this.cfg = { ...DEFAULTS, ...config };
    this.splitPoint = this.cfg.splitInitialMidi;
    this.startAdaptiveLoop();
  }

  // Public API ---------------------------------------------------------------
  onChord(cb: ChordCallback): () => void {
    this.chordCallbacks.add(cb);
    return () => this.chordCallbacks.delete(cb);
  }

  onSplitChange(cb: SplitCallback): () => void {
    this.splitCallbacks.add(cb);
    return () => this.splitCallbacks.delete(cb);
  }

  getCurrentSplit(): number { return this.splitPoint; }

  dispose() {
    this.disposed = true;
    if (this.bufferL.timer) clearTimeout(this.bufferL.timer);
    if (this.bufferR.timer) clearTimeout(this.bufferR.timer);
    if (this.adaptTimer) clearInterval(this.adaptTimer);
    this.chordCallbacks.clear();
    this.splitCallbacks.clear();
  }

  // Event Entry Points -------------------------------------------------------
  handleNoteOn(midi: number, velocity: number, time: number = performance.now()) {
    if (this.disposed) return;
    const hand: Hand = midi < this.splitPoint ? 'L' : 'R';
    const note: ActiveNote = { midi, velocity, time, sustained: false, hand };
    this.activeNotes.set(midi, note);
    this.recentNoteOns.push(midi);
    this.pushToBuffer(hand, { midi, velocity, time });
  }

  handleNoteOff(midi: number) {
    if (this.disposed) return;
    const existing = this.activeNotes.get(midi);
    if (!existing) return;
    if (this.pedalDown) {
      existing.sustained = true; // prolong until pedal release
    } else {
      this.activeNotes.delete(midi);
    }
  }

  handleControlChange(controller: number, value: number) {
    if (this.disposed) return;
    // Sustain pedal CC64
    if (controller === 64) {
      const down = value >= 64;
      if (down && !this.pedalDown) {
        this.pedalDown = true;
      } else if (!down && this.pedalDown) {
        this.pedalDown = false;
        // Release all sustained notes
        for (const [m, an] of this.activeNotes) {
          if (an.sustained) this.activeNotes.delete(m);
        }
      }
    }
  }

  // Internal Buffer Logic ----------------------------------------------------
  private pushToBuffer(hand: Hand, note: BufferedNote) {
    const buf = hand === 'L' ? this.bufferL : this.bufferR;
    const cfgWindow = hand === 'L' ? this.cfg.chordWindowMsLeft : this.cfg.chordWindowMsRight;
    const earlyCount = hand === 'L' ? this.cfg.earlyCloseCountLeft : this.cfg.earlyCloseCountRight;

    if (buf.firstTime === null) {
      buf.firstTime = note.time;
      buf.notes = [note];
      // Schedule finalize
      buf.timer = setTimeout(() => this.processBuffer(hand), cfgWindow);
    } else {
      buf.notes.push(note);
      // Early close: many notes quickly
      if (buf.notes.length >= earlyCount && (note.time - buf.firstTime) < cfgWindow * 0.6) {
        this.clearTimer(buf);
        this.processBuffer(hand);
        return;
      }
      // Rolled chord extension logic
      const rollExtension = hand === 'L' ? this.cfg.rollExtensionMsLeft : this.cfg.rollExtensionMsRight;
      if ((note.time - buf.firstTime) > cfgWindow && (note.time - buf.firstTime) <= rollExtension) {
        // Allow extension; reschedule timer
        this.clearTimer(buf);
        buf.timer = setTimeout(() => this.processBuffer(hand), Math.max(10, rollExtension - (note.time - buf.firstTime)));
      }
    }
  }

  private processBuffer(hand: Hand) {
    const buf = hand === 'L' ? this.bufferL : this.bufferR;
    if (!buf.firstTime || buf.notes.length === 0) {
      this.resetBuffer(buf);
      return;
    }
    const windowMs = (performance.now() - buf.firstTime);

    // Gather notes (optionally include sustained sounding notes for richer context)
    const noteSet: number[] = buf.notes.map(n => n.midi);
    if (this.cfg.sustainIncludesBuffer) {
      for (const an of this.activeNotes.values()) {
        if (an.hand === hand && an.sustained && !noteSet.includes(an.midi)) {
          noteSet.push(an.midi);
        }
      }
    }
    noteSet.sort((a, b) => a - b);

    const distinctPitchClasses = Array.from(new Set(noteSet.map(n => n % 12))).sort((a, b) => a - b);

    // Derive velocities
    const velocitiesOriginal = buf.notes.map(n => n.velocity);
    const medianVel = this.median(velocitiesOriginal);
    const blend = hand === 'R' ? this.cfg.velocityBlendRight : this.cfg.velocityBlendLeft;
    const velocitiesNormalized = buf.notes.map(v => this.blendVelocity(v.velocity, medianVel, blend));

    // Role classification
    const role = this.classifyRole(hand, noteSet, distinctPitchClasses, windowMs);

    // Chord detection only when meaningful
    let chordName: string | null = null;
    let inversion: number | undefined;
    let root: number | undefined;
    if (role === 'Chord' || role === 'Dyad' || role === 'Cluster') {
      chordName = this.detectChord(distinctPitchClasses);
      if (chordName && noteSet.length > 0) {
        const rootPc = (noteSet[0] % 12);
        // Simple inversion heuristic: find index of bass pitch class in chord intervals order
        const intervals = distinctPitchClasses; // simplified; real mapping could use chord formula
        inversion = intervals.indexOf(rootPc);
        root = noteSet[0];
      }
    }

    const event: ChordEvent = {
      hand,
      name: chordName,
      inversion: inversion !== -1 ? inversion : undefined,
      notes: noteSet,
      velocities: velocitiesNormalized,
      role,
      root,
      pitchClasses: distinctPitchClasses,
      timestamp: performance.now(),
      rawWindowMs: windowMs,
    };

    this.emitChord(event);
    this.resetBuffer(buf);
  }

  private classifyRole(hand: Hand, noteSet: number[], pcs: number[], windowMs: number): Role {
    if (pcs.length >= this.cfg.maxClusterSize) return 'Cluster';
    if (pcs.length >= 3) return 'Chord';
    if (pcs.length === 2) return 'Dyad';
    // Single pitch class cases: differentiate bass line vs arpeggio partial
    if (hand === 'L') {
      if (windowMs > this.cfg.leftBassArpGapMs) return 'BassLine';
    }
    return 'Arpeggio';
  }

  private detectChord(pcs: number[]): string | null {
    // Convert pitch classes (numbers) to symbolic notes for tonal detection. We'll map 0->C,1->C#, ...
    const pcToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const notes = pcs.map(pc => pcToNote[pc]);
    const detected = Chord.detect(notes); // may return multiple names
    if (!detected || detected.length === 0) return null;
    // Choose the simplest (shortest string length) to avoid overly complex names
    return detected.sort((a, b) => a.length - b.length)[0];
  }

  private emitChord(evt: ChordEvent) {
    for (const cb of this.chordCallbacks) cb(evt);
  }

  private clearTimer(buf: BufferState) {
    if (buf.timer) clearTimeout(buf.timer);
    buf.timer = null;
  }

  private resetBuffer(buf: BufferState) {
    this.clearTimer(buf);
    buf.notes = [];
    buf.firstTime = null;
  }

  // Adaptive split logic -----------------------------------------------------
  private startAdaptiveLoop() {
    this.adaptTimer = setInterval(() => this.recomputeSplit(), this.cfg.splitAdaptIntervalMs);
  }

  private recomputeSplit() {
    if (this.recentNoteOns.length < 8) return; // need enough data
    const sorted = [...this.recentNoteOns].sort((a, b) => a - b);
    const lowQuartile = sorted[Math.floor(sorted.length * 0.25)];
    const highQuartile = sorted[Math.floor(sorted.length * 0.75)];
    const center = Math.round((lowQuartile + highQuartile) / 2);
    if (Math.abs(center - this.splitPoint) >= this.cfg.splitShiftThreshold) {
      const newSplit = Math.min(this.cfg.splitMax, Math.max(this.cfg.splitMin, center));
      if (newSplit !== this.splitPoint) {
        this.splitPoint = newSplit;
        this.emitSplitChange();
      }
    }
    // Decay history to prevent runaway drift
    if (this.recentNoteOns.length > 128) this.recentNoteOns.splice(0, this.recentNoteOns.length - 128);
  }

  private emitSplitChange() {
    const evt: SplitChangeEvent = { splitMidi: this.splitPoint, timestamp: performance.now() };
    for (const cb of this.splitCallbacks) cb(evt);
  }

  // Utilities ----------------------------------------------------------------
  private median(values: number[]): number {
    if (values.length === 0) return 64; // fallback
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
  }

  private blendVelocity(original: number, median: number, blend: number): number {
    return Math.round(median + (original - median) * (1 - blend));
  }
}

/*
USAGE EXAMPLE (pseudo-code in a React component):

const manager = useMemo(() => new MidiInputManager(), []);

useEffect(() => {
  const offChord = manager.onChord(evt => {
    console.log('Chord event', evt);
    // -> evt.role === 'Chord' / 'BassLine' etc.
    // -> evt.name maybe 'Cmaj7'
  });
  const offSplit = manager.onSplitChange(evt => {
    console.log('New split point', evt.splitMidi);
  });

  // Assuming WebMidi has been enabled & input selected
  input.addListener('noteon', 'all', e => manager.handleNoteOn(e.note.number, e.velocity));
  input.addListener('noteoff', 'all', e => manager.handleNoteOff(e.note.number));
  input.addListener('controlchange', 'all', e => manager.handleControlChange(e.controller.number, e.value));

  return () => { offChord(); offSplit(); manager.dispose(); };
}, [manager, input]);

*/
