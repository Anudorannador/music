'use client';

import React, { forwardRef, useEffect, useRef, useImperativeHandle, useMemo } from 'react';
import { Piano } from 'react-piano';
import 'react-piano/dist/styles.css';
import { getNoteColor, NoteColorOptions } from '../../app/lib/noteColors';

interface ActiveNoteConfig {
  showLabel?: boolean;
  colorOptions?: NoteColorOptions | null;
}

interface CustomKeyboardProps {
  noteRange: { first: number; last: number };
  width: number;
  keyWidthToHeight?: number;
  activeNotes?: Record<number, ActiveNoteConfig | null>;
  useColors?: boolean;
}

const midiToNote = (midi: number) => {
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const note = names[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { note, octave };
};

const CustomKeyboard = forwardRef<HTMLDivElement | null, CustomKeyboardProps>(
  ({ noteRange, width, keyWidthToHeight = 0.2, activeNotes = [], useColors = false }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => wrapperRef.current!);

    const activeSet = useMemo(() => new Set(Object.keys(activeNotes || {}).map(Number)), [activeNotes]);
    const activeConfig = useMemo(() => activeNotes || {}, [activeNotes]);

    const renderNoteLabel = ({ midiNumber }: { midiNumber: number; isAccidental: boolean }) => {
      const config = activeConfig[midiNumber];
      if (!config || config?.showLabel !== true) return null;
      const { note, octave } = midiToNote(midiNumber);
      const fontSize = note.includes('#') ? '10px' : '14px';
      return <div style={{ color: '#000000', fontSize }}>{note}{octave}</div>;
    };

    // Apply coloring to active keys
    useEffect(() => {
      if (!wrapperRef.current) return;
      const allKeys = wrapperRef.current.querySelectorAll('.ReactPiano__Key');

      allKeys.forEach((keyEl, index) => {
        const midi = noteRange.first + index;
        const el = keyEl as HTMLElement;
        const config = activeConfig[midi];
        const isActive = activeSet.has(midi);
        const isBlackKey = el.classList.contains('ReactPiano__Key--accidental');

        if (isActive && config !== null) {
          // Active with config - handle colorOptions independently from showLabel
          if (config.colorOptions !== undefined && config.colorOptions !== null) {
            if (useColors) {
              const { note, octave } = midiToNote(midi);
              let finalOptions = config.colorOptions;
              
              // For next notes (with alpha < 1): use lighter colors, different for black vs white keys
              if (config.colorOptions.alpha !== undefined && config.colorOptions.alpha < 1) {
                if (isBlackKey) {
                  // Black key: boost lightness significantly
                  const lightnessBoost = 40;
                  finalOptions = {
                    ...config.colorOptions,
                    lightnessOffset: (config.colorOptions.lightnessOffset || 0) + lightnessBoost
                  };
                } else {
                  // White key: 方案 1 - 更浅的颜色，alpha 稍高 (lightnessOffset: 25, alpha: 0.6)
                  const lightnessBoost = 25;
                  finalOptions = {
                    ...config.colorOptions,
                    lightnessOffset: (config.colorOptions.lightnessOffset || 0) + lightnessBoost,
                    alpha: 0.6
                  };
                }
              }
              
              const color = getNoteColor(note, octave, finalOptions);
              el.style.setProperty('background', color, 'important');
              el.style.setProperty('background-color', color, 'important');
              el.style.setProperty('border-color', color, 'important');
              el.style.color = '#000000';
              el.style.fontSize = note.includes('#') ? '10px' : '14px';
            } else {
              el.style.setProperty('background', '#64b5f6', 'important');
              el.style.setProperty('border-color', '#64b5f6', 'important');
            }
          } else if (config.colorOptions === null) {
            // colorOptions explicitly set to null - don't set background/border
            el.style.background = '';
            el.style.borderColor = '';
          }
        } else {
          // Inactive or config is null - clear all styles
          el.style.background = '';
          el.style.borderColor = '';
          el.style.color = '';
          el.style.fontSize = '';
        }
      });
    }, [noteRange.first, noteRange.last, useColors, activeSet, activeConfig]);

    return (
      <div ref={wrapperRef}>
        <Piano
          noteRange={noteRange}
          width={width}
          keyWidthToHeight={keyWidthToHeight}
          playNote={() => {}}
          stopNote={() => {}}
          activeNotes={Array.from(activeSet)}
          keyboardShortcuts={[]}
          renderNoteLabel={renderNoteLabel}
        />
      </div>
    );
  }
);

CustomKeyboard.displayName = 'CustomKeyboard';

export default CustomKeyboard;
