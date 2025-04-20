'use client';
import type { ScaleInfo } from './scaleUtils';
import { getIntervalNames, getScaleDegreeNames } from './scaleUtils';
import styles from './scales.module.css';

interface ScaleInfoDisplayProps {
  scale: ScaleInfo;
}

export default function ScaleInfoDisplay({ scale }: ScaleInfoDisplayProps) {
  const intervalNames = getIntervalNames(scale.intervals);
  const degreeNames = getScaleDegreeNames();

  return (
    <div className={styles.scaleInfo}>
      {/* Notes */}
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Notes</span>
        <div className={styles.notesList}>
          {scale.notes.map((note, index) => (
            <span key={index} className={styles.note} title={degreeNames[index]}>
              {note}
            </span>
          ))}
        </div>
      </div>

      {/* Intervals */}
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Intervals</span>
        <span className={styles.infoValue}>
          {scale.intervals.join(', ')}
        </span>
      </div>

      {/* Interval Names */}
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Interval Names</span>
        <span className={styles.infoValue}>
          {intervalNames.join(', ')}
        </span>
      </div>

      {/* Chords */}
      {scale.chords && scale.chords.length > 0 && (
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Common Chords</span>
          <span className={styles.infoValue}>
            {scale.chords.slice(0, 7).join(', ')}
            {scale.chords.length > 7 && '...'}
          </span>
        </div>
      )}

      {/* Aliases */}
      {scale.aliases && scale.aliases.length > 0 && (
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Also Known As</span>
          <span className={styles.infoValue}>
            {scale.aliases.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
