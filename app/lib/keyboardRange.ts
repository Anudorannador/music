// Shared keyboard range utilities for compact visual keyboards
// Goal: Given a minimum MIDI note, snap left to the nearest C or F and
// return a two-octave range suitable for display on react-piano.

export const PIANO_MIN_MIDI = 21;  // A0
export const PIANO_MAX_MIDI = 108; // C8

/**
 * Snap a MIDI note left to the nearest C or F within the same/previous octave.
 * C => midi % 12 === 0, F => midi % 12 === 5
 */
export function snapLeftToCOrF(minMidi: number): number {
  const noteInOctave = ((minMidi % 12) + 12) % 12; // normalize
  if (noteInOctave >= 5) {
    // F or above
    return minMidi - (noteInOctave - 5);
  }
  // C–E
  if (noteInOctave === 0) return minMidi; // already C
  // Go to F in previous octave
  return minMidi - noteInOctave - 7;
}

/**
 * Compute a compact two-octave display range from a minimum MIDI note.
 * Ensures bounds within piano range and leaves room for the span.
 */
export function rangeFromMinMidiTwoOctaves(minMidi: number): { first: number; last: number } {
  let first = snapLeftToCOrF(minMidi);
  // Keep within keyboard limits and ensure room for 24 semitones
  first = Math.max(PIANO_MIN_MIDI, Math.min(first, PIANO_MAX_MIDI - 24));
  const last = Math.min(PIANO_MAX_MIDI, first + 24);
  return { first, last };
}
