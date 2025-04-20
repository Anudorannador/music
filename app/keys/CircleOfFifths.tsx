'use client';
import { useState, useEffect } from 'react';
import { CircleOfFifths as CircleOfFifthsComponent } from 'react-circle-of-fifths';
import type { CircleOfFifthsSelection } from 'react-circle-of-fifths';
import { getKeyInfo, getMinorKeyInfo } from './keyUtils';
import styles from './keys.module.css';

/**
 * Interactive Circle of Fifths visualization using react-circle-of-fifths library
 */
export default function CircleOfFifths() {
  const [selection, setSelection] = useState<CircleOfFifthsSelection | undefined>();
  const [mounted, setMounted] = useState(false);
  
  // Only render the circle component after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get detailed key information when a key is selected
  const selectedKeyInfo = selection 
    ? (selection.tonality === 'major' 
        ? getKeyInfo(selection.tonic) 
        : getMinorKeyInfo(selection.tonic))
    : null;
  
  return (
    <div className={styles.circleOfFifthsSection}>
      <h2 className={styles.sectionTitle}>Circle of Fifths</h2>
      
      <div className={styles.circleContainer}>
        <div className={styles.circleWrapper}>
          {mounted ? (
            <CircleOfFifthsComponent handleKeySelection={setSelection} />
          ) : (
            <div className={styles.loadingPlaceholder}>
              Loading Circle of Fifths...
            </div>
          )}
        </div>
        
        {selectedKeyInfo && (
          <div className={styles.selectedKeyInfo}>
            <h3 className={styles.selectedKeyTitle}>
              {selectedKeyInfo.tonic} {selectedKeyInfo.type === 'major' ? 'Major' : 'Minor'}
            </h3>
            <div className={styles.selectedKeyDetails}>
              <p>
                <strong>Key Signature:</strong>{' '}
                {selectedKeyInfo.alteration === 0
                  ? 'No sharps or flats'
                  : `${Math.abs(selectedKeyInfo.alteration)} ${
                      selectedKeyInfo.alteration > 0 ? 'sharp' : 'flat'
                    }${Math.abs(selectedKeyInfo.alteration) > 1 ? 's' : ''}`}
              </p>
              {selectedKeyInfo.accidentals.length > 0 && (
                <p>
                  <strong>Accidentals:</strong> {selectedKeyInfo.accidentals.join(', ')}
                </p>
              )}
              <p>
                <strong>Scale:</strong> {selectedKeyInfo.scale.join(' - ')}
              </p>
              {selectedKeyInfo.type === 'major' && selectedKeyInfo.minorRelative && (
                <p>
                  <strong>Relative Minor:</strong> {selectedKeyInfo.minorRelative}
                </p>
              )}
              {selectedKeyInfo.type === 'minor' && selectedKeyInfo.relativeMajor && (
                <p>
                  <strong>Relative Major:</strong> {selectedKeyInfo.relativeMajor}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.infoBox}>
        <h3 className={styles.infoTitle}>About the Circle of Fifths</h3>
        <p>
          The Circle of Fifths is a fundamental tool in music theory that shows the relationship 
          between all twelve tones and their key signatures. Moving clockwise adds one sharp, 
          while moving counterclockwise adds one flat. Adjacent keys share many common notes, 
          making them closely related and easy to modulate between.
        </p>
      </div>
    </div>
  );
}
