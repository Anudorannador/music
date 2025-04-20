'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import styles from './chords.module.css';
import { 
  generateChords,
  createAudioContext,
  Chord,
  getVoicedMidiNotes
} from './chordUtils';
import { getChordAudioPlayer } from './chordAudioPlayer';
import ChordRow from './ChordRow';
import FixedSizeList from './FixedSizeList';
import { filterChords, shiftChordsOctave, extractChordTypes, extractRootNotes } from './filterUtils';

// Add type declaration for WebKit audio context
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const ROW_HEIGHT = 185;

export default function ChordsPage() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playingInstanceRef = useRef<{chordId: string, elementRef: HTMLElement | null}[]>([]);
  const [currentArpChordId, setCurrentArpChordId] = useState<string | null>(null);
  const [currentArpIndex, setCurrentArpIndex] = useState<number | null>(null);
  const [playedArpIndices, setPlayedArpIndices] = useState<Set<number>>(new Set());
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listSize, setListSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // Add filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRootNotes, setSelectedRootNotes] = useState<string[]>([]);
  const [selectedChordTypes, setSelectedChordTypes] = useState<string[]>([]);
  const [selectedIncludeKeys, setSelectedIncludeKeys] = useState<string[]>([]);
  const [selectedNumberOfKeys, setSelectedNumberOfKeys] = useState<number[]>([]);
  const [selectedOctave, setSelectedOctave] = useState<number>(4); // Default to C4 (current implementation)

  // Add color mode state
  const [colorMode, setColorMode] = useState<boolean>(true);
  const [showPlayedKeys, setShowPlayedKeys] = useState<boolean>(false);
  
  // Initialize Audio Context when component mounts
  useEffect(() => {
    audioContextRef.current = createAudioContext();
 
    return () => {
      // Cleanup audio context on unmount
      // Don't close the audio context - let it persist for reuse
      // Trying to close an already-closed AudioContext causes InvalidStateError
    };
  }, []);

  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      setListSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      if (typeof window === 'undefined') {
        return undefined;
      }
      window.addEventListener('resize', updateSize);
      return () => {
        window.removeEventListener('resize', updateSize);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const allChords = useMemo(() => generateChords(), []);
  
  // Extract unique chord types and root notes for filters
  const chordTypes = useMemo(() => extractChordTypes(allChords), [allChords]);
  const rootNotes = useMemo(() => extractRootNotes(allChords), [allChords]);
  
  // Filter chords based on search query and selected filters
  const filteredChords = useMemo(() => filterChords(allChords, {
    searchQuery,
    selectedRootNotes,
    selectedChordTypes,
    selectedIncludeKeys,
    selectedNumberOfKeys
  }), [
    allChords, 
    searchQuery, 
    selectedRootNotes, 
    selectedChordTypes, 
    selectedIncludeKeys, 
    selectedNumberOfKeys
  ]);
  
  // Shift chord octaves based on selected octave
  const shiftedChords = useMemo(() => 
    shiftChordsOctave(filteredChords, selectedOctave), 
    [filteredChords, selectedOctave]
  );

  const listKey = useMemo(() => (
    [
      searchQuery,
      selectedRootNotes.join(','),
      selectedChordTypes.join(','),
      selectedIncludeKeys.join(','),
      selectedNumberOfKeys.join(','),
      selectedOctave,
      colorMode ? 'color' : 'bw',
      shiftedChords.length,
    ].join('|')
  ), [
    searchQuery,
    selectedRootNotes,
    selectedChordTypes,
    selectedIncludeKeys,
    selectedNumberOfKeys,
    selectedOctave,
    colorMode,
    shiftedChords,
  ]);

  // Play a chord in either arpeggio or block format
  const handlePlay = useCallback((chord: Chord, type: 'arpeggio' | 'block', elementRef?: HTMLElement | null) => {
    // Save current chord ID before playing
    const chordId = chord.name;
    
    // Only track the chord being played without updating visible UI state
    playingInstanceRef.current.push({
      chordId,
      elementRef: elementRef || null
    });
    
  // Tone.js player handles audio; use voiced notes to match notation
  const midiNotes = getVoicedMidiNotes(chord, type).filter(m => m !== -1);
    
    // Define the finish handler separately to maintain clean code
    const handleFinish = () => {
      // Remove this chord from the playing instances without updating UI
      playingInstanceRef.current = playingInstanceRef.current.filter(
        instance => instance.chordId !== chordId
      );
    };
    
    // Clear any existing timeout
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    
    const player = getChordAudioPlayer();
    if (type === 'arpeggio') {
      setCurrentArpChordId(chordId);
      setCurrentArpIndex(null);
      setPlayedArpIndices(new Set());
      player.playArpeggio({
        midiNotes,
        tempo: 0.3,
        sustainFactor: 1.3, // slightly longer than scales per your request
        releaseFactor: 1.3,
        onNoteStart: (index) => setCurrentArpIndex(index),
        onNoteEnd: (index) => {
          if (index === midiNotes.length - 1) return;
          // Add this index to played indices
          setPlayedArpIndices(prev => new Set([...prev, index]));
          setCurrentArpIndex(null);
        },
        onComplete: () => {
          handleFinish();
          setCurrentArpChordId(null);
          setCurrentArpIndex(null);
          setPlayedArpIndices(new Set());
        }
      });
    } else {
      player.playBlock({
        midiNotes,
        tempo: 1.5,
        sustainFactor: 1.2,
        releaseFactor: 1.2,
        onComplete: handleFinish
      });
      setCurrentArpChordId(null);
      setCurrentArpIndex(null);
      setPlayedArpIndices(new Set());
    }
  }, []);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRootNotes([]);
    setSelectedChordTypes([]);
    setSelectedIncludeKeys([]);
    setSelectedNumberOfKeys([]);
    setSelectedOctave(4); // Reset octave to default C4
  };
  
  return (
    <main className={styles.main}>
      {/* Audio container for isolating playback from the UI */}
      <div ref={audioContainerRef} className={styles.audioContainer}></div>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Chord Reference</h1>
        <Link href="/" className={styles.backButton}>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="dark:invert"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </Link>
      </div>
      
      <div className={styles.filterSection}>
        
        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <label htmlFor="rootNote">Root Note:&nbsp;</label>
            <div className={styles.multiSelectContainer}>
              {rootNotes.map((note) => (
                <div 
                  key={note} 
                  className={`${styles.multiSelectOption} ${selectedRootNotes.includes(note) ? styles.selected : ''}`}
                  onClick={() => {
                    if (selectedRootNotes.includes(note)) {
                      setSelectedRootNotes(selectedRootNotes.filter(n => n !== note));
                    } else {
                      setSelectedRootNotes([...selectedRootNotes, note].sort());
                    }
                  }}
                >
                  <span className={styles.optionText}>{note}</span>
                  {selectedRootNotes.includes(note) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </div>
              ))}
              {selectedRootNotes.length > 0 && (
                <button 
                  onClick={() => setSelectedRootNotes([])}
                  className={styles.clearButton}
                  title="Clear selection"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="chordType">Chord Type:&nbsp;</label>
            <div className={styles.multiSelectContainer}>
              {chordTypes.map((type) => (
                <div 
                  key={type} 
                  className={`${styles.multiSelectOption} ${selectedChordTypes.includes(type) ? styles.selected : ''}`}
                  onClick={() => {
                    if (selectedChordTypes.includes(type)) {
                      setSelectedChordTypes(selectedChordTypes.filter(t => t !== type));
                    } else {
                      setSelectedChordTypes([...selectedChordTypes, type]);
                    }
                  }}
                >
                  <span className={styles.optionText}>{type}</span>
                  {selectedChordTypes.includes(type) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </div>
              ))}
              {selectedChordTypes.length > 0 && (
                <button 
                  onClick={() => setSelectedChordTypes([])}
                  className={styles.clearButton}
                  title="Clear selection"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="includeKeys">Include Key(s):&nbsp;</label>
            <div className={styles.multiSelectContainer}>
              {rootNotes.map((note) => (
                <div 
                  key={note} 
                  className={`${styles.multiSelectOption} ${selectedIncludeKeys.includes(note) ? styles.selected : ''}`}
                  onClick={() => {
                    if (selectedIncludeKeys.includes(note)) {
                      setSelectedIncludeKeys(selectedIncludeKeys.filter(n => n !== note));
                    } else {
                      setSelectedIncludeKeys([...selectedIncludeKeys, note].sort());
                    }
                  }}
                >
                  <span className={styles.optionText}>{note}</span>
                  {selectedIncludeKeys.includes(note) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </div>
              ))}
              {selectedIncludeKeys.length > 0 && (
                <button 
                  onClick={() => setSelectedIncludeKeys([])}
                  className={styles.clearButton}
                  title="Clear selection"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="numberOfKeys">Number of Keys:&nbsp;</label>
            <div className={styles.multiSelectContainer}>
              {[3, 4, 5].map(num => (
                <div 
                  key={num} 
                  className={`${styles.multiSelectOption} ${selectedNumberOfKeys.includes(num) ? styles.selected : ''}`}
                  onClick={() => {
                    if (selectedNumberOfKeys.includes(num)) {
                      setSelectedNumberOfKeys(selectedNumberOfKeys.filter(n => n !== num));
                    } else {
                      setSelectedNumberOfKeys([...selectedNumberOfKeys, num].sort((a, b) => a - b));
                    }
                  }}
                >
                  <span className={styles.optionText}>{num}</span>
                  {selectedNumberOfKeys.includes(num) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </div>
              ))}
              {selectedNumberOfKeys.length > 0 && (
                <button 
                  onClick={() => setSelectedNumberOfKeys([])}
                  className={styles.clearButton}
                  title="Clear selection"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="octaveRange">Octave Base:&nbsp;</label>
            <select 
              id="octaveRange" 
              value={selectedOctave}
              onChange={(e) => setSelectedOctave(parseInt(e.target.value))}
              className={styles.filterSelect}
            >
              <option value="1">C1</option>
              <option value="2">C2</option>
              <option value="3">C3</option>
              <option value="4">C4 (Default)</option>
              <option value="5">C5</option>
              <option value="6">C6</option>
              <option value="7">C7</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="colorMode">Notation Mode:&nbsp;</label>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="colorMode"
                checked={colorMode}
                onChange={() => setColorMode(!colorMode)}
                hidden={true}
                className={styles.toggleInput}
              />
              <label htmlFor="colorMode" className={styles.toggleLabel}>
                <span className={styles.toggleOption}>B&W</span>
                <span className={styles.toggleSlider}></span>
                <span className={styles.toggleOption}>Color</span>
              </label>
            </div>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="showPlayedKeys">Show Played Keys:&nbsp;</label>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="showPlayedKeys"
                checked={showPlayedKeys}
                onChange={() => setShowPlayedKeys(!showPlayedKeys)}
                hidden={true}
                className={styles.toggleInput}
              />
              <label htmlFor="showPlayedKeys" className={styles.toggleLabel}>
                <span className={styles.toggleOption}>Off</span>
                <span className={styles.toggleSlider}></span>
                <span className={styles.toggleOption}>On</span>
              </label>
            </div>
          </div>
          
          <button 
            onClick={handleResetFilters}
            className={styles.resetButton}
            title="Reset Filters"
          >
            Reset
          </button>
        </div>
        
        <div className={styles.resultStats}>
          {shiftedChords.length} chord{shiftedChords.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      <div className={styles.chordTable}>
        <div className={styles.tableHeader}>
          <div className={styles.nameColumn}>Chord Name</div>
          <div className={styles.notationColumn}>Arpeggio</div>
          <div className={styles.notationColumn}>Block</div>
          <div className={styles.keyboardColumn}>Keyboard</div>
          <div className={styles.playColumn}>Play</div>
        </div>
        
        <div className={styles.tableBody} style={{ height: '75vh' }}>
          {shiftedChords.length > 0 ? (
            <div ref={listContainerRef} className={styles.autoSizerWrapper}>
              <FixedSizeList
                key={listKey}
                className={styles.virtualList}
                height={Math.max(listSize.height, ROW_HEIGHT)}
                width={Math.max(listSize.width, 1)}
                itemCount={shiftedChords.length}
                itemSize={ROW_HEIGHT}
                overscanCount={5}
              >
                {({ index, style, ariaAttributes }) => {
                  const chord = shiftedChords[index];
                  if (!chord) {
                    return null;
                  }

                  return (
                    <ChordRow
                      chord={chord}
                      onPlay={handlePlay}
                      colorMode={colorMode}
                      style={style}
                      ariaAttributes={ariaAttributes}
                      currentArpIndex={currentArpChordId === chord.name ? currentArpIndex : null}
                      playedArpIndices={currentArpChordId === chord.name ? playedArpIndices : undefined}
                      showPlayedKeys={showPlayedKeys}
                    />
                  );
                }}
              </FixedSizeList>
            </div>
          ) : (
            <div className={styles.noResults}>
              No chords match your current filters. Try adjusting your search criteria.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}