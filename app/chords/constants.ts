// Constants for the chord application

// Re-export unified note color system
export {
  BASE_NOTE_COLORS as NOTE_COLORS,
  getNoteColor,
  getNoteColors,
  getChromaticColors,
  parseNoteString,
  getColorFromNoteString,
  type NoteColorOptions
} from '@lib/noteColors';

// Keyboard display limits
export const MIN_DISPLAYABLE_OCTAVE = 1;
export const MAX_DISPLAYABLE_OCTAVE = 8; // C8 is the highest note to display
export const MAX_OCTAVES_TO_DISPLAY = 3; // Maximum number of octaves to display on keyboard

// Music display settings
export const MUSIC_DISPLAY_OPTIONS = {
  autoResize: false,
  drawTitle: false,
  drawSubtitle: false,
  drawPartNames: false,
  drawMeasureNumbers: false,
  drawTimeSignatures: false,
  drawingParameters: 'compacttight',
  pageFormat: 'Landscape'
};