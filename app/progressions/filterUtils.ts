// Filter utility functions for chord progressions
import { ChordProgression } from './constants';

export interface ProgressionFilters {
  searchQuery: string;
  genre: string;
  mood: string;
  complexity: string;
  minLength: number | null;
  maxLength: number | null;
}

export const DEFAULT_FILTERS: ProgressionFilters = {
  searchQuery: '',
  genre: 'all',
  mood: 'all',
  complexity: 'all',
  minLength: null,
  maxLength: null
};

/**
 * Filter progressions based on filters
 */
export function filterProgressions(
  progressions: ChordProgression[],
  filters: ProgressionFilters
): ChordProgression[] {
  return progressions.filter(progression => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = progression.name.toLowerCase().includes(query);
      const matchesDescription = progression.description.toLowerCase().includes(query);
      const matchesChords = progression.chords.some(chord =>
        chord.toLowerCase().includes(query)
      );

      if (!matchesName && !matchesDescription && !matchesChords) {
        return false;
      }
    }

    // Genre filter
    if (filters.genre !== 'all') {
      if (!progression.genre.includes(filters.genre)) {
        return false;
      }
    }

    // Mood filter
    if (filters.mood !== 'all') {
      if (!progression.mood.includes(filters.mood)) {
        return false;
      }
    }

    // Complexity filter
    if (filters.complexity !== 'all') {
      if (progression.complexity !== filters.complexity) {
        return false;
      }
    }

    // Length filters
    if (filters.minLength !== null) {
      if (progression.chords.length < filters.minLength) {
        return false;
      }
    }

    if (filters.maxLength !== null) {
      if (progression.chords.length > filters.maxLength) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get unique genres from progressions
 */
export function getUniqueGenres(progressions: ChordProgression[]): string[] {
  const genresSet = new Set<string>();
  progressions.forEach(progression => {
    progression.genre.forEach(genre => genresSet.add(genre));
  });
  return Array.from(genresSet).sort();
}

/**
 * Get unique moods from progressions
 */
export function getUniqueMoods(progressions: ChordProgression[]): string[] {
  const moodsSet = new Set<string>();
  progressions.forEach(progression => {
    progression.mood.forEach(mood => moodsSet.add(mood));
  });
  return Array.from(moodsSet).sort();
}

/**
 * Get unique complexity levels
 */
export function getUniqueComplexities(): Array<{ value: string; label: string }> {
  return [
    { value: 'simple', label: 'Simple' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
}

/**
 * Get progression length statistics
 */
export function getProgressionLengthStats(progressions: ChordProgression[]): {
  min: number;
  max: number;
  average: number;
} {
  if (progressions.length === 0) {
    return { min: 0, max: 0, average: 0 };
  }

  const lengths = progressions.map(p => p.chords.length);
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const average = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  return { min, max, average: Math.round(average * 10) / 10 };
}
