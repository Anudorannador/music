'use client';
import { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { DurationValue, TimeSignature } from 'tonal';
import { create } from 'xmlbuilder2';
import styles from './rhythm.module.css';

/**
 * Rhythm Pattern Generator
 * 
 * This module uses Tonal library for music theory utilities:
 * - DurationValue: Standardizes note duration representation (quarter, eighth, etc.)
 * - TimeSignature: Validates and analyzes time signatures (simple, compound, irregular)
 * 
 * Duration system: Uses sixteenth notes as the base unit (4 = one sixteenth)
 * - 4 units = sixteenth note (semiquaver)
 * - 8 units = eighth note (quaver)
 * - 12 units = dotted eighth
 * - 16 units = quarter note (crotchet)
 * - 24 units = dotted quarter
 */

// Audio context for playing rhythmic sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  return audioContext as AudioContext;
}

export type Instrument = 'drums' | 'piano' | 'strings';

// Duration mapping using standard note values
// Maps our internal duration units (sixteenth note = 4) to Tonal duration names
const DURATION_MAP = {
  4: 's',    // sixteenth (semiquaver)
  8: 'e',    // eighth (quaver)
  12: 'e.',  // dotted eighth
  16: 'q',   // quarter (crotchet)
  24: 'q.',  // dotted quarter
} as const;

// Helper to get duration value from Tonal
function getDurationInfo(duration: number) {
  const tonalName = DURATION_MAP[duration as keyof typeof DURATION_MAP];
  if (!tonalName) {
    throw new Error(`Unsupported duration: ${duration}`);
  }
  return DurationValue.get(tonalName);
}

// Helper to validate time signature
function getTimeSignatureInfo(beats: number, beatType: number) {
  const tsInfo = TimeSignature.get([beats, beatType]);
  return tsInfo;
}

// Play a percussion click sound with different instrument timbres
function playClick(time: number = 0, instrument: Instrument = 'drums') {
  try {
    const ctx = getAudioContext();
    
    // Configure sound based on instrument
    switch (instrument) {
      case 'drums':
      // Sharp percussive click
      const drumOsc = ctx.createOscillator();
      const drumGain = ctx.createGain();
      drumOsc.type = 'sine';
      drumOsc.frequency.setValueAtTime(800, ctx.currentTime + time);
      drumOsc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + time + 0.01);
      drumGain.gain.setValueAtTime(0.3, ctx.currentTime + time);
      drumGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.1);
      drumOsc.connect(drumGain);
      drumGain.connect(ctx.destination);
      drumOsc.start(ctx.currentTime + time);
      drumOsc.stop(ctx.currentTime + time + 0.1);
      break;
    
    case 'piano':
      // Piano-like tone with quick decay
      const pianoOsc = ctx.createOscillator();
      const pianoGain = ctx.createGain();
      pianoOsc.type = 'triangle';
      pianoOsc.frequency.setValueAtTime(440, ctx.currentTime + time); // A4
      pianoGain.gain.setValueAtTime(0.4, ctx.currentTime + time);
      pianoGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.3);
      pianoOsc.connect(pianoGain);
      pianoGain.connect(ctx.destination);
      pianoOsc.start(ctx.currentTime + time);
      pianoOsc.stop(ctx.currentTime + time + 0.4);
      break;
    
    case 'strings':
      // Violin-like tone with bow attack and vibrato
      const stringGain = ctx.createGain();
      
      // Create multiple oscillators for richer harmonic content
      const fundamental = ctx.createOscillator();
      const harmonic2 = ctx.createOscillator();
      const harmonic3 = ctx.createOscillator();
      
      const baseFreq = 440; // A4
      fundamental.type = 'sawtooth';
      fundamental.frequency.setValueAtTime(baseFreq, ctx.currentTime + time);
      
      harmonic2.type = 'sawtooth';
      harmonic2.frequency.setValueAtTime(baseFreq * 2, ctx.currentTime + time);
      
      harmonic3.type = 'sine';
      harmonic3.frequency.setValueAtTime(baseFreq * 3, ctx.currentTime + time);
      
      // Create vibrato (slight pitch oscillation)
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.type = 'sine';
      vibrato.frequency.setValueAtTime(5, ctx.currentTime + time); // 5Hz vibrato
      vibratoGain.gain.setValueAtTime(8, ctx.currentTime + time); // Subtle pitch variation
      vibrato.connect(vibratoGain);
      vibratoGain.connect(fundamental.frequency);
      
      // Mix oscillators with different gains
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const gain3 = ctx.createGain();
      
      gain1.gain.setValueAtTime(0.3, ctx.currentTime + time);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + time);
      gain3.gain.setValueAtTime(0.08, ctx.currentTime + time);
      
      fundamental.connect(gain1);
      harmonic2.connect(gain2);
      harmonic3.connect(gain3);
      
      gain1.connect(stringGain);
      gain2.connect(stringGain);
      gain3.connect(stringGain);
      
      // Bow attack envelope: slow attack, sustained, gradual decay
      stringGain.gain.setValueAtTime(0.01, ctx.currentTime + time);
      stringGain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + time + 0.05); // Bow attack
      stringGain.gain.setValueAtTime(0.35, ctx.currentTime + time + 0.2); // Sustain
      stringGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.6); // Decay
      
      stringGain.connect(ctx.destination);
      
      vibrato.start(ctx.currentTime + time);
      fundamental.start(ctx.currentTime + time);
      harmonic2.start(ctx.currentTime + time);
      harmonic3.start(ctx.currentTime + time);
      
      vibrato.stop(ctx.currentTime + time + 0.6);
      fundamental.stop(ctx.currentTime + time + 0.6);
      harmonic2.stop(ctx.currentTime + time + 0.6);
      harmonic3.stop(ctx.currentTime + time + 0.6);
      break;
    }
  } catch (err) {
    console.error('Error playing click sound:', err);
  }
}

// Play a rhythm pattern
function playRhythm(pattern: number[], bpm: number = 110, instrument: Instrument = 'drums') {
  getAudioContext(); // Initialize audio context
  // Calculate duration based on BPM (beats per minute)
  // At 110 BPM, a quarter note = 60/110 seconds
  // A sixteenth note is 1/4 of a quarter note
  const quarterNoteDuration = 60 / bpm;
  const sixteenthDuration = quarterNoteDuration / 4;
  
  let currentTime = 0;
  pattern.forEach((duration) => {
    playClick(currentTime, instrument);
    currentTime += (duration / 16) * sixteenthDuration * 4; // Convert to seconds
  });
}

// Simple patterns (2/4, 3/4, 4/4) - 8 patterns in 1/4 time (sorted easy to hard)
const simplePatterns: number[][] = [
  [16],            // ① quarter note (easiest)
  [8,8],           // ② two eighths
  [4,4,4,4],       // ③ four sixteenths
  [8,4,4],         // ④ eighth + two sixteenths
  [4,4,8],         // ⑤ two sixteenths + eighth
  [12,4],          // ⑥ dotted eighth + sixteenth
  [4,12],          // ⑦ sixteenth + dotted eighth
  [4,8,4],         // ⑧ sixteenth + eighth + sixteenth (syncopated)
];

// Compound patterns (6/8, 9/8, 12/8) - patterns in 3/8 time (dotted quarter beat)
// Sorted from easy to hard based on rhythmic complexity
const compoundPatterns: number[][] = [
  [24],                   // ⑨ dotted quarter (easiest compound)
  [8,8,8],                // ⑩ three eighths
  [12,12],                // ⑪ two dotted eighths
  [16,8],                 // ⑫ quarter + eighth
  [8,16],                 // ⑬ eighth + quarter
  [12,4,8],               // ⑭ dotted eighth + sixteenth + eighth
  [12,8,4],               // ⑮ dotted eighth + eighth + sixteenth
  [8,12,4],               // ⑯ eighth + dotted eighth + sixteenth
  [8,4,12],               // ⑰ eighth + sixteenth + dotted eighth
  [4,12,8],               // ⑱ sixteenth + dotted eighth + eighth
  [4,8,12],               // ⑲ sixteenth + eighth + dotted eighth
  [12,4,4,4],             // ⑳ dotted eighth + three sixteenths
  [4,4,4,12],             // ㉑ three sixteenths + dotted eighth
  [4,12,4,4],             // ㉒ sixteenth + dotted eighth + two sixteenths
  [4,4,12,4],             // ㉓ two sixteenths + dotted eighth + sixteenth
  [8,4,4,8],              // ㉔ eighth + two sixteenths + eighth
  [4,4,8,8],              // ㉕ two sixteenths + two eighths
  [8,8,4,4],              // ㉖ two eighths + two sixteenths
  [4,8,8,4],              // ㉗ sixteenth + two eighths + sixteenth
  [8,4,8,4],              // ㉘ eighth + sixteenth + eighth + sixteenth
  [4,8,4,8],              // ㉙ sixteenth + eighth + sixteenth + eighth
  [4,4,16],               // ㉚ two sixteenths + quarter
  [16,4,4],               // ㉛ quarter + two sixteenths
  [4,16,4],               // ㉜ sixteenth + quarter + sixteenth
  [12,8,8],               // ㉝ dotted eighth + two eighths
  [8,12,8],               // ㉞ eighth + dotted eighth + eighth
  [8,8,12],               // ㉟ two eighths + dotted eighth
  [4,4,8,4,4],            // ㊱ two sixteenths + eighth + two sixteenths
  [8,4,4,4,4],            // ㊲ eighth + four sixteenths
  [4,4,4,4,8],            // ㊳ four sixteenths + eighth
  [4,8,4,4,4],            // ㊴ sixteenth + eighth + three sixteenths
  [4,4,4,8,4],            // ㊵ three sixteenths + eighth + sixteenth
  [12,4,4,8],             // ㊶ dotted eighth + two sixteenths + eighth
  [8,12,4,4],             // ㊷ eighth + dotted eighth + two sixteenths
  [8,4,4,12],             // ㊸ eighth + two sixteenths + dotted eighth
  [4,12,4,8],             // ㊹ sixteenth + dotted eighth + sixteenth + eighth
  [8,4,12,4],             // ㊺ eighth + sixteenth + dotted eighth + sixteenth
  [4,8,12,4],             // ㊻ sixteenth + eighth + dotted eighth + sixteenth
  [4,4,12,4,4],           // ㊼ two sixteenths + dotted eighth + two sixteenths
  [12,4,8,4],             // ㊽ dotted eighth + sixteenth + eighth + sixteenth
  [4,12,8,4],             // ㊾ sixteenth + dotted eighth + eighth + sixteenth
  [4,8,4,12],             // ㊿ sixteenth + eighth + sixteenth + dotted eighth
  [12,4,4,4,4],           // 51 dotted eighth + four sixteenths
  [4,4,4,4,12],           // 52 four sixteenths + dotted eighth
  [4,12,4,4,4],           // 53 sixteenth + dotted eighth + three sixteenths
  [4,4,12,4,4,4],         // 54 two sixteenths + dotted eighth + three sixteenths
  [4,4,4,12,4,4],         // 55 three sixteenths + dotted eighth + two sixteenths
  [4,4,4,4,12,4],         // 56 four sixteenths + dotted eighth + sixteenth
  [8,4,8,8],              // 57 eighth + sixteenth + two eighths
  [8,8,4,8],              // 58 two eighths + sixteenth + eighth
  [8,8,8,4],              // 59 three eighths + sixteenth (irregular but valid)
  [4,8,8,8],              // 60 sixteenth + three eighths (irregular but valid)
  [4,8,4,4,4,4],          // 61 sixteenth + eighth + four sixteenths
  [4,4,4,4,8,4],          // 62 four sixteenths + eighth + sixteenth
  [4,4,8,4,4,4],          // 63 two sixteenths + eighth + three sixteenths
  [4,4,4,8,4,4],          // 64 three sixteenths + eighth + two sixteenths
  [8,4,4,8,4],            // 65 eighth + two sixteenths + eighth + sixteenth
  [4,8,4,8,4],            // 66 sixteenth + eighth + sixteenth + eighth + sixteenth
  [8,4,4,4,4,4],          // 67 eighth + five sixteenths
  [4,4,4,4,4,8],          // 68 five sixteenths + eighth
  [4,8,4,4,4,4,4],        // 69 sixteenth + eighth + five sixteenths
  [4,4,4,4,4,4],          // 70 six sixteenths (most complex)
];

function durationToType(duration: number) {
  // Get duration info from Tonal
  const durationInfo = getDurationInfo(duration);
  
  // Map Tonal shorthand to MusicXML note types
  const typeMap: Record<string, string> = {
    's': '16th',      // sixteenth
    'e': 'eighth',    // eighth
    'q': 'quarter',   // quarter
    'h': 'half',      // half
    'w': 'whole',     // whole
  };
  
  const baseType = typeMap[durationInfo.shorthand] || 'quarter';
  const dots = durationInfo.dots.length;
  
  return { type: baseType, dots };
}

function buildSinglePatternMusicXML(pattern: number[], timeBeats: number, beatType: number): string {
  const divisions = 16;
  const needBeam = pattern.some(d => d < 16);
  
  // Validate time signature using Tonal
  // This helps identify if it's simple, compound, irregular, etc.
  const tsInfo = getTimeSignatureInfo(timeBeats, beatType);
  // Future enhancement: use tsInfo.type to adjust rendering or validation
  // tsInfo.type can be: 'simple', 'compound', 'regular', 'irregular', 'irrational'
  
  const totalDuration = pattern.reduce((sum, dur) => sum + dur, 0);
  const beatsInMeasure = Math.ceil(totalDuration / divisions);

  // Log time signature info for debugging (can be removed in production)
  if (tsInfo && !tsInfo.empty) {
    console.debug(`Time signature ${tsInfo.name} is ${tsInfo.type}`);
  }

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
    .ele('part-name').txt('Rhythm').up()
    .up()
    .up()
    .ele('part', { id: 'P1' })
    .ele('measure', { number: '1' })
    .ele('print')
    .ele('measure-layout')
    .ele('measure-distance').txt('200').up()
    .up()
    .up()
    .ele('attributes')
    .ele('divisions').txt(String(divisions)).up()
    .ele('time', { 'print-object': 'no' })
    .ele('beats').txt(String(beatsInMeasure)).up()
    .ele('beat-type').txt(String(beatType)).up()
    .up()
    .ele('clef', { 'print-object': 'no' })
    .ele('sign').txt('G').up()
    .ele('line').txt('2').up()
    .up()
    .up();

  // Add notes
  let currentMeasure = doc;
  
  pattern.forEach((dur, idx) => {
    const { type, dots } = durationToType(dur);
    
    // Create note element
    let noteEle = currentMeasure.ele('note');
    
    // Add pitch
    noteEle = noteEle.ele('pitch')
      .ele('step').txt('C').up()
      .ele('octave').txt('4').up()
      .up();
    
    // Add duration and type
    noteEle = noteEle.ele('duration').txt(String(dur)).up()
      .ele('type').txt(type).up();
    
    // Add dots if present
    for (let i = 0; i < dots; i++) {
      noteEle = noteEle.ele('dot').up();
    }
    
    // Add beam if needed
    if (dur < 16 && needBeam) {
      const beamValue = idx === 0 ? 'begin' : (idx === pattern.length - 1 ? 'end' : 'continue');
      noteEle = noteEle.ele('beam', { number: '1' }).txt(beamValue).up();
    }
    
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

interface PatternDisplayProps {
  pattern: number[];
  /** zero-based index local to its list (simple or compound) */
  index: number;
  /** absolute display index across all patterns so numbering does not restart */
  displayIndex: number;
  timeBeats: number;
  beatType: number;
  tempo: number;
  instrument: Instrument;
}

function PatternDisplay({ pattern, index, displayIndex, timeBeats, beatType, tempo, instrument }: PatternDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      drawTitle: false,
      followCursor: false,
      autoResize: false,
      drawMeasureNumbers: false,
      backend: 'svg',
      drawingParameters: 'compacttight',
      drawPartNames: false,
      drawPartAbbreviations: false,
      drawCredits: false,
    });

    osmd.load(buildSinglePatternMusicXML(pattern, timeBeats, beatType))
      .then(() => {
        osmd.setLogLevel('error');
        
        // Render with zoom that fits the content
        osmd.zoom = 1.2;
        osmd.render();
        
        // Force hide clef by manipulating SVG after render
        if (containerRef.current) {
          const clefElements = containerRef.current.querySelectorAll('[class*="clef"]');
          clefElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
          
          // Ensure SVG fits within container
          const svg = containerRef.current.querySelector('svg');
          if (svg) {
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
          }
        }
      })
      .catch((err) => {
        console.error(`Failed to render pattern ${index + 1}:`, err);
        setError('Failed to render');
      });
  }, [pattern, index, timeBeats, beatType]);

  const handleClick = () => {
    playRhythm(pattern, tempo, instrument);
  };

  const getCircledNumber = (num: number): string => {
    const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', 
                           '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
                           '㉑', '㉒', '㉓', '㉔', '㉕', '㉖', '㉗', '㉘', '㉙', '㉚',
                           '㉛', '㉜', '㉝', '㉞', '㉟', '㊱', '㊲', '㊳', '㊴', '㊵',
                           '㊶', '㊷', '㊸', '㊹', '㊺', '㊻', '㊼', '㊽', '㊾', '㊿'];
    // For numbers beyond 50, use plain numbers
    return circledNumbers[num] || `${num + 1}`;
  };

  return (
    <div
      className={styles.patternCard}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Rhythm pattern ${displayIndex + 1} - click to play`}
    >
      <div className={styles.patternNumber}>{getCircledNumber(displayIndex)}</div>
      {error ? (
        <div className={styles.patternError}>{error}</div>
      ) : (
        <div ref={containerRef} className={styles.patternNotation} />
      )}
    </div>
  );
}

interface RhythmPatternsProps {
  tempo: number;
  instrument: Instrument;
}

export default function RhythmPatterns({ tempo, instrument }: RhythmPatternsProps) {
  const [simpleLoading, setSimpleLoading] = useState(true);
  const [compoundLoading, setCompoundLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for smoother rendering
    setTimeout(() => setSimpleLoading(false), 100);
    setTimeout(() => setCompoundLoading(false), 100);
  }, []);

  return (
    <div className={styles.container}>
      {/* Simple Patterns Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Simple Rhythms (8 patterns)</h2>
        <p className={styles.sectionDescription}>
          Common rhythm patterns in simple time (2/4, 3/4, 4/4). Each pattern represents one beat. Click any pattern to hear the rhythm.
        </p>
        {simpleLoading && <div className={styles.loading}>Loading notation...</div>}
        <div className={styles.patternsGrid}>
          {simplePatterns.map((pattern, index) => (
            <PatternDisplay
              key={`simple-${index}`}
              pattern={pattern}
              index={index}
              displayIndex={index}
              timeBeats={1}
              beatType={4}
              tempo={tempo}
              instrument={instrument}
            />
          ))}
        </div>
      </section>

      {/* Compound Patterns Section */}
      <section className={styles.section}>
  <h2 className={styles.sectionTitle}>Compound Rhythms (62 patterns)</h2>
        <p className={styles.sectionDescription}>
          Advanced rhythm patterns in compound time (6/8, 9/8, 12/8). Each pattern represents a dotted quarter beat. Click any pattern to hear the rhythm.
        </p>
        {compoundLoading && <div className={styles.loading}>Loading notation...</div>}
        <div className={styles.patternsGrid}>
          {compoundPatterns.map((pattern, index) => (
            <PatternDisplay
              key={`compound-${index}`}
              pattern={pattern}
              index={index}
              displayIndex={index + simplePatterns.length} // continue numbering from 9
              timeBeats={3}
              beatType={8}
              tempo={tempo}
              instrument={instrument}
            />
          ))}
        </div>
      </section>
    </div>
  );
}