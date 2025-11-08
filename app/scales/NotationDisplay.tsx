'use client';
import { memo, useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { ScaleInfo } from './scaleUtils';
import { generateScaleMusicXML } from './scaleXmlBuilder';
import styles from './scales.module.css';

interface NotationDisplayProps {
  scale: ScaleInfo;
  useColors?: boolean;
  currentNote?: number; // MIDI note number, optional
}

// MusicXML generation moved to xmlbuilder2 helper in ./scaleXmlBuilder

/**
 * Pure notation display component - handles only OSMD rendering
 * Completely isolated from parent re-renders and playback state
 * Re-renders only when scale or useColors change
 */
function NotationDisplay({ 
  scale, 
  useColors = false,
  currentNote
}: NotationDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  // Calculate current note index from MIDI note number
  // Since we display 2 octaves (octave 4 and 5), we need to determine which octave the current note is in
  const currentNoteIndex = currentNote !== undefined
    ? (() => {
        const noteWithoutOctave = scale.notes.find(note => {
          const n = note.replace(/[0-9]/g, '');
          const midiNote = currentNote % 12;
          const noteMap: Record<string, number> = {
            'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
          };
          
          let noteValue = noteMap[n[0]] || 0;
          if (n.includes('#')) noteValue += 1;
          if (n.includes('b')) noteValue -= 1;
          
          return noteValue === midiNote;
        });
        
        if (!noteWithoutOctave) return undefined;
        
        const baseIndex = scale.notes.indexOf(noteWithoutOctave);
        if (baseIndex === -1) return undefined;
        
        // Determine which octave: MIDI notes 60-71 are octave 5 (C4-B4), 72-83 are octave 6 (C5-B5)
        // In our notation, octave 4 is indices 0 to scale.notes.length-1
        // and octave 5 is indices scale.notes.length to 2*scale.notes.length-1
        if (currentNote >= 60 && currentNote <= 71) {
          // First octave (octave 4: C4-B4)
          return baseIndex;
        } else if (currentNote >= 72 && currentNote <= 83) {
          // Second octave (octave 5: C5-B5)
          return baseIndex + scale.notes.length;
        }
        
        return undefined;
      })()
    : undefined;

  // Load and render notation whenever scale or useColors change
  useEffect(() => {
    if (!containerRef.current || scale.empty) return;

    const container = containerRef.current;

    const loadNotation = () => {
      if (osmdRef.current) {
        try {
          osmdRef.current.clear();
        } catch {
          // Ignore
        }
        osmdRef.current = null;
      }

      const osmd = new OpenSheetMusicDisplay(container, {
        drawTitle: false,
        followCursor: false,
        autoResize: true,
        drawMeasureNumbers: false,
        backend: 'svg',
        drawingParameters: 'compacttight',
        drawPartNames: false,
        drawPartAbbreviations: false,
        drawCredits: false,
      });

      osmdRef.current = osmd;
      const musicXML = generateScaleMusicXML({
        scaleName: scale.name,
        notes: scale.notes,
        useColors,
      });

      if (musicXML) {
        osmd.load(musicXML)
          .then(() => {
            if (osmdRef.current === osmd && container.isConnected) {
              osmd.setLogLevel('error');
              osmd.zoom = 1.0;
              osmd.render();

              const svg = container.querySelector('svg');
              if (svg) {
                svg.style.maxWidth = '100%';
                svg.style.height = 'auto';
              }
            }
          })
          .catch(() => {
          });
      }
    };

    loadNotation();

    // No cleanup needed
  }, [scale, useColors]);

  // Update note opacity based on currentNoteIndex
  // Uses OSMD cursors to highlight the current playing note
  useEffect(() => {
    if (!osmdRef.current || !containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const osmd = osmdRef.current as any;

      // New approach: operate on entire note (stavenote) groups instead of individual paths.
      // This prevents staff lines / barlines from being unintentionally faded.
      let noteGroups = Array.from(svg.querySelectorAll('g.vf-stavenote')) as SVGGElement[];

      // Fallback: if class names differ (in case OSMD/VexFlow version changes), derive groups
      // from colored noteheads (those with a non-black fill) and use their closest <g> ancestor.
      if (noteGroups.length === 0) {
        const coloredHeads = Array.from(svg.querySelectorAll('path'))
          .filter(p => {
            const fill = p.getAttribute('fill');
            return fill && fill.startsWith('#') && fill !== '#000000';
          });
        const fromHeads = coloredHeads
          .map(h => h.closest('g'))
          .filter((g): g is SVGGElement => !!g);
        // De-duplicate while preserving order
        const seen = new Set<SVGGElement>();
        for (const g of fromHeads) {
          if (!seen.has(g)) seen.add(g);
        }
        noteGroups = Array.from(seen);
      }

      if (currentNoteIndex !== undefined && currentNoteIndex >= 0) {
        // Show cursor if available (optional visual aid)
        try {
          if (osmd.cursors && osmd.cursors.length > 0) {
            osmd.cursors[0].show();
          }
        } catch {
          // Ignore cursor errors
        }

        // Fade all groups except the current one
        noteGroups.forEach((g, i) => {
          g.style.opacity = i === currentNoteIndex ? '1' : '0.2';
        });
      } else {
        // Not playing: ensure everything fully visible and hide cursor
        try {
          if (osmd.cursors && osmd.cursors.length > 0) {
            osmd.cursors[0].hide();
          }
        } catch {
          // Ignore
        }
        noteGroups.forEach(g => {
          g.style.opacity = '1';
        });
      }
    } catch {
      // Silently handle errors
    }
  }, [currentNoteIndex]);

  if (scale.empty) {
    return null;
  }

  return (
    <div className={styles.notationContainer}>
      <div ref={containerRef} />
    </div>
  );
}

export default memo(NotationDisplay);
