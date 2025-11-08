/**
 * Unified Note Color System
 * 
 * Provides consistent coloring for musical notes across the application.
 * Each pitch class (C, D, E, etc.) has a base color, and octaves are
 * distinguished by lightness variations - lower octaves are darker,
 * higher octaves are lighter.
 */

/**
 * Base color mapping for each pitch class (chromatic scale)
 * Using vibrant colors for better visibility, compatible with light/dark themes
 */
export const BASE_NOTE_COLORS: Record<string, string> = {
  'C': '#E53935',    // Red
  'C#': '#F4511E',   // Deep Orange
  'Db': '#F4511E',   // Deep Orange (enharmonic equivalent)
  'D': '#FB8C00',    // Orange
  'D#': '#FDD835',   // Yellow
  'Eb': '#FDD835',   // Yellow (enharmonic equivalent)
  'E': '#7CB342',    // Light Green
  'F': '#43A047',    // Green
  'F#': '#00897B',   // Teal
  'Gb': '#00897B',   // Teal (enharmonic equivalent)
  'G': '#00ACC1',    // Cyan
  'G#': '#039BE5',   // Light Blue
  'Ab': '#039BE5',   // Light Blue (enharmonic equivalent)
  'A': '#5E35B1',    // Deep Purple
  'A#': '#8E24AA',   // Purple
  'Bb': '#8E24AA',   // Purple (enharmonic equivalent)
  'B': '#D81B60'     // Pink
};

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  const sanitized = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(sanitized.substring(0, 2), 16) / 255;
  const g = parseInt(sanitized.substring(2, 4), 16) / 255;
  const b = parseInt(sanitized.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust color lightness based on octave
 */
function adjustLightness(baseColor: string, octave: number): string {
  const hsl = hexToHSL(baseColor);

  // Make each octave distinct with a linear progression
  // Octave 0: -36% (darkest)
  // Octave 4: 0% (middle C, base color)
  // Octave 8: +36% (lightest)
  const lightnessAdjustment = (octave - 4) * 9; // 9% per octave from middle C

  const newLightness = Math.max(15, Math.min(85, hsl.l + lightnessAdjustment));

  return hslToHex(hsl.h, hsl.s, newLightness);
}

/**
 * Options for getNoteColor function
 */
export interface NoteColorOptions {
  /** Alpha/opacity value (0-1) */
  alpha?: number;
  /** Force a specific theme (overrides default) */
  theme?: 'light' | 'dark';
  /** Additional lightness adjustment (-100 to 100) */
  lightnessOffset?: number;
}

/**
 * Get the color for a note, optionally adjusted for octave
 * 
 * @param noteName - Note name (e.g., 'C', 'C#', 'Db')
 * @param octave - Optional octave number (0-9). If provided, color will be adjusted for pitch
 * @param options - Optional configuration
 * @returns Hex color string or rgba if alpha is specified
 * 
 * @example
 * getNoteColor('C')       // '#E53935' (base red)
 * getNoteColor('C', 2)    // '#B71C1C' (darker red for low C)
 * getNoteColor('C', 4)    // '#E53935' (standard red for middle C)
 * getNoteColor('C', 7)    // '#FF6659' (lighter red for high C)
 * getNoteColor('C', 4, { alpha: 0.5 }) // 'rgba(229, 57, 53, 0.5)'
 */
export function getNoteColor(
  noteName: string,
  octave?: number,
  options?: NoteColorOptions
): string {
  // Normalize note name (handle case sensitivity)
  const normalizedNote = noteName.charAt(0).toUpperCase() + noteName.slice(1);

  // Get base color for the pitch class
  const baseColor = BASE_NOTE_COLORS[normalizedNote];

  if (!baseColor) {
    return '#888888'; // Gray fallback
  }

  // If no octave specified, return base color
  let finalColor = baseColor;

  // Apply octave-based lightness adjustment
  if (octave !== undefined && octave !== null) {
    finalColor = adjustLightness(baseColor, octave);
  }

  // Apply lightnessOffset if specified
  if (options?.lightnessOffset !== undefined) {
    const hsl = hexToHSL(finalColor);
    const newLightness = Math.max(15, Math.min(85, hsl.l + options.lightnessOffset));
    finalColor = hslToHex(hsl.h, hsl.s, newLightness);
  }

  // Apply alpha if specified
  if (options?.alpha !== undefined) {
    const hex = finalColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${options.alpha})`;
  }

  return finalColor;
}

/**
 * Get colors for an array of notes
 * 
 * @param notes - Array of note objects with note name and optional octave
 * @returns Array of color strings
 * 
 * @example
 * getNoteColors([
 *   { note: 'C', octave: 4 },
 *   { note: 'E', octave: 4 },
 *   { note: 'G', octave: 4 }
 * ])
 */
export function getNoteColors(
  notes: Array<{ note: string; octave?: number }>,
  options?: NoteColorOptions
): string[] {
  return notes.map(({ note, octave }) => getNoteColor(note, octave, options));
}

/**
 * Get all colors for a chromatic scale (useful for color palettes)
 */
export function getChromaticColors(): Record<string, string> {
  return { ...BASE_NOTE_COLORS };
}

/**
 * Parse a note string like "C4" into note name and octave
 */
export function parseNoteString(noteString: string): { note: string; octave: number } | null {
  const match = noteString.match(/^([A-Ga-g][#b]?)(\d+)$/);
  if (!match) return null;

  return {
    note: match[1],
    octave: parseInt(match[2], 10)
  };
}

/**
 * Get color from a note string like "C4"
 */
export function getColorFromNoteString(
  noteString: string,
  options?: NoteColorOptions
): string {
  const parsed = parseNoteString(noteString);
  if (!parsed) {
    return '#888888';
  }

  return getNoteColor(parsed.note, parsed.octave, options);
}
