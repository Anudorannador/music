'use client';

import { useMemo } from 'react';
import styles from './chords.module.css';
import { 
  generateChordMusicXML, 
  Chord
} from './chordUtils';
import ChordKeyboard from './ChordKeyboard';
import PlayNotation from '../../components/PlayNotation';
import { getNoteColors } from '../lib/noteColors';

export type ListItemAriaAttributes = {
  role: 'listitem';
  'aria-posinset': number;
  'aria-setsize': number;
};

export type ChordRowProps = {
  chord: Chord;
  onPlay: (chord: Chord, type: 'arpeggio' | 'block', elementRef?: HTMLElement | null) => void;
  colorMode: boolean;
  style?: React.CSSProperties;
  ariaAttributes?: ListItemAriaAttributes;
  currentArpIndex?: number | null;
  playedArpIndices?: Set<number>;
  showPlayedKeys?: boolean;
};

// Component to render a single chord row
export default function ChordRow({
  chord,
  onPlay,
  colorMode,
  style,
  ariaAttributes,
  currentArpIndex,
  playedArpIndices,
  showPlayedKeys,
}: ChordRowProps) {
  // Generate colors based on note names - memoized for performance
  const noteColors = useMemo(() => 
    colorMode ? getNoteColors(chord.notes) : undefined
  , [chord.notes, colorMode]);
  
  // Generate MusicXML for arpeggio and block formats
  const arpeggioXML = useMemo(() =>
    generateChordMusicXML(chord, 'arpeggio', noteColors)
  , [chord, noteColors]);
  
  const blockXML = useMemo(() =>
    generateChordMusicXML(chord, 'block', noteColors)
  , [chord, noteColors]);
  
  // Handle play button clicks
  const handlePlayClick = (format: 'arpeggio' | 'block', event: React.MouseEvent<HTMLButtonElement>) => {
    onPlay(chord, format, event.currentTarget);
  };
  
  // Render chord information section
  const ChordInfo = () => (
    <div className={styles.nameColumn}>
      <div className={styles.chordName}>{chord.name}</div>
      <div className={styles.chordAbbr}>{chord.abbreviation}</div>
    </div>
  );
  
  // Render play controls
  const PlayControls = () => (
    <div className={styles.playColumn}>
      <button 
        className={`${styles.playButton} ${styles.arpeggio}`}
        onClick={(e) => handlePlayClick('arpeggio', e)}
        title="Play Arpeggio"
      >
        ♫ Arpeggio
      </button>
      <button 
        className={`${styles.playButton} ${styles.block}`}
        onClick={(e) => handlePlayClick('block', e)}
        title="Play Block"
      >
        ♪ Block
      </button>
    </div>
  );
  
  return (
    <div 
      className={styles.tableRow} 
      style={style}
      {...(ariaAttributes || {})}
    >
      <ChordInfo />
      
      <div className={styles.notationColumn}>
        <PlayNotation musicXML={arpeggioXML} currentNoteIndex={currentArpIndex ?? undefined} className={styles.notation} />
      </div>
      
      <div className={styles.notationColumn}>
        <PlayNotation musicXML={blockXML} className={styles.notation} />
      </div>
      
      <div className={styles.keyboardColumn}>
        <ChordKeyboard chord={chord} noteColors={noteColors} currentIndex={currentArpIndex} playedIndices={playedArpIndices} showPlayedKeys={showPlayedKeys} />
      </div>
      
      <PlayControls />
    </div>
  );
}