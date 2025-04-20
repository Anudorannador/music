import type { ScaleInfo } from './scaleUtils';
import { getScaleFamily, getScaleNoteCount } from './scaleUtils';

export interface ScaleFilters {
  tonic: string;
  scaleType: string;
  noteCount: number | null;
  family: string;
  searchQuery: string;
}

export const DEFAULT_FILTERS: ScaleFilters = {
  tonic: 'all',
  scaleType: 'all',
  noteCount: null,
  family: 'all',
  searchQuery: '',
};

/**
 * Filter scales based on the given criteria
 */
export function filterScales(
  scales: ScaleInfo[],
  filters: ScaleFilters
): ScaleInfo[] {
  return scales.filter(scale => {
    // Filter by tonic
    if (filters.tonic !== 'all' && scale.tonic !== filters.tonic) {
      return false;
    }

    // Filter by scale type
    if (filters.scaleType !== 'all' && scale.type !== filters.scaleType) {
      return false;
    }

    // Filter by note count
    if (filters.noteCount !== null && getScaleNoteCount(scale) !== filters.noteCount) {
      return false;
    }

    // Filter by family
    if (filters.family !== 'all' && getScaleFamily(scale.type) !== filters.family) {
      return false;
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const nameMatch = scale.name.toLowerCase().includes(query);
      const typeMatch = scale.type.toLowerCase().includes(query);
      const notesMatch = scale.notes.some(note => note.toLowerCase().includes(query));

      if (!nameMatch && !typeMatch && !notesMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get unique tonics from scales
 */
export function getUniqueTonics(scales: ScaleInfo[]): string[] {
  const tonics = new Set(scales.map(scale => scale.tonic));
  return Array.from(tonics).sort((a, b) => {
    const order = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return order.indexOf(a) - order.indexOf(b);
  });
}

/**
 * Get unique scale types from scales
 */
export function getUniqueScaleTypes(scales: ScaleInfo[]): string[] {
  const types = new Set(scales.map(scale => scale.type));
  return Array.from(types).sort();
}

/**
 * Get unique note counts from scales
 */
export function getUniqueNoteCounts(scales: ScaleInfo[]): number[] {
  const counts = new Set(scales.map(scale => getScaleNoteCount(scale)));
  return Array.from(counts).sort((a, b) => a - b);
}

/**
 * Get unique families from scales
 */
export function getUniqueFamilies(scales: ScaleInfo[]): string[] {
  const families = new Set(scales.map(scale => getScaleFamily(scale.type)));
  return Array.from(families).sort();
}
