import { useState, useMemo } from 'react';
import { ChordProgression } from './constants';
import { resolveProgression } from './progressionUtils';
import { generateProgressionMusicXML } from './progressionXmlBuilder';
import ProgressionPlayer from './ProgressionPlayer';
import CustomKeyboard from '@/components/Keyboard/CustomKeyboard';
import { rangeFromMinMidiTwoOctaves } from '@lib/keyboardRange';
import { chordSymbolToNotes } from './progressionUtils';
import styles from './progressions.module.css';

interface ProgressionCardProps {
  progression: ChordProgression;
  selectedKey: string;
  mode: 'major' | 'minor';
  onGenreClick?: (genre: string) => void;
  onComplexityClick?: (complexity: string) => void;
}

export default function ProgressionCard({ progression, selectedKey, mode, onGenreClick, onComplexityClick }: ProgressionCardProps) {
  const [highlightedChordIndex, setHighlightedChordIndex] = useState(-1);
  
  // Resolve progression to actual chords in the selected key
  const resolvedChords = resolveProgression(progression.chords, selectedKey, mode);

  const handleDownloadXML = () => {
    const xml = generateProgressionMusicXML(
      `${progression.name} in ${selectedKey} ${mode}`,
      resolvedChords,
      selectedKey,
      120
    );

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${progression.name.replace(/\s+/g, '_')}_${selectedKey}_${mode}.musicxml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get all notes for keyboard visualization
  const getHighlightedNotes = useMemo(() => {
    return (chordIndex: number) => {
      if (chordIndex < 0 || chordIndex >= resolvedChords.length) return [];
      const chord = resolvedChords[chordIndex];
      const notes = chordSymbolToNotes(chord.chordSymbol, 4);
      // Return note with octave for keyboard visualization
      return notes.map(n => `${n.note}${n.octave}`);
    };
  }, [resolvedChords]);

  const currentHighlightedNotes = useMemo(() => {
    return highlightedChordIndex >= 0 
      ? new Set(getHighlightedNotes(highlightedChordIndex))
      : new Set<string>();
  }, [highlightedChordIndex, getHighlightedNotes]);

  // Utility: convert "C#4" to MIDI number
  const noteIdToMidi = (id: string): number | null => {
    const m = id.match(/^([A-G]#?)(\d+)$/);
    if (!m) return null;
    const name = m[1];
    const octave = parseInt(m[2], 10);
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const idx = names.indexOf(name);
    if (idx === -1) return null;
    return (octave + 1) * 12 + idx;
  };

  // Compute a compact two-octave range based on current highlighted notes
  const noteRange = useMemo(() => {
    const activeMidis = Array.from(currentHighlightedNotes)
      .map(noteIdToMidi)
      .filter((m): m is number => m !== null);
    const minMidi = activeMidis.length ? Math.min(...activeMidis) : 60; // default around C4
    return rangeFromMinMidiTwoOctaves(minMidi);
  }, [currentHighlightedNotes]);

  // Active notes for CustomKeyboard (MIDI numbers)
  const activeMidiNumbers = useMemo(() => {
    const result: Record<number, { showLabel: boolean; colorOptions: Record<string, unknown> | null }> = {};
    Array.from(currentHighlightedNotes)
      .map(noteIdToMidi)
      .filter((m): m is number => m !== null)
      .forEach(midi => {
        result[midi] = { showLabel: true, colorOptions: {} };
      });
    return result;
  }, [currentHighlightedNotes]);

  // Width based on number of keys in range (keep compact)
  const keyboardWidth = (() => {
    const numKeys = noteRange.last - noteRange.first + 1;
    return Math.min(640, Math.max(320, numKeys * 22));
  })();

  return (
    <div className={styles.progressionCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <h3>{progression.name}</h3>
          <div className={styles.cardMeta}>
            <button 
              className={`${styles.badge} ${styles.clickable}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onComplexityClick) onComplexityClick(progression.complexity);
              }}
              title={`Filter by ${progression.complexity} complexity`}
            >
              {progression.complexity}
            </button>
            {progression.genre.slice(0, 2).map(genre => (
              <button 
                key={genre} 
                className={`${styles.genreBadge} ${styles.clickable}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGenreClick) onGenreClick(genre);
                }}
                title={`Filter by ${genre} genre`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        
        <button
          className={styles.downloadButton}
          onClick={handleDownloadXML}
          title="Download as MusicXML"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.compactVisualization}>
          <div className={styles.visualizationTop}>
            <div className={styles.chordDisplay}>
              <div className={styles.romanNumerals}>
                {progression.chords.map((numeral, idx) => (
                  <span 
                    key={idx} 
                    className={`${styles.romanNumeral} ${highlightedChordIndex === idx ? styles.active : ''}`}
                    onMouseEnter={() => setHighlightedChordIndex(idx)}
                    onMouseLeave={() => setHighlightedChordIndex(-1)}
                  >
                    {numeral}
                  </span>
                ))}
              </div>
              <div className={styles.chordSymbols}>
                {resolvedChords.map((chord, idx) => (
                  <span 
                    key={idx} 
                    className={`${styles.chordSymbol} ${highlightedChordIndex === idx ? styles.active : ''}`}
                    onMouseEnter={() => setHighlightedChordIndex(idx)}
                    onMouseLeave={() => setHighlightedChordIndex(-1)}
                  >
                    {chord.chordSymbol}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.progressionInfo}>
              <p className={styles.description}>
                {progression.description}
                {' • '}
                <strong>Moods:</strong> {progression.mood.join(', ')}
                {' • '}
                <strong>Genres:</strong> {progression.genre.join(', ')}
                {' • '}
                <strong>Length:</strong> {progression.chords.length} chords
              </p>

              <p className={styles.chordFunctionsText}>
                <strong>Chord Functions:</strong>{' '}
                {resolvedChords.map((chord, idx) => (
                  <span key={idx}>
                    {idx > 0 && ' • '}
                    <span className={styles.functionNumeral}>{chord.romanNumeral}</span>
                    {' '}
                    <span className={styles.functionChord}>{chord.chordSymbol}</span>
                    {' '}
                    <span className={styles.functionName}>({chord.function})</span>
                  </span>
                ))}
              </p>
            </div>
          </div>

          <div className={styles.keyboardAndPlayerRow}>
            <div className={styles.keyboardSide}>
              <CustomKeyboard
                noteRange={noteRange}
                width={keyboardWidth}
                keyWidthToHeight={0.24}
                activeNotes={activeMidiNumbers}
                useColors={true}
              />
            </div>
            <div className={styles.playerSide}>
              <ProgressionPlayer 
                chords={resolvedChords} 
                onChordChange={setHighlightedChordIndex}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
