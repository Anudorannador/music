'use client';
import { KeyInfo } from './keyUtils';
import styles from './keys.module.css';

interface KeySignatureDisplayProps {
  keyInfo: KeyInfo;
  showDetails?: boolean;
}

/**
 * Component to display key signature information
 */
export default function KeySignatureDisplay({ 
  keyInfo, 
  showDetails = true 
}: KeySignatureDisplayProps) {
  const { tonic, type, alteration, accidentals, keySignature } = keyInfo;
  
  // Determine if using sharps or flats
  const isSharp = alteration > 0;
  const isFlat = alteration < 0;
  const symbol = isSharp ? '♯' : isFlat ? '♭' : '';
  const count = Math.abs(alteration);
  
  return (
    <div className={styles.keySignature}>
      <div className={styles.keyHeader}>
        <h3 className={styles.keyName}>
          {tonic} {type === 'major' ? 'Major' : 'Minor'}
        </h3>
        <span className={styles.keySignatureSymbol}>
          {count > 0 ? `${count}${symbol}` : 'No sharps/flats'}
        </span>
      </div>
      
      {showDetails && (
        <div className={styles.keyDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Key Signature:</span>
            <span className={styles.detailValue}>{keySignature || 'C major / A minor'}</span>
          </div>
          
          {accidentals.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Accidentals:</span>
              <span className={styles.detailValue}>
                {accidentals.join(', ')}
              </span>
            </div>
          )}
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Scale Notes:</span>
            <span className={styles.detailValue}>
              {keyInfo.scale.join(' - ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
