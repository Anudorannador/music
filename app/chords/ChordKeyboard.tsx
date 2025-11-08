'use client';

import { useMemo } from 'react';
import 'react-piano/dist/styles.css';
import PlayKeys from '../../components/PlayKeys';
import styles from './chords.module.css';
import { snapLeftToCOrF, PIANO_MIN_MIDI, PIANO_MAX_MIDI } from '@lib/keyboardRange';
import { Chord, getVoicedMidiNotes } from './chordUtils';

// Component to render a chord using react-piano
export default function ChordKeyboard({ chord, noteColors, currentIndex, playedIndices, showPlayedKeys }: { chord: Chord, noteColors?: string[], currentIndex?: number | null, playedIndices?: Set<number>, showPlayedKeys?: boolean }) {
  
  // Arpeggio voicing (strictly ascending) - shown by default on keyboard
  const midiArpVoiced = useMemo(() => getVoicedMidiNotes(chord, 'arpeggio'), [chord]);

  const keyboardRange = useMemo(() => {
    // For chords, show just one octave containing the voicing
    if (midiArpVoiced.length === 0) return null;
    
    const minMidi = Math.min(...midiArpVoiced);
    const maxMidi = Math.max(...midiArpVoiced);

    // Snap to nearest C or F, but keep range tight to just cover the chord voicing
    let first = snapLeftToCOrF(minMidi);
    let last = first + 24; // two octaves
    
    // If the voicing spans more than one octave, extend to cover it
    if (maxMidi > last) {
      last = maxMidi + 1;
    }
    
    // Keep within piano limits
    first = Math.max(PIANO_MIN_MIDI, first);
    last = Math.min(PIANO_MAX_MIDI, last);
    
    return { first, last };
  }, [midiArpVoiced]);

  // Convert arpeggio MIDI notes to a Set for idle display
  const chordNotesForIdleDisplay = useMemo(() => {
    return new Set(midiArpVoiced);
  }, [midiArpVoiced]);

  // Map currentIndex and playedIndices to actual MIDI notes
  const currentNoteMidi = useMemo(() => {
    // When playing, show only the current note
    if (currentIndex !== undefined && currentIndex !== null && currentIndex < midiArpVoiced.length) {
      return midiArpVoiced[currentIndex];
    }
    return null;
  }, [currentIndex, midiArpVoiced]);

  const playedNotesMidi = useMemo(() => {
    // Only show played notes if showPlayedKeys is enabled
    if (!showPlayedKeys || !playedIndices) return undefined;
    const midiSet = new Set<number>();
    playedIndices.forEach(index => {
      if (index < midiArpVoiced.length) {
        midiSet.add(midiArpVoiced[index]);
      }
    });
    return midiSet;
  }, [playedIndices, midiArpVoiced, showPlayedKeys]);

  if (!keyboardRange) {
    return null;
  }
  
  const numKeys = keyboardRange.last - keyboardRange.first + 1;
  // Match ScaleKeyboard sizing logic: ~22px per key, clamped 320-680
  const keyboardWidth = Math.min(680, Math.max(320, numKeys * 22));
  
  return (
    <div className={`${styles.chordKeyboard} ${styles.leftAlign}`.trim()} style={{ width: `${keyboardWidth}px` }}>
      <div className={`${styles.reactPianoWrapper} ${styles.leftAlign}`.trim()}>
        <PlayKeys
          noteRange={keyboardRange}
          width={keyboardWidth}
          keyWidthToHeight={0.24}
          idleNotes={chordNotesForIdleDisplay}
          currentNote={currentNoteMidi}
          playedNotes={playedNotesMidi}
          useColors={!!noteColors}
          showLabel={true}
        />
      </div>
    </div>
  );
}