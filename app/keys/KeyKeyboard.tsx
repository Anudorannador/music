'use client';
import { useMemo, useRef } from 'react';
import { Note } from 'tonal';
import type { KeyInfo } from './keyUtils';
import CustomKeyboard from '../../components/Keyboard/CustomKeyboard';
import 'react-piano/dist/styles.css';

interface KeyKeyboardProps {
  keyInfo: KeyInfo;
  useColors?: boolean;
}

export default function KeyKeyboard({ 
  keyInfo, 
  useColors = false
}: KeyKeyboardProps) {
  const pianoWrapperRef = useRef<HTMLDivElement>(null);
  
  // Get MIDI notes for the middle octave (C4-B4) for highlighting
  const middleOctaveScaleNotes = useMemo(() => {
    if (keyInfo.scale.length === 0) return {};
    
    const notesObj: Record<number, { showLabel: boolean; colorOptions: Record<string, unknown> | null }> = {};
    keyInfo.scale.forEach(note => {
      // Remove any existing octave number and add octave 4
      const cleanNote = note.replace(/\d+/g, '');
      const midiNote = Note.midi(`${cleanNote}4`);
      if (midiNote !== null) {
        notesObj[midiNote] = { showLabel: true, colorOptions: {} };
      }
    });
    
    return notesObj;
  }, [keyInfo]);

  // DOM manipulation removed; CustomKeyboard handles visuals.

  // Align with standard keyboard height ratio
  const keyHeightRatio = 0.24;

  return (
    <CustomKeyboard
      ref={pianoWrapperRef}
      noteRange={{ first: Note.midi('C2')!, last: Note.midi('C6')! }}
      width={1000}
      keyWidthToHeight={keyHeightRatio}
      activeNotes={middleOctaveScaleNotes}
      useColors={useColors}
    />
  );
}
