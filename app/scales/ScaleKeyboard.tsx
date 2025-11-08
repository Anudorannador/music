'use client';
import { useMemo } from 'react';
import { Note } from 'tonal';
import { rangeFromMinMidiTwoOctaves } from '@lib/keyboardRange';
import type { ScaleInfo } from './scaleUtils';
import PlayKeys from '../../components/PlayKeys';
import 'react-piano/dist/styles.css';

interface ScaleKeyboardProps {
  scale: ScaleInfo;
  currentNote?: number | null;
  useColors?: boolean; // enable octave-aware coloring
  playedNotes?: Set<number>;
}

export default function ScaleKeyboard({ scale, currentNote, useColors = false, playedNotes }: ScaleKeyboardProps) {
  // --- Range Calculation Logic ---
  // Reuse concept from chord keyboard: find the lowest scale degree (placed in octave 4),
  // then shift left to nearest C or F, and show exactly two octaves (24 semitones).
  // This keeps the visual keyboard compact and centered around the scale.
  const noteRange = useMemo(() => {
    if (scale.empty || scale.notes.length === 0) {
      return { first: Note.midi('C4')!, last: Note.midi('C6')! };
    }
    const referenceMidis = scale.notes
      .map(n => Note.midi(`${n}4`))
      .filter((m): m is number => m !== null);
    if (!referenceMidis.length) {
      return { first: Note.midi('C4')!, last: Note.midi('C6')! };
    }
    const minMidi = Math.min(...referenceMidis);
    return rangeFromMinMidiTwoOctaves(minMidi);
  }, [scale]);

  // Convert scale notes to pitch classes (0-11) for idle display
  const scaleNotePitchClasses = useMemo(() => {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    // For scales, use pitch classes to highlight all octaves
    return new Set(scale.notes.map(note => noteMap[note] ?? -1).filter(pc => pc !== -1));
  }, [scale.notes]);

  // Convert pitch classes to actual MIDI notes in the range for idle display
  const scaleNotesForIdleDisplay = useMemo(() => {
    const notesSet = new Set<number>();
    for (let midi = noteRange.first; midi <= noteRange.last; midi++) {
      const pc = midi % 12;
      if (scaleNotePitchClasses.has(pc)) {
        notesSet.add(midi);
      }
    }
    return notesSet;
  }, [scaleNotePitchClasses, noteRange]);

  // Dynamic width based on key count (similar logic to ChordKeyboard)
  const keyboardWidth = useMemo(() => {
    const numKeys = noteRange.last - noteRange.first + 1;
    // Scale per key ~22px, clamp range for responsiveness
    return Math.min(680, Math.max(320, numKeys * 22));
  }, [noteRange]);

  return (
    <PlayKeys
      noteRange={noteRange}
      width={keyboardWidth}
      keyWidthToHeight={0.24}
      idleNotes={scaleNotesForIdleDisplay}
      currentNote={currentNote}
      playedNotes={playedNotes}
      useColors={useColors}
      showLabel={true}
    />
  );
}

