import { useState, useEffect, useMemo } from 'react';
import { RomanNumeral, DIATONIC_CHORDS } from './constants';
import { getDiatonicChords, resolveProgression } from './progressionUtils';
import { generateProgressionMusicXML } from './progressionXmlBuilder';
import ProgressionPlayer from './ProgressionPlayer';
import CustomKeyboard from '@/components/Keyboard/CustomKeyboard';
import { rangeFromMinMidiTwoOctaves } from '../lib/keyboardRange';
import { chordSymbolToNotes } from './progressionUtils';
import styles from './progressions.module.css';

interface ProgressionBuilderProps {
  selectedKey: string;
  mode: 'major' | 'minor';
}

export default function ProgressionBuilder({ selectedKey, mode }: ProgressionBuilderProps) {
  const [customChords, setCustomChords] = useState<RomanNumeral[]>([]);
  const [hoveredChordIndex, setHoveredChordIndex] = useState(-1);
  const [savedProgressions, setSavedProgressions] = useState<Array<{ name: string; chords: RomanNumeral[] }>>([]);
  
  // Load saved progressions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('customProgressions');
      if (saved) {
        setSavedProgressions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved progressions:', error);
    }
  }, []);

  // Get available diatonic chords for the current key and mode
  const availableChords = getDiatonicChords(selectedKey, mode);
  const diatonicRomanNumerals = DIATONIC_CHORDS[mode].map(c => c.numeral as RomanNumeral);

  // Resolve custom progression
  const resolvedChords = useMemo(() => {
    return customChords.length > 0 
      ? resolveProgression(customChords, selectedKey, mode)
      : [];
  }, [customChords, selectedKey, mode]);

  const handleAddChord = (numeral: RomanNumeral) => {
    setCustomChords([...customChords, numeral]);
  };

  const handleRemoveChord = (index: number) => {
    setCustomChords(customChords.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setCustomChords([]);
  };

  const handleSave = () => {
    if (customChords.length === 0) return;
    
    const name = prompt('Enter a name for this progression:');
    if (!name) return;

    const newProgression = { name, chords: [...customChords] };
    const updated = [...savedProgressions, newProgression];
    
    setSavedProgressions(updated);
    localStorage.setItem('customProgressions', JSON.stringify(updated));
  };

  const handleLoad = (progression: { name: string; chords: RomanNumeral[] }) => {
    setCustomChords([...progression.chords]);
  };

  const handleDelete = (index: number) => {
    const updated = savedProgressions.filter((_, i) => i !== index);
    setSavedProgressions(updated);
    localStorage.setItem('customProgressions', JSON.stringify(updated));
  };

  const handleDownloadXML = () => {
    if (resolvedChords.length === 0) return;

    const xml = generateProgressionMusicXML(
      'Custom Progression',
      resolvedChords,
      selectedKey,
      120
    );

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom_progression_${selectedKey}_${mode}.musicxml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get highlighted notes for keyboard
  const currentHighlightedNotes = useMemo(() => {
    const getHighlightedNotesLocal = (chordIndex: number) => {
      if (chordIndex < 0 || chordIndex >= resolvedChords.length) return new Set<string>();
      const chord = resolvedChords[chordIndex];
      const notes = chordSymbolToNotes(chord.chordSymbol, 4);
      return new Set(notes.map(n => `${n.note}${n.octave}`));
    };
    return hoveredChordIndex >= 0 
      ? getHighlightedNotesLocal(hoveredChordIndex)
      : new Set<string>();
  }, [hoveredChordIndex, resolvedChords]);

  // Convert noteId (e.g., C#4) to MIDI
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

  const noteRange = useMemo(() => {
    const midiArray = Object.keys(activeMidiNumbers).map(Number);
    const minMidi = midiArray.length ? Math.min(...midiArray) : 60; // default near C4
    return rangeFromMinMidiTwoOctaves(minMidi);
  }, [activeMidiNumbers]);

  const keyboardWidth = (() => {
    const numKeys = noteRange.last - noteRange.first + 1;
    return Math.min(680, Math.max(340, numKeys * 22));
  })();

  return (
    <div className={styles.progressionBuilder}>
      <h2>Custom Progression Builder</h2>
      
      <div className={styles.builderContent}>
        <div className={styles.builderSection}>
          <h3>Available Chords in {selectedKey} {mode}</h3>
          <div className={styles.chordPalette}>
            {availableChords.map((chord, idx) => (
              <button
                key={idx}
                className={styles.paletteChord}
                onClick={() => handleAddChord(diatonicRomanNumerals[idx])}
                title={`${chord.romanNumeral} - ${chord.chordSymbol} (${chord.function})`}
              >
                <div className={styles.paletteRoman}>{chord.romanNumeral}</div>
                <div className={styles.paletteSymbol}>{chord.chordSymbol}</div>
                <div className={styles.paletteFunction}>{chord.function}</div>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.builderSection}>
          <h3>Your Progression</h3>
          {customChords.length === 0 ? (
            <p className={styles.emptyState}>Click chords above to build your progression</p>
          ) : (
            <>
              <div className={styles.customProgression}>
                {customChords.map((numeral, idx) => {
                  const chord = resolvedChords[idx];
                  return (
                    <div
                      key={idx}
                      className={`${styles.customChord} ${hoveredChordIndex === idx ? styles.active : ''}`}
                      onMouseEnter={() => setHoveredChordIndex(idx)}
                      onMouseLeave={() => setHoveredChordIndex(-1)}
                    >
                      <button
                        className={styles.removeChord}
                        onClick={() => handleRemoveChord(idx)}
                        aria-label="Remove chord"
                      >
                        ×
                      </button>
                      <div className={styles.customRoman}>{numeral}</div>
                      <div className={styles.customSymbol}>{chord.chordSymbol}</div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.builderActions}>
                <button className={styles.actionButton} onClick={handleClear}>
                  Clear All
                </button>
                <button className={styles.actionButton} onClick={handleSave}>
                  Save Progression
                </button>
                <button className={styles.actionButton} onClick={handleDownloadXML}>
                  Download XML
                </button>
              </div>

              <div className={styles.keyboardVisualization}>
                <h4>Keyboard Preview (Two Octaves)</h4>
                <p className={styles.hint}>Hover over chords to see them on the keyboard</p>
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
                      onChordChange={setHoveredChordIndex}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {savedProgressions.length > 0 && (
          <div className={styles.builderSection}>
            <h3>Saved Progressions</h3>
            <div className={styles.savedList}>
              {savedProgressions.map((progression, idx) => (
                <div key={idx} className={styles.savedItem}>
                  <div className={styles.savedInfo}>
                    <strong>{progression.name}</strong>
                    <span className={styles.savedChords}>
                      {progression.chords.join(' - ')}
                    </span>
                  </div>
                  <div className={styles.savedActions}>
                    <button
                      className={styles.loadButton}
                      onClick={() => handleLoad(progression)}
                    >
                      Load
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(idx)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
