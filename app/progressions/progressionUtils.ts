// Utility functions for chord progression handling
import { RomanNumeral, DIATONIC_CHORDS, CHORD_FUNCTIONS } from './constants';

export interface ChordInProgression {
  romanNumeral: RomanNumeral;
  chordSymbol: string; // Actual chord like "C", "Dm7", etc.
  root: string; // Root note
  quality: string; // major, minor, dominant7, etc.
  function: string; // Tonic, Subdominant, Dominant
}

// All notes in chromatic order
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Scale degree to semitone mapping
const SCALE_DEGREES = {
  major: [0, 2, 4, 5, 7, 9, 11], // Ionian
  minor: [0, 2, 3, 5, 7, 8, 10], // Natural minor (Aeolian)
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10]
};

/**
 * Get note index in chromatic scale
 */
function getNoteIndex(note: string): number {
  return NOTES.indexOf(note);
}

/**
 * Transpose a note by semitones
 */
export function transposeNote(note: string, semitones: number): string {
  const index = getNoteIndex(note);
  if (index === -1) return note;

  const newIndex = (index + semitones + 12) % 12;
  return NOTES[newIndex];
}

/**
 * Get the scale notes for a given key and mode
 */
export function getScaleNotes(key: string, mode: keyof typeof SCALE_DEGREES = 'major'): string[] {
  const rootIndex = getNoteIndex(key);
  if (rootIndex === -1) return [];

  const degrees = SCALE_DEGREES[mode];
  return degrees.map(semitones => NOTES[(rootIndex + semitones) % 12]);
}

/**
 * Parse Roman numeral to get degree and quality information
 */
function parseRomanNumeral(numeral: RomanNumeral): {
  degree: number;
  quality: 'major' | 'minor' | 'diminished' | 'augmented';
  extension: string;
  accidental: '' | 'b' | '#';
} {
  let degree = 0;
  let quality: 'major' | 'minor' | 'diminished' | 'augmented' = 'major';
  let extension = '';
  let accidental: '' | 'b' | '#' = '';

  // Remove extensions to get base numeral
  let baseNumeral = numeral.toString();

  // Check for accidentals (flat or sharp)
  if (baseNumeral.startsWith('b')) {
    accidental = 'b';
    baseNumeral = baseNumeral.substring(1);
  } else if (baseNumeral.startsWith('#')) {
    accidental = '#';
    baseNumeral = baseNumeral.substring(1);
  }

  // Extract extensions (7, maj7, m7, etc.)
  const extensionMatch = baseNumeral.match(/(maj7|m7|7|ø7|o|dim|aug|sus4|sus2)$/i);
  if (extensionMatch) {
    extension = extensionMatch[1];
    baseNumeral = baseNumeral.substring(0, baseNumeral.length - extension.length);
  }

  // Determine quality from case
  const isLowerCase = baseNumeral.toLowerCase() === baseNumeral;
  quality = isLowerCase ? 'minor' : 'major';

  // Handle diminished and augmented
  if (extension === 'o' || extension === 'dim' || extension === 'ø7') {
    quality = 'diminished';
  } else if (extension === 'aug') {
    quality = 'augmented';
  }

  // Convert Roman numeral to degree (1-7)
  const romanMap: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7
  };

  degree = romanMap[baseNumeral] || 1;

  return { degree, quality, extension, accidental };
}

/**
 * Get chord symbol from Roman numeral in a given key
 */
export function getChordFromRomanNumeral(
  numeral: RomanNumeral,
  key: string,
  mode: 'major' | 'minor' = 'major'
): ChordInProgression {
  const scaleNotes = getScaleNotes(key, mode);
  const parsed = parseRomanNumeral(numeral);

  // Get root note from scale degree
  let root = scaleNotes[parsed.degree - 1];

  // Apply accidental if present
  if (parsed.accidental === 'b') {
    root = transposeNote(root, -1);
  } else if (parsed.accidental === '#') {
    root = transposeNote(root, 1);
  }

  // Build chord symbol
  let chordSymbol = root;

  // Add quality suffix
  if (parsed.quality === 'minor' && !parsed.extension.startsWith('m')) {
    chordSymbol += 'm';
  } else if (parsed.quality === 'diminished') {
    if (parsed.extension === 'ø7') {
      chordSymbol += 'ø7';
    } else if (parsed.extension === 'dim7' || parsed.extension === 'o') {
      chordSymbol += 'dim';
    } else {
      chordSymbol += 'dim';
    }
  } else if (parsed.quality === 'augmented') {
    chordSymbol += 'aug';
  }

  // Add extension
  if (parsed.extension && !['o', 'dim', 'aug', 'ø7'].includes(parsed.extension)) {
    // Handle special cases
    if (parsed.extension === 'm7' && parsed.quality === 'minor') {
      chordSymbol += '7';
    } else {
      chordSymbol += parsed.extension;
    }
  }

  // Get function
  const baseRoman = numeral.toString().replace(/[^IViv]/gi, '').toUpperCase();
  const chordFunction = CHORD_FUNCTIONS[baseRoman as keyof typeof CHORD_FUNCTIONS] || 'Other';

  return {
    romanNumeral: numeral,
    chordSymbol,
    root,
    quality: parsed.quality,
    function: chordFunction
  };
}

/**
 * Transpose an entire progression to a new key
 */
export function transposeProgression(
  progression: RomanNumeral[],
  originalKey: string,
  newKey: string,
  mode: 'major' | 'minor' = 'major'
): ChordInProgression[] {
  return progression.map(numeral => getChordFromRomanNumeral(numeral, newKey, mode));
}

/**
 * Get all chords in a progression for a specific key
 */
export function resolveProgression(
  progression: RomanNumeral[],
  key: string,
  mode: 'major' | 'minor' = 'major'
): ChordInProgression[] {
  return progression.map(numeral => getChordFromRomanNumeral(numeral, key, mode));
}

/**
 * Analyze common tones between two chords
 */
// Placeholder removed: implement when chord tone comparison logic is added

/**
 * Get suggested voice leading between two chords
 */
// Placeholder removed: implement when voice leading algorithm is added

/**
 * Get all available keys
 */
export function getAllKeys(): string[] {
  return NOTES;
}

/**
 * Get diatonic chords for a key and mode
 */
export function getDiatonicChords(
  key: string,
  mode: 'major' | 'minor' = 'major'
): ChordInProgression[] {
  const diatonicPattern = DIATONIC_CHORDS[mode];

  return diatonicPattern.map((chord) => {
    const numeral = chord.numeral as RomanNumeral;
    return getChordFromRomanNumeral(numeral, key, mode);
  });
}

/**
 * Convert chord symbol to notes for playback
 */
export function chordSymbolToNotes(chordSymbol: string, octave: number = 4): Array<{ note: string; octave: number }> {
  // Parse chord symbol
  const rootMatch = chordSymbol.match(/^([A-G][#b]?)/);
  if (!rootMatch) return [];

  const root = rootMatch[1];
  const rootIndex = getNoteIndex(root);

  // Determine chord type from suffix
  const suffix = chordSymbol.substring(root.length);

  // Get intervals based on chord type
  let intervals: number[] = [];

  if (suffix === '' || suffix === 'maj' || suffix === 'M') {
    // Major triad: root, major 3rd, perfect 5th
    intervals = [0, 4, 7];
  } else if (suffix === 'm' || suffix === 'min' || suffix === '-') {
    // Minor triad: root, minor 3rd, perfect 5th
    intervals = [0, 3, 7];
  } else if (suffix === 'dim' || suffix === 'o') {
    // Diminished triad: root, minor 3rd, diminished 5th
    intervals = [0, 3, 6];
  } else if (suffix === 'aug' || suffix === '+') {
    // Augmented triad: root, major 3rd, augmented 5th
    intervals = [0, 4, 8];
  } else if (suffix === '7') {
    // Dominant 7th: root, major 3rd, perfect 5th, minor 7th
    intervals = [0, 4, 7, 10];
  } else if (suffix === 'maj7' || suffix === 'M7' || suffix === 'Δ7') {
    // Major 7th: root, major 3rd, perfect 5th, major 7th
    intervals = [0, 4, 7, 11];
  } else if (suffix === 'm7' || suffix === 'min7' || suffix === '-7') {
    // Minor 7th: root, minor 3rd, perfect 5th, minor 7th
    intervals = [0, 3, 7, 10];
  } else if (suffix === 'mMaj7' || suffix === 'mM7') {
    // Minor-major 7th: root, minor 3rd, perfect 5th, major 7th
    intervals = [0, 3, 7, 11];
  } else if (suffix === 'dim7' || suffix === 'o7') {
    // Diminished 7th: root, minor 3rd, diminished 5th, diminished 7th
    intervals = [0, 3, 6, 9];
  } else if (suffix === 'ø7' || suffix === 'm7b5') {
    // Half-diminished 7th: root, minor 3rd, diminished 5th, minor 7th
    intervals = [0, 3, 6, 10];
  } else if (suffix === 'sus4') {
    // Suspended 4th: root, perfect 4th, perfect 5th
    intervals = [0, 5, 7];
  } else if (suffix === 'sus2') {
    // Suspended 2nd: root, major 2nd, perfect 5th
    intervals = [0, 2, 7];
  } else if (suffix === '6') {
    // Major 6th: root, major 3rd, perfect 5th, major 6th
    intervals = [0, 4, 7, 9];
  } else if (suffix === 'm6') {
    // Minor 6th: root, minor 3rd, perfect 5th, major 6th
    intervals = [0, 3, 7, 9];
  } else if (suffix === '9') {
    // Dominant 9th: root, major 3rd, perfect 5th, minor 7th, major 9th
    intervals = [0, 4, 7, 10, 14];
  } else if (suffix === 'maj9' || suffix === 'M9') {
    // Major 9th: root, major 3rd, perfect 5th, major 7th, major 9th
    intervals = [0, 4, 7, 11, 14];
  } else if (suffix === 'm9') {
    // Minor 9th: root, minor 3rd, perfect 5th, minor 7th, major 9th
    intervals = [0, 3, 7, 10, 14];
  } else {
    // Default to major triad
    intervals = [0, 4, 7];
  }

  // Convert intervals to actual notes
  const notes: Array<{ note: string; octave: number }> = [];

  intervals.forEach(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const noteName = NOTES[noteIndex];

    // Calculate octave (notes beyond 12 semitones go to next octave)
    const noteOctave = octave + Math.floor((rootIndex + interval) / 12);

    notes.push({ note: noteName, octave: noteOctave });
  });

  return notes;
}

/**
 * Get all available modes
 */
export function getAllModes(): Array<{ value: keyof typeof SCALE_DEGREES; label: string }> {
  return [
    { value: 'major', label: 'Major (Ionian)' },
    { value: 'minor', label: 'Natural Minor (Aeolian)' },
    { value: 'harmonicMinor', label: 'Harmonic Minor' },
    { value: 'melodicMinor', label: 'Melodic Minor' },
    { value: 'dorian', label: 'Dorian' },
    { value: 'phrygian', label: 'Phrygian' },
    { value: 'lydian', label: 'Lydian' },
    { value: 'mixolydian', label: 'Mixolydian' },
    { value: 'locrian', label: 'Locrian' }
  ];
}
