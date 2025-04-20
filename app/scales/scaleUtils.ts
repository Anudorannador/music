import { Scale, Note, Interval } from 'tonal';

/**
 * Scale Utilities using Tonal library
 * 
 * This module provides helper functions for working with musical scales,
 * leveraging the Tonal library for standardized music theory operations.
 */

export interface ScaleInfo {
  name: string;
  type: string;
  tonic: string;
  notes: string[];
  intervals: string[];
  aliases: string[];
  chords: string[];
  empty: boolean;
}

/**
 * Get detailed information about a scale
 */
function getScaleInfo(tonic: string, scaleType: string): ScaleInfo {
  const scaleName = `${tonic} ${scaleType}`;
  const scale = Scale.get(scaleName);

  return {
    name: scale.name || scaleName,
    type: scale.type || scaleType,
    tonic: scale.tonic || tonic,
    notes: scale.notes || [],
    intervals: scale.intervals || [],
    aliases: scale.aliases || [],
    chords: Scale.scaleChords(scaleType),
    empty: scale.empty || false,
  };
}

/**
 * Get all scales across all tonics
 */
export function getAllScales(): ScaleInfo[] {
  const tonics = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const scaleTypes = Scale.names();

  const scales: ScaleInfo[] = [];
  tonics.forEach(tonic => {
    scaleTypes.forEach(type => {
      const scale = getScaleInfo(tonic, type);
      if (!scale.empty) {
        scales.push(scale);
      }
    });
  });

  return scales;
}

/**
 * Get the number of notes in a scale
 */
export function getScaleNoteCount(scale: ScaleInfo): number {
  return scale.notes.length;
}

/**
 * Get interval names for display
 */
export function getIntervalNames(intervals: string[]): string[] {
  return intervals.map(interval => {
    const info = Interval.get(interval);
    return info.name || interval;
  });
}

/**
 * Categorize scale types into families
 */
export function getScaleFamily(scaleType: string): string {
  const type = scaleType.toLowerCase();

  if (type.includes('major') || type.includes('ionian')) return 'Major';
  if (type.includes('minor') || type.includes('aeolian')) return 'Minor';
  if (type.includes('pentatonic')) return 'Pentatonic';
  if (type.includes('blues')) return 'Blues';
  if (['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'].some(mode => type.includes(mode))) {
    return 'Modes';
  }
  if (type.includes('harmonic') || type.includes('melodic')) return 'Harmonic/Melodic';
  if (type.includes('chromatic') || type.includes('whole')) return 'Symmetric';

  return 'Other';
}

/**
 * Get MIDI note numbers for a scale (for playback)
 * @param scale Scale information
 * @param octave Starting octave (default: 4)
 */
export function getScaleMidiNotes(scale: ScaleInfo, octave: number = 4): number[] {
  return scale.notes
    .map(note => Note.midi(`${note}${octave}`))
    .filter((midi): midi is number => midi !== null);
}

/**
 * Get degree names (Tonic, Supertonic, etc.)
 */
export function getScaleDegreeNames(): string[] {
  return [
    'Tonic (I)',
    'Supertonic (II)',
    'Mediant (III)',
    'Subdominant (IV)',
    'Dominant (V)',
    'Submediant (VI)',
    'Leading Tone (VII)',
    'Octave (VIII)',
  ];
}
