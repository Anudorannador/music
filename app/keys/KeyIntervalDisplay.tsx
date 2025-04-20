'use client';
import type { KeyInfo, KeyRelationship } from './keyUtils';
import { getKeyRelationship } from './keyUtils';
import styles from './keys.module.css';

interface KeyIntervalDisplayProps {
  key1: KeyInfo;
  key2: KeyInfo;
  relationshipLabel: string;
}

export default function KeyIntervalDisplay({ key1, key2, relationshipLabel }: KeyIntervalDisplayProps) {
  const relationship: KeyRelationship = getKeyRelationship(key1, key2);
  
  return (
    <div className={styles.intervalDisplay}>
      <h4 className={styles.intervalTitle}>
        {relationshipLabel}
      </h4>
      
      <div className={styles.intervalContent}>
        {/* Root Interval */}
        <div className={styles.intervalRow}>
          <span className={styles.intervalLabel}>Root Interval:</span>
          <span className={styles.intervalValue}>
            {relationship.rootInterval} ({relationship.rootSemitones} semitone{relationship.rootSemitones !== 1 ? 's' : ''})
          </span>
        </div>
        
        {/* Key Signature Difference */}
        <div className={styles.intervalRow}>
          <span className={styles.intervalLabel}>Key Signature:</span>
          <span className={styles.intervalValue}>
            {relationship.keySignatureDiff === 0 ? (
              'Same (No difference)'
            ) : (
              <>
                {relationship.keySignatureDiff > 0 ? '+' : ''}{relationship.keySignatureDiff} 
                {' '}({Math.abs(relationship.keySignatureDiff)} {relationship.keySignatureDiff > 0 ? 'sharp' : 'flat'}{Math.abs(relationship.keySignatureDiff) > 1 ? 's' : ''})
              </>
            )}
          </span>
        </div>
        
        {/* Shared Notes */}
        <div className={styles.intervalRow}>
          <span className={styles.intervalLabel}>Shared Notes:</span>
          <span className={styles.intervalValue}>
            {relationship.sharedNotes.sharedNotes.length} of {Math.max(key1.scale.length, key2.scale.length)} 
            {' '}({relationship.sharedNotes.sharedPercentage}%)
          </span>
        </div>
        
        {relationship.sharedNotes.sharedNotes.length > 0 && (
          <div className={styles.intervalRow}>
            <span className={styles.intervalLabel}>Common:</span>
            <span className={styles.intervalValue}>
              {relationship.sharedNotes.sharedNotes.join(', ')}
            </span>
          </div>
        )}
        
        {/* Scale Differences */}
        {relationship.scaleDifferences.length > 0 && (
          <>
            <div className={styles.intervalSeparator} />
            <div className={styles.intervalRow}>
              <span className={styles.intervalLabel}>Scale Differences:</span>
            </div>
            {relationship.scaleDifferences.map((diff) => (
              <div key={diff.degree} className={styles.intervalRow}>
                <span className={styles.intervalDegree}>
                  Degree {diff.degree}:
                </span>
                <span className={styles.intervalValue}>
                  {diff.key1Note} → {diff.key2Note} 
                  {' '}
                  <span className={styles.intervalChange}>
                    ({diff.intervalChange})
                  </span>
                </span>
              </div>
            ))}
          </>
        )}
        
        {/* Unique Notes */}
        {relationship.sharedNotes.uniqueToKey1.length > 0 && (
          <div className={styles.intervalRow}>
            <span className={styles.intervalLabel}>Only in {key1.tonic} {key1.type}:</span>
            <span className={styles.intervalValue}>
              {relationship.sharedNotes.uniqueToKey1.join(', ')}
            </span>
          </div>
        )}
        
        {relationship.sharedNotes.uniqueToKey2.length > 0 && (
          <div className={styles.intervalRow}>
            <span className={styles.intervalLabel}>Only in {key2.tonic} {key2.type}:</span>
            <span className={styles.intervalValue}>
              {relationship.sharedNotes.uniqueToKey2.join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
