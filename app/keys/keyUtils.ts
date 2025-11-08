import { Key, Interval, Note } from 'tonal';

export interface KeyInfo {
  tonic: string;
  type: 'major' | 'minor';
  alteration: number;
  keySignature: string;
  accidentals: readonly string[];
  scale: readonly string[];
  chords: readonly string[];
  chordsHarmonicFunction: readonly string[];
  grades: readonly string[];
  intervals: readonly string[];
  minorRelative?: string;
  relativeMajor?: string;
  fifths?: number;
}

/**
 * Get information about a musical key
 */
export function getKeyInfo(keyName: string): KeyInfo | null {
  try {
    const keyData = Key.majorKey(keyName);
    if (!keyData.tonic) return null;

    // Build accidentals array from key signature
    const accidentals: string[] = [];
    const alteration = keyData.alteration;
    if (alteration > 0) {
      // Sharps: F C G D A E B
      const sharpOrder = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
      for (let i = 0; i < alteration; i++) {
        accidentals.push(sharpOrder[i] + '♯');
      }
    } else if (alteration < 0) {
      // Flats: B E A D G C F
      const flatOrder = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
      for (let i = 0; i < Math.abs(alteration); i++) {
        accidentals.push(flatOrder[i] + '♭');
      }
    }

    return {
      tonic: keyData.tonic,
      type: 'major',
      alteration: keyData.alteration,
      keySignature: keyData.keySignature,
      accidentals,
      scale: keyData.scale,
      chords: keyData.chords,
      chordsHarmonicFunction: keyData.chordsHarmonicFunction,
      grades: keyData.grades,
      intervals: keyData.intervals,
      minorRelative: keyData.minorRelative,
    };
  } catch {
    return null;
  }
}

/**
 * Get information about a minor key
 */
export function getMinorKeyInfo(keyName: string): KeyInfo | null {
  try {
    const keyData = Key.minorKey(keyName);
    if (!keyData.tonic) return null;

    // Build accidentals array from key signature
    const accidentals: string[] = [];
    const alteration = keyData.alteration;
    if (alteration > 0) {
      // Sharps: F C G D A E B
      const sharpOrder = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
      for (let i = 0; i < alteration; i++) {
        accidentals.push(sharpOrder[i] + '♯');
      }
    } else if (alteration < 0) {
      // Flats: B E A D G C F
      const flatOrder = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
      for (let i = 0; i < Math.abs(alteration); i++) {
        accidentals.push(flatOrder[i] + '♭');
      }
    }

    return {
      tonic: keyData.tonic,
      type: 'minor',
      alteration: keyData.alteration,
      keySignature: keyData.keySignature,
      accidentals,
      scale: keyData.natural.scale,
      chords: keyData.harmonic.chords,
      chordsHarmonicFunction: keyData.harmonic.chordsHarmonicFunction,
      grades: keyData.natural.grades,
      intervals: keyData.natural.intervals,
      relativeMajor: keyData.relativeMajor,
    };
  } catch {
    return null;
  }
}

/**
 * Get all major keys in circle of fifths order
 */
export function getAllMajorKeys(): KeyInfo[] {
  const tonics = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
  return tonics
    .map(tonic => getKeyInfo(tonic))
    .filter((key): key is KeyInfo => key !== null);
}

/**
 * Get all minor keys in circle of fifths order
 */
export function getAllMinorKeys(): KeyInfo[] {
  const tonics = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D'];
  return tonics
    .map(tonic => getMinorKeyInfo(tonic))
    .filter((key): key is KeyInfo => key !== null);
}

/**
 * Get circle of fifths data for visualization
 */
export interface CircleOfFifthsData {
  majorKey: KeyInfo;
  minorKey: KeyInfo;
  angle: number;
  position: number;
}

export function getCircleOfFifthsData(): CircleOfFifthsData[] {
  const majorKeys = getAllMajorKeys();
  const minorKeys = getAllMinorKeys();

  return majorKeys.map((majorKey, index) => ({
    majorKey,
    minorKey: minorKeys[index],
    angle: (index * 30) - 90, // Start at top (12 o'clock)
    position: index,
  }));
}

/**
 * Get key signature symbol (sharps or flats)
 */
export function getKeySignatureSymbol(alteration: number): string {
  if (alteration === 0) return '';
  const symbol = alteration > 0 ? '♯' : '♭';
  return `${Math.abs(alteration)}${symbol}`;
}

/**
 * Get parallel major/minor key
 */
export function getParallelKey(keyName: string): string {
  // Parallel keys share the same tonic but different modes
  return keyName; // Same tonic, just switch between major/minor
}

/**
 * Format accidentals for display
 */
export function formatAccidentals(accidentals: string[]): string {
  if (accidentals.length === 0) return 'No sharps or flats';
  return accidentals.join(', ');
}

/**
 * Interval calculation utilities for comparing keys
 */

/**
 * Calculate the interval distance between two notes in semitones
 */
export function getSemitoneDistance(note1: string, note2: string): number {
  const chroma1 = Note.chroma(note1);
  const chroma2 = Note.chroma(note2);

  if (chroma1 === undefined || chroma2 === undefined) return 0;

  let distance = chroma2 - chroma1;
  if (distance < 0) distance += 12;

  return distance;
}

/**
 * Get the interval name between two notes
 */
export function getIntervalName(note1: string, note2: string): string {
  try {
    const interval = Interval.distance(note1, note2);
    return interval || 'Perfect Unison';
  } catch {
    return 'Unknown';
  }
}

/**
 * Compare two scales and find the differences
 * Returns the scale degrees that differ
 */
export interface ScaleDifference {
  degree: number; // 1-7 scale degree
  key1Note: string;
  key2Note: string;
  semitonesDiff: number; // positive = raised, negative = lowered
  intervalChange: string;
}

export function compareScales(key1: KeyInfo, key2: KeyInfo): ScaleDifference[] {
  const differences: ScaleDifference[] = [];
  const maxLength = Math.max(key1.scale.length, key2.scale.length);

  for (let i = 0; i < maxLength; i++) {
    const note1 = key1.scale[i];
    const note2 = key2.scale[i];

    if (!note1 || !note2) continue;

    // Normalize notes to compare (remove octave numbers)
    const normalizedNote1 = note1.replace(/\d+/g, '');
    const normalizedNote2 = note2.replace(/\d+/g, '');

    if (normalizedNote1 !== normalizedNote2) {
      const semitones = getSemitoneDistance(normalizedNote1, normalizedNote2);
      const adjustedSemitones = semitones > 6 ? semitones - 12 : semitones;

      differences.push({
        degree: i + 1,
        key1Note: normalizedNote1,
        key2Note: normalizedNote2,
        semitonesDiff: adjustedSemitones,
        intervalChange: adjustedSemitones > 0 ? `+${adjustedSemitones} semitone${Math.abs(adjustedSemitones) > 1 ? 's' : ''}` : `${adjustedSemitones} semitone${Math.abs(adjustedSemitones) > 1 ? 's' : ''}`
      });
    }
  }

  return differences;
}

/**
 * Calculate shared notes between two scales
 */
export interface SharedNotesInfo {
  sharedNotes: string[];
  uniqueToKey1: string[];
  uniqueToKey2: string[];
  sharedPercentage: number;
}

export function getSharedNotes(key1: KeyInfo, key2: KeyInfo): SharedNotesInfo {
  const notes1Set = new Set(key1.scale.map(n => n.replace(/\d+/g, '')));
  const notes2Set = new Set(key2.scale.map(n => n.replace(/\d+/g, '')));

  const sharedNotes: string[] = [];
  const uniqueToKey1: string[] = [];
  const uniqueToKey2: string[] = [];

  notes1Set.forEach(note => {
    if (notes2Set.has(note)) {
      sharedNotes.push(note);
    } else {
      uniqueToKey1.push(note);
    }
  });

  notes2Set.forEach(note => {
    if (!notes1Set.has(note)) {
      uniqueToKey2.push(note);
    }
  });

  const totalNotes = Math.max(notes1Set.size, notes2Set.size);
  const sharedPercentage = totalNotes > 0 ? Math.round((sharedNotes.length / totalNotes) * 100) : 0;

  return {
    sharedNotes,
    uniqueToKey1,
    uniqueToKey2,
    sharedPercentage
  };
}

/**
 * Get comprehensive key relationship information
 */
export interface KeyRelationship {
  type: 'parallel' | 'relative';
  rootInterval: string;
  rootSemitones: number;
  scaleDifferences: ScaleDifference[];
  sharedNotes: SharedNotesInfo;
  keySignatureDiff: number;
}

export function getKeyRelationship(key1: KeyInfo, key2: KeyInfo): KeyRelationship {
  const isParallel = key1.tonic === key2.tonic;
  const rootSemitones = getSemitoneDistance(key1.tonic, key2.tonic);
  const rootInterval = getIntervalName(key1.tonic, key2.tonic);
  const scaleDifferences = compareScales(key1, key2);
  const sharedNotes = getSharedNotes(key1, key2);
  const keySignatureDiff = key2.alteration - key1.alteration;

  return {
    type: isParallel ? 'parallel' : 'relative',
    rootInterval,
    rootSemitones,
    scaleDifferences,
    sharedNotes,
    keySignatureDiff
  };
}
