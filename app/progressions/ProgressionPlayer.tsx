import { useState, useRef, useCallback, useEffect } from 'react';
import { ChordInProgression, chordSymbolToNotes } from './progressionUtils';
import { playBlockChord, playArpeggioChord, createAudioContext, noteToFrequency } from '../chords/chordUtils';
import styles from './progressions.module.css';

interface ProgressionPlayerProps {
  chords: ChordInProgression[];
  onChordChange?: (index: number) => void;
}

export default function ProgressionPlayer({ chords, onChordChange }: ProgressionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  const [tempo, setTempo] = useState(120);
  const [loop, setLoop] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<'block' | 'arpeggio'>('block');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Don't close the audio context - let it persist for reuse
      // Trying to close an already-closed AudioContext causes InvalidStateError
    };
  }, []);

  const playChord = useCallback((chordIndex: number) => {
    if (!audioContextRef.current || chordIndex >= chords.length) return;

    const chord = chords[chordIndex];
    const notes = chordSymbolToNotes(chord.chordSymbol, 4);
    const frequencies = notes.map(note => noteToFrequency(note.note, note.octave));

    if (playbackMode === 'arpeggio') {
      playArpeggioChord(audioContextRef.current, frequencies, notes);
    } else {
      playBlockChord(audioContextRef.current, frequencies, notes);
    }
    
    setCurrentChordIndex(chordIndex);
    if (onChordChange) {
      onChordChange(chordIndex);
    }
  }, [chords, onChordChange, playbackMode]);

  const playProgression = useCallback(() => {
    if (!audioContextRef.current || chords.length === 0) return;

    isPlayingRef.current = true;
    setIsPlaying(true);

    const playNextChord = (index: number) => {
      if (!isPlayingRef.current) return;

      if (index >= chords.length) {
        if (loop) {
          playNextChord(0);
        } else {
          setIsPlaying(false);
          setCurrentChordIndex(-1);
          isPlayingRef.current = false;
        }
        return;
      }

      playChord(index);

      const beatsPerChord = 4;
      const secondsPerBeat = 60 / tempo;
      const chordDuration = secondsPerBeat * beatsPerChord * 1000;

      timeoutRef.current = setTimeout(() => {
        playNextChord(index + 1);
      }, chordDuration);
    };

    playNextChord(0);
  }, [chords, tempo, loop, playChord]);

  const stopProgression = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentChordIndex(-1);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopProgression();
    } else {
      playProgression();
    }
  };

  return (
    <div className={styles.player}>
      {/* Two-row layout: first row play+tempo+loop, second row mode toggle; now playing below */}
      <div className={styles.playerControlsColumn}>
        <div className={styles.playerRowPrimary}>
          <button
            className={styles.playButton}
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Stop' : 'Play'}
            title={isPlaying ? 'Stop' : 'Play'}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className={styles.tempoControl}>
            <label htmlFor="tempo" className={styles.tempoLabel}>
              Tempo: <strong>{tempo}</strong> BPM
            </label>
            <input
              id="tempo"
              type="range"
              min="40"
              max="240"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className={styles.tempoSlider}
              disabled={isPlaying}
            />
          </div>
          <div className={styles.nowPlayingInline}>
            {isPlaying && currentChordIndex >= 0 ? (
              <span className={styles.nowPlaying}>
                <strong>{chords[currentChordIndex].chordSymbol}</strong> ({currentChordIndex + 1}/{chords.length})
              </span>
            ) : (
              <span className={styles.nowPlayingPlaceholder}></span>
            )}
          </div>
        </div>
        <div className={styles.playerRowSecondary}>
          <button
            className={`${styles.loopToggle} ${loop ? styles.active : ''}`}
            onClick={() => setLoop(!loop)}
            disabled={isPlaying}
            title={loop ? 'Loop enabled' : 'Loop disabled'}
          >
            Loop
          </button>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeButton} ${playbackMode === 'block' ? styles.active : ''}`}
              onClick={() => setPlaybackMode('block')}
              disabled={isPlaying}
              title="Play all notes simultaneously"
            >
              Block
            </button>
            <button
              className={`${styles.modeButton} ${playbackMode === 'arpeggio' ? styles.active : ''}`}
              onClick={() => setPlaybackMode('arpeggio')}
              disabled={isPlaying}
              title="Play notes one by one"
            >
              Arpeggio
            </button>
          </div>
        </div>
        {/* Removed separate bottom nowPlayingContainer; now displayed inline after play button */}
      </div>
    </div>
  );
}
