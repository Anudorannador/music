'use client';
import { useState } from 'react';
import { getKeyInfo, getMinorKeyInfo } from './keyUtils';
import KeyKeyboard from './KeyKeyboard';
import KeyNotation from './KeyNotation';
import KeyIntervalDisplay from './KeyIntervalDisplay';
import styles from './keys.module.css';

/**
 * Component to display parallel and relative major/minor key relationships
 * with visual keyboard, notation, and mathematical interval relationships
 */
export default function RelativeKeys() {
  const [selectedNote, setSelectedNote] = useState<string>('C');
  const [useColors, setUseColors] = useState<boolean>(true);
  
  const notes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  // Get major key info
  const majorKey = getKeyInfo(selectedNote);
  
  // Get parallel minor (same tonic, different mode)
  const parallelMinor = getMinorKeyInfo(selectedNote);
  
  // Get relative minor (from major key data)
  const relativeMinorKey = majorKey?.minorRelative 
    ? getMinorKeyInfo(majorKey.minorRelative)
    : null;
  
  if (!majorKey || !parallelMinor || !relativeMinorKey) {
    return <div>Error loading key information</div>;
  }
  
  return (
    <div className={styles.relativeKeysSection}>
      <h2 className={styles.sectionTitle}>Key Relationships</h2>
      
      <div className={styles.controlsRow}>
        <div className={styles.noteSelector}>
          <label htmlFor="note-select" className={styles.label}>
            Select Root Note:
          </label>
          <select
            id="note-select"
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
            className={styles.select}
          >
            {notes.map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.colorToggle}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={useColors}
              onChange={(e) => setUseColors(e.target.checked)}
            />
            {' '}Enable Octave Colors
          </label>
        </div>
      </div>
      
      {/* Major Key */}
      <div className={styles.keySection}>
        <h3 className={styles.keyTitle}>
          {majorKey.tonic} Major
        </h3>
        <div className={styles.keyVisualization}>
          <div className={styles.visualColumn}>
            <h4 className={styles.visualLabel}>Keyboard</h4>
            <KeyKeyboard keyInfo={majorKey} useColors={useColors} />
          </div>
          <div className={styles.visualColumn}>
            <h4 className={styles.visualLabel}>Notation</h4>
            <KeyNotation keyInfo={majorKey} useColors={useColors} />
          </div>
        </div>
        <div className={styles.keyInfo}>
          <span><strong>Scale:</strong> {majorKey.scale.map(n => n.replace(/\d+/g, '')).join(' - ')}</span>
          <span><strong>Key Signature:</strong> {majorKey.alteration === 0 ? 'No sharps or flats' : `${Math.abs(majorKey.alteration)} ${majorKey.alteration > 0 ? 'sharp' : 'flat'}${Math.abs(majorKey.alteration) > 1 ? 's' : ''}`}</span>
        </div>
      </div>
      
      {/* Parallel Minor */}
      <div className={styles.keySection}>
        <h3 className={styles.keyTitle}>
          {parallelMinor.tonic} Minor <span className={styles.relationshipBadge}>Parallel Key</span>
        </h3>
        <div className={styles.keyVisualization}>
          <div className={styles.visualColumn}>
            <h4 className={styles.visualLabel}>Keyboard</h4>
            <KeyKeyboard keyInfo={parallelMinor} useColors={useColors} />
          </div>
          <div className={styles.visualColumn}>
            <h4 className={styles.visualLabel}>Notation</h4>
            <KeyNotation keyInfo={parallelMinor} useColors={useColors} />
          </div>
        </div>
        <div className={styles.keyInfo}>
          <span><strong>Scale:</strong> {parallelMinor.scale.map(n => n.replace(/\d+/g, '')).join(' - ')}</span>
          <span><strong>Key Signature:</strong> {parallelMinor.alteration === 0 ? 'No sharps or flats' : `${Math.abs(parallelMinor.alteration)} ${parallelMinor.alteration > 0 ? 'sharp' : 'flat'}${Math.abs(parallelMinor.alteration) > 1 ? 's' : ''}`}</span>
        </div>
        <KeyIntervalDisplay 
          key1={majorKey} 
          key2={parallelMinor} 
          relationshipLabel="Parallel Key Relationship (Same Root, Different Mode)"
        />
      </div>
      
      {/* Relative Minor */}
      <div className={styles.keySection}>
        <h3 className={styles.keyTitle}>
          {relativeMinorKey.tonic} Minor <span className={styles.relationshipBadge}>Relative Key</span>
        </h3>
        <div className={styles.keyVisualization}>
          <div className={styles.visualColumn}>
            <h4 className={styles.visualLabel}>Keyboard</h4>
            <KeyKeyboard keyInfo={relativeMinorKey} useColors={useColors} />
          </div>
          <div className={styles.visualColumn}>
            <h4 className={styles.visualLabel}>Notation</h4>
            <KeyNotation keyInfo={relativeMinorKey} useColors={useColors} />
          </div>
        </div>
        <div className={styles.keyInfo}>
          <span><strong>Scale:</strong> {relativeMinorKey.scale.map(n => n.replace(/\d+/g, '')).join(' - ')}</span>
          <span><strong>Key Signature:</strong> {relativeMinorKey.alteration === 0 ? 'No sharps or flats' : `${Math.abs(relativeMinorKey.alteration)} ${relativeMinorKey.alteration > 0 ? 'sharp' : 'flat'}${Math.abs(relativeMinorKey.alteration) > 1 ? 's' : ''}`}</span>
        </div>
        <KeyIntervalDisplay 
          key1={majorKey} 
          key2={relativeMinorKey} 
          relationshipLabel="Relative Key Relationship (Same Key Signature, Different Root)"
        />
      </div>
      
      <div className={styles.infoBox}>
        <h3 className={styles.infoTitle}>Understanding Key Relationships</h3>
        <ul className={styles.infoList}>
          <li>
            <strong>Parallel Keys:</strong> Share the same tonic (root note) but have different key signatures.
            The intervals between certain scale degrees change, typically the 3rd, 6th, and 7th degrees.
          </li>
          <li>
            <strong>Relative Keys:</strong> Share the same key signature but have different tonics.
            They contain the exact same notes, but the tonal center (root) is different.
          </li>
          <li>
            <strong>Mathematical Relationships:</strong> The interval calculations show the precise semitone 
            distances and scale degree modifications between keys, making the relationships transparent and measurable.
          </li>
        </ul>
      </div>
    </div>
  );
}
