'use client';
import { useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { create } from 'xmlbuilder2';
import { getNoteColor } from '@lib/noteColors';
import type { KeyInfo } from './keyUtils';
import styles from './keys.module.css';

interface KeyNotationProps {
  keyInfo: KeyInfo;
  useColors?: boolean; // Optional: enable octave-aware coloring
}

/**
 * Build MusicXML for a key signature with its scale
 */
function buildKeyMusicXML(keyInfo: KeyInfo, useColors?: boolean): string {
  if (keyInfo.scale.length === 0) {
    return '';
  }

  const divisions = 1;
  const octave = 4; // Display in octave 4
  
  // Determine fifths for key signature
  // Positive = sharps, Negative = flats
  const fifths = keyInfo.alteration;
  
  // Mode: major or minor
  const mode = keyInfo.type === 'major' ? 'major' : 'minor';
  
  // Build the MusicXML document
  const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: false })
    .dtd({
      pubID: '-//Recordare//DTD MusicXML 3.1 Partwise//EN',
      sysID: 'http://www.musicxml.org/dtds/partwise.dtd'
    })
    .ele('score-partwise', { version: '3.1' })
    .ele('defaults')
    .ele('scaling')
    .ele('millimeters').txt('7').up()
    .ele('tenths').txt('40').up()
    .up()
    .up()
    .ele('part-list')
    .ele('score-part', { id: 'P1' })
    .ele('part-name').txt(`${keyInfo.tonic} ${keyInfo.type === 'major' ? 'Major' : 'Minor'}`).up()
    .up()
    .up()
    .ele('part', { id: 'P1' })
    .ele('measure', { number: '1' })
    .ele('attributes')
    .ele('divisions').txt(String(divisions)).up()
    .ele('key')
    .ele('fifths').txt(String(fifths)).up()
    .ele('mode').txt(mode).up()
    .up()
    .ele('time')
    .ele('beats').txt(String(keyInfo.scale.length)).up()
    .ele('beat-type').txt('4').up()
    .up()
    .ele('clef')
    .ele('sign').txt('G').up()
    .ele('line').txt('2').up()
    .up()
    .up();

  // Add notes
  let currentMeasure = doc;
  
  keyInfo.scale.forEach((note) => {
    // Remove any octave number from the note
    const cleanNote = note.replace(/\d+/g, '');
    
    // Parse note (e.g., "C#" -> step: C, alter: 1)
    const step = cleanNote[0].toUpperCase();
    const alter = cleanNote.includes('#') ? 1 : cleanNote.includes('b') ? -1 : 0;
    
    // Determine color
    const color = useColors ? getNoteColor(cleanNote, octave) : undefined;

    // Create note element with optional color attribute
    const noteAttrs: Record<string, string> = {};
    if (color) noteAttrs.color = color;
    
    let noteEle = currentMeasure.ele('note', noteAttrs);
    
    // Add pitch
    noteEle = noteEle.ele('pitch')
      .ele('step').txt(step).up();
    if (alter !== 0) {
      noteEle = noteEle.ele('alter').txt(String(alter)).up();
    }
    noteEle = noteEle.ele('octave').txt(String(octave)).up().up();
    
    // Add duration and type
    noteEle = noteEle.ele('duration').txt(String(divisions)).up()
      .ele('type').txt('quarter').up();
    
    currentMeasure = noteEle.up();
  });

  // Add barline
  currentMeasure
    .ele('barline', { location: 'right' })
    .ele('bar-style').txt('light-heavy').up()
    .up();

  // Convert to XML string
  return doc.end({ prettyPrint: true });
}

export default function KeyNotation({ keyInfo, useColors = false }: KeyNotationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous instance
    if (osmdRef.current) {
      try {
        osmdRef.current.clear();
      } catch {
        // Ignore
      }
      osmdRef.current = null;
    }

    const container = containerRef.current;
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
    const musicXML = buildKeyMusicXML(keyInfo, useColors);

    if (musicXML) {
      osmd.load(musicXML)
        .then(() => {
          // Check if component is still mounted and this is still the current instance
          if (osmdRef.current === osmd && container.isConnected) {
            osmd.setLogLevel('error');
            osmd.zoom = 1.0;
            osmd.render();

            // Ensure SVG fits within container
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

    // Cleanup function
    return () => {
      if (osmdRef.current === osmd) {
        try {
          osmd.clear();
        } catch {
          // Ignore cleanup errors
        }
        osmdRef.current = null;
      }
    };
  }, [keyInfo, useColors]);

  return (
    <div className={styles.notationContainer}>
      <div ref={containerRef} />
    </div>
  );
}
