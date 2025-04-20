'use client';
import { useRef, useEffect, useState } from 'react';
import FixedSizeList from '../chords/FixedSizeList';
import type { ScaleInfo } from './scaleUtils';
import ScaleRow from './ScaleRow';
import styles from './scales.module.css';

interface ScalesListProps {
  scales: ScaleInfo[];
  useColors?: boolean; // Color mode flag
  showPlayedNotes?: boolean; // Show played notes flag
}

export default function ScalesList({ scales, useColors = false, showPlayedNotes = false }: ScalesListProps) {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const prototypeRef = useRef<HTMLDivElement>(null);
  const [listSize, setListSize] = useState({ height: 600, width: 1000 });
  const [itemSize, setItemSize] = useState(560); // fallback default
  const [measured, setMeasured] = useState(false);

  // Measure container size (for list viewport)
  useEffect(() => {
    if (!listContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setListSize({ width, height });
      }
    });
    observer.observe(listContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Measure a prototype row once (first scale) to derive row height
  useEffect(() => {
    if (measured) return;
    if (!prototypeRef.current) return;
    const h = prototypeRef.current.getBoundingClientRect().height;
    if (h > 0) {
      // Add a small buffer for hover shadow growth
      setItemSize(Math.ceil(h + 8));
      setMeasured(true);
    }
  }, [measured, scales.length, useColors]);

  if (scales.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyStateTitle}>No scales found</h3>
        <p className={styles.emptyStateText}>Try adjusting your filters to see more scales.</p>
      </div>
    );
  }

  // Render hidden prototype row for measurement before list
  return (
    <div className={styles.scalesList} ref={listContainerRef} style={{ height: '70vh', width: '100%', minHeight: '600px' }}>
      {!measured && (
        <div ref={prototypeRef} style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: listSize.width }}>
          <ScaleRow scale={scales[0]} useColors={useColors} />
        </div>
      )}
      {measured && (
        <FixedSizeList
          height={Math.max(listSize.height, itemSize)}
          width={Math.max(listSize.width, 1)}
          itemCount={scales.length}
          itemSize={itemSize}
          overscanCount={6}
        >
          {({ index, style }) => {
            const scale = scales[index];
            if (!scale) return null;
            return (
              <ScaleRow
                scale={scale}
                style={style}
                useColors={useColors}
                showPlayedNotes={showPlayedNotes}
              />
            );
          }}
        </FixedSizeList>
      )}
    </div>
  );
}

