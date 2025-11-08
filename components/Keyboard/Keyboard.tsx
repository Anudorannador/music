'use client';

import { Piano, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import styles from './Keyboard.module.css';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getNoteColor } from '@lib/noteColors';

// Component props
interface KeyboardProps {
  onKeyPress?: (note: string, octave: number) => void;
  onKeyDown?: (note: string, octave: number) => void;
  onKeyUp?: (note: string, octave: number) => void;
  activeNotes?: Set<string>; // Set of "noteOctave" strings like "C4", "A#3"
  useColors?: boolean; // Enable octave-aware coloring
  compact?: boolean; // Use compact height for display-only keyboards
  opaqueMidi?: number[]; // force full opacity keys
  upcomingMidi?: number[]; // tint these as upcoming
  upcomingAlpha?: number; // 0..1 for tint strength
}

// Helper to convert MIDI number to note name and octave
const midiToNote = (midiNumber: number): { note: string; octave: number } => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return {
    note: noteNames[noteIndex],
    octave: octave
  };
};

// Hex to RGB helper for overlay tint composition
// (Deprecated) hexToRgb retained for potential future contrast logic
// const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
//   const m = hex.replace('#','').match(/^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
//   if (!m) return null;
//   return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
// };

// Helper to convert note name and octave to MIDI number
const noteToMidi = (note: string, octave: number): number => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteIndex = noteNames.indexOf(note);
  if (noteIndex === -1) return -1;
  return (octave + 1) * 12 + noteIndex;
};

// Standard 88-key piano keyboard
const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, onKeyDown, onKeyUp, activeNotes, useColors = false, compact = false, opaqueMidi = [], upcomingMidi = [] }) => {
  // 88-key piano range: A0 (MIDI 21) to C8 (MIDI 108)
  const firstNote = MidiNumbers.fromNote('A0');
  const lastNote = MidiNumbers.fromNote('C8');
  
  const pianoWrapperRef = useRef<HTMLDivElement>(null);
  
  // Create keyboard shortcuts array for all keys (even though we won't use them)
  // This ensures renderNoteLabel is called for every key
  const keyboardShortcuts = Array.from({ length: lastNote - firstNote + 1 }, (_, i) => ({
    key: '', // Empty key means no keyboard shortcut
    midiNumber: firstNote + i
  }));

  // Compact mode uses shorter keys (height ratio)
  const keyHeightRatio = compact ? 0.12 : 0.20;

  // Dynamic width: 85% of window width, but at least enough for all 88 keys
  const [keyboardWidth, setKeyboardWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      const windowWidth = window.innerWidth * 0.85;
      // Estimate: 88 keys, average ~15px per key (white keys ~20px, black keys narrower)
      const minWidth = 88 * 15;
      const newWidth = Math.max(windowWidth, minWidth);
      setKeyboardWidth(newWidth);
    };

    // Set initial width
    updateWidth();

    // Update on window resize
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Apply colors to active keys when color mode is enabled
  useEffect(() => {
    if (!pianoWrapperRef.current || !useColors) return;
    
    const applyColors = () => {
      const allKeys = pianoWrapperRef.current!.querySelectorAll('.ReactPiano__Key');
      
      allKeys.forEach((keyElement, index) => {
        const currentMidi = firstNote + index;
        const { note, octave } = midiToNote(currentMidi);
        const noteId = `${note}${octave}`;
        
        if (activeNotes?.has(noteId)) {
          const color = getNoteColor(note, octave);
          (keyElement as HTMLElement).style.setProperty('--key-color', color);
        } else {
          (keyElement as HTMLElement).style.removeProperty('--key-color');
        }
      });
    };
    
    // Apply colors immediately
    applyColors();
    
    // Also watch for DOM changes
    const observer = new MutationObserver(() => {
      applyColors();
    });
    
    observer.observe(pianoWrapperRef.current, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      observer.disconnect();
    };
  }, [activeNotes, useColors, firstNote]);

  // Fix react-piano internal containers to not overflow
  useEffect(() => {
    if (!pianoWrapperRef.current) return;

    let animationFrameId: number;

    const fixHeights = () => {
      const wrapper = pianoWrapperRef.current;
      if (!wrapper) return;

      const containerDiv = wrapper.querySelector('[data-testid="container"]') as HTMLElement;
      const keyboardDiv = wrapper.querySelector('.ReactPiano__Keyboard') as HTMLElement;
      
      // Get actual rendered height of the keyboard content
      let maxHeight = 0;
      const keys = wrapper.querySelectorAll('.ReactPiano__Key');
      keys.forEach((key) => {
        const rect = (key as HTMLElement).getBoundingClientRect();
        maxHeight = Math.max(maxHeight, rect.height);
      });

      // Add some padding for the keyboard container
      const targetHeight = maxHeight + 20;

      if (containerDiv) {
        containerDiv.style.setProperty('height', targetHeight + 'px', 'important');
        containerDiv.style.setProperty('overflow', 'visible', 'important');
      }

      if (keyboardDiv) {
        keyboardDiv.style.setProperty('height', targetHeight + 'px', 'important');
        keyboardDiv.style.setProperty('overflow', 'visible', 'important');
      }

      animationFrameId = requestAnimationFrame(fixHeights);
    };

    // Start fixing
    animationFrameId = requestAnimationFrame(fixHeights);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Convert activeNotes Set to array of MIDI numbers (memoized)
  const activeMidiNumbers: number[] = useMemo(() => {
    if (!activeNotes) return [];
    return Array.from(activeNotes).map(noteId => {
      const match = noteId.match(/^([A-G]#?)(\d+)$/);
      if (!match) return -1;
      return noteToMidi(match[1], parseInt(match[2]));
    }).filter(midi => midi !== -1);
  }, [activeNotes]);

  // Upcoming accent (outline + bar) using class; avoids transparency on key fill
  useEffect(() => {
    if (!pianoWrapperRef.current) return;
    const allKeys = pianoWrapperRef.current.querySelectorAll('.ReactPiano__Key');
    const opaqueSet = new Set<number>([...activeMidiNumbers, ...opaqueMidi]);
    const upcomingSet = new Set<number>(upcomingMidi);
    allKeys.forEach((keyEl, index) => {
      const midi = firstNote + index;
      const el = keyEl as HTMLElement;
      // Reset prior upcoming state
      el.classList.remove('is-upcoming');
      el.style.removeProperty('--upcoming-accent');
      el.style.removeProperty('opacity');
      if (!opaqueSet.has(midi) && upcomingSet.has(midi)) {
        let accent: string;
        if (useColors) {
          const { note, octave } = midiToNote(midi);
          accent = getNoteColor(note, octave);
        } else {
          accent = '#64b5f6';
        }
        el.style.setProperty('--upcoming-accent', accent);
        el.classList.add('is-upcoming');
      }
    });
  }, [activeMidiNumbers, opaqueMidi, upcomingMidi, firstNote, useColors]);

  const handleNoteOn = (midiNumber: number) => {
    const { note, octave } = midiToNote(midiNumber);
    if (onKeyDown) {
      onKeyDown(note, octave);
    } else if (onKeyPress) {
      onKeyPress(note, octave);
    }
  };

  const handleNoteOff = (midiNumber: number) => {
    const { note, octave } = midiToNote(midiNumber);
    if (onKeyUp) {
      onKeyUp(note, octave);
    }
  };

  // Custom render function to show note names
  const renderNoteLabel = ({ midiNumber, isAccidental }: { 
    keyboardShortcut?: string; 
    midiNumber: number; 
    isActive?: boolean; 
    isAccidental: boolean;
  }) => {
    const { note, octave } = midiToNote(midiNumber);
    const label = `${note}${octave}`;
    const noteId = `${note}${octave}`;
    const isActiveNote = activeNotes?.has(noteId);
    
    // Calculate font size based on key width
    // White keys are roughly width / 52 (52 white keys in 88-key piano)
    // Black keys are narrower
    const whiteKeyWidth = keyboardWidth / 52;
    const fontSize = isAccidental 
      ? Math.max(8, Math.min(10, whiteKeyWidth * 0.4)) 
      : Math.max(10, Math.min(14, whiteKeyWidth * 0.5));
    
    // Determine text color based on key state and type
    let textColor: string;
    if (useColors && isActiveNote) {
      // Color mode: active keys
      textColor = isAccidental ? '#000' : '#e0e0e0';
    } else if (!useColors && isActiveNote) {
      // No color mode: active keys - all white text on blue background
      textColor = '#fff'; // Both black and white keys pressed -> white text
    } else if (!useColors && !isActiveNote) {
      // No color mode: inactive keys
      textColor = isAccidental ? '#e0e0e0' : '#666'; // Black key default -> light text, White key default -> dark text
    } else {
      // Default colors
      textColor = isAccidental ? '#fff' : '#333';
    }
    
    return (
      <span 
        style={{ 
          fontSize: `${fontSize}px`,
          color: textColor,
          fontWeight: 600
        }}
      >
        {label}
      </span>
    );
  };

  // activeMidiNumbers already computed via useMemo

  return (
    <div className={styles.keyboardContainer}>
      <div 
        className={`${styles.keyboardWrapper} ${styles.interactive} ${compact ? styles.shortKeys : styles.tallKeys} ${useColors ? styles.colorMode : ''} ${compact ? styles.compact : ''}`} 
        ref={pianoWrapperRef}
      >
        <Piano
          noteRange={{ first: firstNote, last: lastNote }}
          playNote={compact ? () => {} : handleNoteOn}
          stopNote={compact ? () => {} : handleNoteOff}
          width={keyboardWidth}
          keyWidthToHeight={keyHeightRatio}
          keyboardShortcuts={keyboardShortcuts}
          renderNoteLabel={renderNoteLabel}
          activeNotes={activeMidiNumbers}
        />
      </div>
    </div>
  );
};

export default Keyboard;