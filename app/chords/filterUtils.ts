import { Chord } from './chordUtils';

/**
 * Filter chords based on search query and filter criteria
 */
export function filterChords(
  allChords: Chord[],
  {
    searchQuery = '',
    selectedRootNotes = [],
    selectedChordTypes = [],
    selectedIncludeKeys = [],
    selectedNumberOfKeys = [],
  }: {
    searchQuery?: string;
    selectedRootNotes?: string[];
    selectedChordTypes?: string[];
    selectedIncludeKeys?: string[];
    selectedNumberOfKeys?: number[];
  }
): Chord[] {
  return allChords.filter(chord => {
    // Apply text search filter
    const matchesSearch = searchQuery === '' || 
      chord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chord.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply root note filter
    const matchesRootNote = selectedRootNotes.length === 0 || 
      selectedRootNotes.some(rootNote => chord.name.startsWith(rootNote));
    
    // Apply chord type filter
    const matchesChordType = selectedChordTypes.length === 0 || 
      selectedChordTypes.some(chordType => chord.name.endsWith(chordType) || chord.name.includes(` ${chordType}`));
    
    // Apply include keys filter
    const matchesIncludeKeys = selectedIncludeKeys.length === 0 || 
      selectedIncludeKeys.some(key => chord.notes.some(note => note.note === key));
    
    // Apply number of keys filter
    const matchesNumberOfKeys = selectedNumberOfKeys.length === 0 || 
      selectedNumberOfKeys.includes(chord.notes.length);
    
    return matchesSearch && matchesRootNote && matchesChordType && matchesIncludeKeys && matchesNumberOfKeys;
  });
}

/**
 * Shift chords to a different octave
 */
export function shiftChordsOctave(chords: Chord[], selectedOctave: number): Chord[] {
  // If selectedOctave is 4 (default), don't shift
  if (selectedOctave === 4) return chords;
  
  // Calculate octave difference
  const octaveDiff = selectedOctave - 4;
  
  return chords.map(chord => ({
    ...chord,
    notes: chord.notes.map(note => ({
      ...note,
      octave: note.octave + octaveDiff
    }))
  }));
}

/**
 * Extract unique chord types from all chords
 */
export function extractChordTypes(allChords: Chord[]): string[] {
  return Array.from(new Set(allChords.map(chord => {
    const parts = chord.name.split(' ');
    return parts.slice(1).join(' ');
  }))).sort();
}

/**
 * Extract unique root notes from all chords
 */
export function extractRootNotes(allChords: Chord[]): string[] {
  return Array.from(new Set(allChords.map(chord => {
    return chord.name.split(' ')[0];
  }))).sort();
}