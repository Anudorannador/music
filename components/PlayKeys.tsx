'use client';

import { useMemo, useRef, memo } from 'react';
import 'react-piano/dist/styles.css';
import CustomKeyboard from './Keyboard/CustomKeyboard';

export interface PlayKeysProps {
  /** Range of notes to display */
  noteRange: { first: number; last: number };
  
  /** Width of the keyboard in pixels */
  width: number;
  
  /** Aspect ratio: key width to height */
  keyWidthToHeight?: number;
  
  /** Specific MIDI notes to highlight in idle state */
  idleNotes?: Set<number> | number[];
  
  /** Currently playing note MIDI number */
  currentNote?: number | null;
  
  /** Already played notes MIDI numbers */
  playedNotes?: Set<number>;
  
  /** Enable color mode */
  useColors?: boolean;
  
  /** Show label for active notes */
  showLabel?: boolean;
  
  /** Optional CSS class for wrapper */
  className?: string;
  
  /** Optional ref to wrapper div */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * PlayKeys Component
 * 
 * Displays keyboard with playback visualization:
 * - Current playing note highlighted
 * - Already played notes shown with reduced opacity
 * - Scale/chord notes highlighted in idle state
 */
function PlayKeys({
  noteRange,
  width,
  keyWidthToHeight = 0.24,
  idleNotes,
  currentNote = null,
  playedNotes,
  useColors = false,
  showLabel = true,
  className = '',
}: PlayKeysProps) {
  const pianoWrapperRef = useRef<HTMLDivElement>(null);

  // Convert idleNotes to Set for consistent handling
  const idleNotesSet = useMemo(() => {
    if (!idleNotes) return new Set<number>();
    if (idleNotes instanceof Set) return idleNotes;
    return new Set(idleNotes);
  }, [idleNotes]);

  // Compute active notes configuration
  const activeNotes = useMemo(() => {
    const config: Record<number, { showLabel: boolean; colorOptions: Record<string, unknown> | null }> = {};

    if (currentNote !== null && currentNote !== undefined) {
      // Currently playing note - show label with default colors
      config[currentNote] = { showLabel, colorOptions: {} };

      // Already played notes - don't show label, default colors
      if (playedNotes) {
        playedNotes.forEach((note: number) => {
          if (note !== currentNote) {
            config[note] = { showLabel: false, colorOptions: {} };
          }
        });
      }
    } else {
      // Idle state: highlight only the specific idle notes
      idleNotesSet.forEach(midi => {
        config[midi] = { showLabel, colorOptions: {} };
      });
    }

    return config;
  }, [currentNote, playedNotes, idleNotesSet, showLabel]);

  return (
    <div ref={pianoWrapperRef} className={className}>
      <CustomKeyboard
        noteRange={noteRange}
        width={width}
        keyWidthToHeight={keyWidthToHeight}
        activeNotes={activeNotes}
        useColors={useColors}
      />
    </div>
  );
}

export default memo(PlayKeys);
