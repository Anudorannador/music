'use client';
import { useState, useCallback, useEffect, memo } from 'react';
import type { ScaleInfo } from './scaleUtils';
import { getScaleMidiNotes } from './scaleUtils';
import { getAudioPlayer, type PlaybackDirection } from './audioPlayer';
import ScaleKeyboard from './ScaleKeyboard';
import NotationDisplay from './NotationDisplay';
import ScaleInfoDisplay from './ScaleInfoDisplay';
import styles from './scales.module.css';

interface ScaleRowProps {
  scale: ScaleInfo;
  style?: React.CSSProperties;
  useColors?: boolean; // Pass color mode from parent
  showPlayedNotes?: boolean; // Pass show played notes flag from parent
}

function ScaleRow({ scale, style, useColors = false, showPlayedNotes = false }: ScaleRowProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [playedNotes, setPlayedNotes] = useState<Set<number>>(new Set());

  const playScale = useCallback((direction: PlaybackDirection) => {
    if (isPlaying) return;

    const player = getAudioPlayer();
    // Get notes for 2 octaves to match notation display
    const octave1 = getScaleMidiNotes(scale, 4);
    const octave2 = getScaleMidiNotes(scale, 5);
    const midiNotes = [...octave1, ...octave2];

    setIsPlaying(true);
    setCurrentNote(null);
    setPlayedNotes(new Set());

    player.play({
      midiNotes,
      direction,
      tempo: 0.5,
      onNoteStart: (midiNote) => {
        // Update state to trigger re-render
        setCurrentNote(midiNote);
      },
      onNoteEnd: (midiNote) => {
        // Add this note to played notes
        setPlayedNotes(prev => new Set([...prev, midiNote]));
      },
      onComplete: () => {
        setIsPlaying(false);
        setCurrentNote(null);
        setPlayedNotes(new Set());
      },
    });
  }, [scale, isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        const player = getAudioPlayer();
        player.stop();
        setIsPlaying(false);
      }
    };
  }, [isPlaying]);

  return (
    <div style={style}>
      <div className={styles.scaleRow}>
        <div className={styles.scaleHeader}>
          <h3 className={styles.scaleName}>{scale.name}</h3>
          <div className={styles.scaleActions} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.playButton}
              onClick={() => playScale('ascending')}
              disabled={isPlaying}
              aria-label="Play scale ascending"
            >
              {isPlaying ? '⏸ Playing...' : '▶ Play ↑'}
            </button>
            <button
              className={styles.playButton}
              onClick={() => playScale('descending')}
              disabled={isPlaying}
              aria-label="Play scale descending"
            >
              ▶ Play ↓
            </button>
            <button
              className={styles.playButton}
              onClick={() => playScale('both')}
              disabled={isPlaying}
              aria-label="Play scale both directions"
            >
              ▶ Play ↕
            </button>
          </div>
        </div>

        <div className={styles.scaleContent}>
          {/* Side-by-side: Notation left (50%), Keyboard right (rest) */}
          <div className={styles.notationKeyboardRow}>
            <div className={styles.notationPane}>
              <NotationDisplay scale={scale} useColors={useColors} currentNote={currentNote ?? undefined} />
            </div>
            <div className={styles.keyboardPane}>
              <ScaleKeyboard 
                scale={scale} 
                currentNote={currentNote} 
                useColors={useColors}
                playedNotes={showPlayedNotes ? playedNotes : undefined}
              />
            </div>
          </div>
          <ScaleInfoDisplay scale={scale} />
        </div>
      </div>
    </div>
  );
}

export default memo(ScaleRow);
