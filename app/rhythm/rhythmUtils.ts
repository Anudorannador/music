import { DurationValue, TimeSignature } from 'tonal';

/**
 * Rhythm Utilities using Tonal library
 * 
 * This module provides helper functions for working with musical rhythm,
 * leveraging the Tonal library for standardized music theory operations.
 */

/**
 * Get all available duration names from Tonal
 * Useful for documentation or UI dropdowns
 */
export function getAllDurationNames(): string[] {
  return DurationValue.names();
}

/**
 * Get all duration shorthands from Tonal
 * Returns: ["dl", "l", "d", "w", "h", "q", "e", "s", "t", "sf", "h", "th"]
 */
export function getAllDurationShorthands(): string[] {
  return DurationValue.shorthands();
}

/**
 * Calculate the fractional value of a duration
 * Example: 'q' (quarter) returns [1, 4]
 *          'q.' (dotted quarter) returns [3, 8]
 */
export function getDurationFraction(duration: string): [number, number] | undefined {
  const info = DurationValue.get(duration);
  return info.empty ? undefined : info.fraction;
}

/**
 * Get the numeric value of a duration relative to a whole note
 * Example: 'q' (quarter) returns 0.25
 *          'q.' (dotted quarter) returns 0.375
 */
export function getDurationValue(duration: string): number | undefined {
  const info = DurationValue.get(duration);
  return info.empty ? undefined : info.value;
}

/**
 * Analyze a time signature and return its properties
 * Returns information about whether it's simple, compound, regular, irregular, or irrational
 */
export function analyzeTimeSignature(beats: number, beatType: number) {
  const ts = TimeSignature.get([beats, beatType]);

  if (ts.empty) {
    return null;
  }

  return {
    name: ts.name,
    type: ts.type, // 'simple', 'compound', 'regular', 'irregular', 'irrational'
    upper: ts.upper,
    lower: ts.lower,
    additive: ts.additive,
    // Additional computed properties
    isSimple: ts.type === 'simple',
    isCompound: ts.type === 'compound',
    beatsPerMeasure: ts.upper,
    beatUnit: ts.lower,
  };
}

/**
 * Get common time signatures with their analysis
 */
export function getCommonTimeSignatures() {
  const common = [
    [2, 4],  // 2/4
    [3, 4],  // 3/4
    [4, 4],  // 4/4 (common time)
    [6, 8],  // 6/8
    [9, 8],  // 9/8
    [12, 8], // 12/8
    [5, 4],  // 5/4
    [7, 8],  // 7/8
  ] as const;

  return common.map(([beats, beatType]) => analyzeTimeSignature(beats, beatType));
}

/**
 * Calculate the duration of a measure in beats
 * based on the time signature and tempo
 */
export function calculateMeasureDuration(
  beats: number,
  beatType: number,
  bpm: number
): number {
  // Duration of one beat in seconds
  const beatDuration = 60 / bpm;

  // Adjust for beat type (quarter note = 4)
  const beatAdjustment = 4 / beatType;

  // Total measure duration
  return beats * beatDuration * beatAdjustment;
}

/**
 * Convert our internal duration units (where 16 = quarter note)
 * to Tonal duration names
 */
export function internalDurationToTonal(duration: number): string | null {
  const map: Record<number, string> = {
    4: 's',    // sixteenth (semiquaver)
    8: 'e',    // eighth (quaver)
    12: 'e.',  // dotted eighth
    16: 'q',   // quarter (crotchet)
    24: 'q.',  // dotted quarter
    32: 'h',   // half (minim)
    48: 'h.',  // dotted half
    64: 'w',   // whole (semibreve)
  };

  return map[duration] || null;
}

/**
 * Get detailed information about a duration using Tonal
 * including alternative names and musical notation
 */
export function getDurationDetails(duration: number) {
  const tonalName = internalDurationToTonal(duration);
  if (!tonalName) {
    return null;
  }

  const info = DurationValue.get(tonalName);

  return {
    internalValue: duration,
    tonalName: info.name,
    shorthand: info.shorthand,
    value: info.value,
    fraction: info.fraction,
    dots: info.dots.length,
    alternativeNames: info.names,
  };
}

/**
 * Validate if a pattern fits within a given time signature
 */
export function validatePattern(
  pattern: number[],
  timeBeats: number,
  beatType: number
): boolean {
  const totalDuration = pattern.reduce((sum, dur) => sum + dur, 0);

  // Our internal unit: 16 = quarter note
  const unitsPerBeat = 16 / (4 / beatType);
  const expectedTotalUnits = timeBeats * unitsPerBeat;

  return totalDuration === expectedTotalUnits;
}
