// Utility functions for chord handling
import { Chord as TonalChord, ChordType } from 'tonal';
import { create } from 'xmlbuilder2';

// Add type declaration for WebKit audio context
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// Define chord type for our application
export interface Chord {
  name: string;
  abbreviation: string;
  notes: { note: string; octave: number }[];
  keySignature?: number; // Number of sharps (positive) or flats (negative)
}

// Create audio context
export function createAudioContext(): AudioContext {
  return new (window.AudioContext || window.webkitAudioContext)();
}

// Generate all common chords using Tonal library
export function generateChords(): Chord[] {
  // Define all root notes
  const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Get common chord types - Tonal uses specific notation
  const chordTypeAliases = [
    '', 'm', 'dim', 'aug',
    'maj7', 'm7', '7', 'mMaj7',
    'm7b5', 'dim7', 'aug7',
    'sus2', 'sus4',
    '6', 'm6',
    '9', 'maj9', 'm9'
  ];

  // Map of key signatures (number of sharps/flats)
  const keySignatures: { [key: string]: number } = {
    'C': 0,
    'G': 1, 'F': -1,
    'D': 2, 'Bb': -2,
    'A': 3, 'Eb': -3,
    'E': 4, 'Ab': -4,
    'B': 5, 'Db': -5,
    'F#': 6, 'Gb': -6,
    'C#': 7, 'Cb': -7,
    // Enharmonic equivalents
    'D#': 3,
    'G#': 5,
    'A#': 6
  };

  // Generate all chords using Tonal
  const chords: Chord[] = rootNotes.flatMap(root =>
    chordTypeAliases.map(chordType => {
      // Create chord using Tonal - format is "root + chordType"
      const chordSymbol = `${root}${chordType}`;
      const tonalChord = TonalChord.get(chordSymbol);

      if (!tonalChord.notes || tonalChord.notes.length === 0) {
        return null;
      }

      // Shared note conversion constants
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const naturalSemitones = [0, 2, 4, 5, 7, 9, 11];

      // Convert any note (with any accidentals) to semitone index
      const noteToSemitone = (n: string): number => {
        const baseNote = n[0];
        const accidentals = n.slice(1);
        const sharpCount = (accidentals.match(/#/g) || []).length;
        const flatCount = (accidentals.match(/b/g) || []).length;

        if (!sharpCount && !flatCount) {
          return noteNames.indexOf(n);
        }

        const baseIndex = naturalNotes.indexOf(baseNote);
        if (baseIndex === -1) return -1;

        const semitone = naturalSemitones[baseIndex] + sharpCount - flatCount;
        return ((semitone % 12) + 12) % 12;
      };

      // Add octave information to notes (default to octave 4)
      const parsedNotes = tonalChord.notes.map(note => {
        const rootIndex = noteToSemitone(root);
        const currentIndex = noteToSemitone(note);

        // If the note is lower than root, it's in the next octave
        const octave = currentIndex < rootIndex ? 5 : 4;

        // Normalize to standard sharp notation
        const normalizedNote = noteNames[currentIndex];

        return { note: normalizedNote, octave };
      });

      // Get chord type info for display name
      const chordTypeInfo = ChordType.get(tonalChord.type || chordType);

      const chord: Chord = {
        name: `${root} ${chordTypeInfo.name || tonalChord.type || 'Major'}`,
        abbreviation: tonalChord.symbol || chordSymbol,
        notes: parsedNotes,
        keySignature: keySignatures[root] || 0
      };

      return chord;
    }).filter((chord): chord is Chord => chord !== null)
  );

  return chords;
}

// Convert note to frequency
export function noteToFrequency(note: string, octave: number): number {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteIndex = notes.indexOf(note);
  const octaveOffset = octave - 4; // A4 is 440Hz

  // Calculate frequency using the formula: f = 440 × 2^(n/12)
  // where n is the number of semitones from A4
  const semitoneOffset = noteIndex - notes.indexOf('A') + (octaveOffset * 12);
  return 440 * Math.pow(2, semitoneOffset / 12);
}

// Generate MusicXML for a chord in either arpeggio or block format
export function generateChordMusicXML(
  chord: {
    name: string;
    abbreviation: string;
    notes: { note: string; octave: number }[];
    keySignature?: number;
  },
  format: 'arpeggio' | 'block',
  noteColors?: string[] // Add optional note colors parameter
): string {
  const notes = chord.notes;
  const keySignature = chord.keySignature || 0;

  // Pitch helpers
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
  const pcIndex = (n: string) => NOTE_NAMES.indexOf(n as (typeof NOTE_NAMES)[number]);
  const toMidi = (n: string, octave: number) => (octave + 1) * 12 + pcIndex(n);

  // Keep input order (root first), but compute close-position octaves relative to root
  const voiceClosePosition = (ns: { note: string; octave: number }[], targetOctave = 4) => {
    if (ns.length === 0) return ns;
    const rootPc = pcIndex(ns[0].note);
    return ns.map((n, i) => {
      if (i === 0) return { note: n.note, octave: targetOctave };
      const thisPc = pcIndex(n.note);
      // If pitch class is below root within the C-based index, bump octave to keep ascending from root
      const oct = thisPc < rootPc ? targetOctave + 1 : targetOctave;
      return { note: n.note, octave: oct };
    });
  };

  // Ensure strictly ascending sequence by raising octaves as needed
  const voiceMonotonicUp = (ns: { note: string; octave: number }[], startOctave = 4) => {
    const base = voiceClosePosition(ns, startOctave);
    if (base.length === 0) return base;
    let prevMidi = toMidi(base[0].note, base[0].octave);
    const out = [base[0]] as { note: string; octave: number }[];
    for (let i = 1; i < base.length; i++) {
      let oct = base[i].octave;
      let m = toMidi(base[i].note, oct);
      while (m <= prevMidi) {
        oct += 1;
        m = toMidi(base[i].note, oct);
      }
      out.push({ note: base[i].note, octave: oct });
      prevMidi = m;
    }
    return out;
  };

  // Helper function to add a note element using xmlbuilder2
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addNoteElement = (parent: any, note: { note: string; octave: number }, duration: number, isChord = false, index: number = 0) => {
    const baseNote = note.note.charAt(0);
    const isSharp = note.note.includes('#');
    const isFlat = note.note.includes('b');
    const alter = isSharp ? '1' : (isFlat ? '-1' : '0');
    const staffNumber = note.octave < 4 ? '2' : '1'; // Below middle C goes on bass clef

    // Get color for this note
    const noteColor = noteColors && noteColors[index] ? noteColors[index] : undefined;

    // Create note element with attributes
    const noteAttrs: Record<string, string> = {};
    if (isChord) noteAttrs['print-object'] = 'yes';
    if (noteColor) noteAttrs.color = noteColor;

    let noteEle = parent.ele('note', noteAttrs);

    // Add chord element if needed
    if (isChord) {
      noteEle = noteEle.ele('chord').up();
    }

    // Add pitch
    noteEle = noteEle.ele('pitch')
      .ele('step').txt(baseNote).up();
    if (isSharp || isFlat) {
      noteEle = noteEle.ele('alter').txt(alter).up();
    }
    noteEle = noteEle.ele('octave').txt(String(note.octave)).up().up();

    // Add duration
    noteEle = noteEle.ele('duration').txt(String(duration)).up();

    // Add type
    if (noteColor) {
      noteEle = noteEle.ele('type', { color: noteColor }).txt('quarter').up();
    } else {
      noteEle = noteEle.ele('type').txt('quarter').up();
    }

    // Add accidental if needed
    if (isSharp || isFlat) {
      const accidentalValue = isSharp ? 'sharp' : 'flat';
      if (noteColor) {
        noteEle = noteEle.ele('accidental', { color: noteColor }).txt(accidentalValue).up();
      } else {
        noteEle = noteEle.ele('accidental').txt(accidentalValue).up();
      }
    }

    // Add staff
    noteEle = noteEle.ele('staff').txt(staffNumber).up();

    // Add notehead and stem if color is present
    if (noteColor) {
      noteEle = noteEle.ele('notehead', { color: noteColor }).txt('normal').up();
      noteEle = noteEle.ele('stem', { color: noteColor }).txt('up').up();
    }

    return noteEle.up();
  };

  // Build the MusicXML document
  const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: false })
    .dtd({
      pubID: '-//Recordare//DTD MusicXML 4.0 Partwise//EN',
      sysID: 'http://www.musicxml.org/dtds/partwise.dtd'
    })
    .ele('score-partwise', { version: '4.0' })
    .ele('part-list')
    .ele('score-part', { id: 'P1' })
    .ele('part-name').txt(chord.name).up()
    .up()
    .up()
    .ele('part', { id: 'P1' })
    .ele('measure', { number: '1' })
    .ele('attributes')
    .ele('divisions').txt('1').up()
    .ele('key')
    .ele('fifths').txt(String(keySignature)).up()
    .up()
    .ele('time')
    .ele('beats').txt(String(format === 'arpeggio' ? notes.length : 4)).up()
    .ele('beat-type').txt('4').up()
    .up()
    .ele('staves').txt('2').up()
    .ele('clef', { number: '1' })
    .ele('sign').txt('G').up()
    .ele('line').txt('2').up()
    .up()
    .ele('clef', { number: '2' })
    .ele('sign').txt('F').up()
    .ele('line').txt('4').up()
    .up()
    .up();

  // Compute voiced notes per requested format
  const voicedNotes = format === 'arpeggio'
    ? voiceMonotonicUp(notes, 4)
    : voiceClosePosition(notes, 4);

  // Add notes
  let currentMeasure = doc;

  if (format === 'arpeggio') {
    voicedNotes.forEach((note, index) => {
      currentMeasure = addNoteElement(currentMeasure, note, 1, false, index);
    });
  } else {
    // Block chord: first note then chord-tagged remaining
    currentMeasure = addNoteElement(currentMeasure, voicedNotes[0], 4, false, 0);
    voicedNotes.slice(1).forEach((note, index) => {
      currentMeasure = addNoteElement(currentMeasure, note, 4, true, index + 1);
    });
  }

  // Convert to XML string
  return doc.end({ prettyPrint: true });
}

// Public helpers to align playback with notation
export function voiceChordNotes(
  chord: { notes: { note: string; octave: number }[] },
  format: 'arpeggio' | 'block',
  opts?: { startOctave?: number }
): { note: string; octave: number }[] {
  const startOctave = opts?.startOctave ?? 4;
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
  const pcIndex = (n: string) => NOTE_NAMES.indexOf(n as (typeof NOTE_NAMES)[number]);

  const voiceClose = (ns: { note: string; octave: number }[]) => {
    if (ns.length === 0) return ns;
    const rootPc = pcIndex(ns[0].note);
    return ns.map((n, i) => {
      if (i === 0) return { note: n.note, octave: startOctave };
      const thisPc = pcIndex(n.note);
      const oct = thisPc < rootPc ? startOctave + 1 : startOctave;
      return { note: n.note, octave: oct };
    });
  };

  const toMidi = (n: string, octave: number) => (octave + 1) * 12 + pcIndex(n);

  const voiceMonoUp = (ns: { note: string; octave: number }[]) => {
    const base = voiceClose(ns);
    if (base.length === 0) return base;
    let prev = toMidi(base[0].note, base[0].octave);
    const out = [base[0]] as { note: string; octave: number }[];
    for (let i = 1; i < base.length; i++) {
      let oct = base[i].octave;
      let m = toMidi(base[i].note, oct);
      while (m <= prev) { oct += 1; m = toMidi(base[i].note, oct); }
      out.push({ note: base[i].note, octave: oct });
      prev = m;
    }
    return out;
  };

  return format === 'arpeggio' ? voiceMonoUp(chord.notes) : voiceClose(chord.notes);
}

export function getVoicedMidiNotes(
  chord: { notes: { note: string; octave: number }[] },
  format: 'arpeggio' | 'block',
  opts?: { startOctave?: number }
): number[] {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
  const pcIndex = (n: string) => NOTE_NAMES.indexOf(n as (typeof NOTE_NAMES)[number]);
  const toMidi = (n: string, octave: number) => (octave + 1) * 12 + pcIndex(n);
  return voiceChordNotes(chord, format, opts).map(n => toMidi(n.note, n.octave));
}

// Play a chord in arpeggio format (one note at a time)
export function playArpeggioChord(
  audioContext: AudioContext,
  frequencies: number[],
  notes?: { note: string; octave: number }[],
  onFinish?: () => void,
  options?: {
    onIndexStart?: (index: number) => void;
    onIndexEnd?: (index: number) => void;
    noteDurationSec?: number; // default 0.3s per note
  }
) {
  const now = audioContext.currentTime;
  const noteDuration = options?.noteDurationSec ?? 0.3; // Duration per note in seconds

  // Calculate total duration for callback
  const totalDuration = noteDuration * frequencies.length;

  frequencies.map((frequency, index) => {
    const startTime = now + (index * noteDuration);

    if (notes) {
      // Use enhanced grand piano sound
      playGrandPianoSynth(audioContext, notes[index].note, notes[index].octave, noteDuration * 0.9, startTime);
    } else {
      // Fallback if note information isn't available
      playGrandPianoSynth(audioContext, '', 0, noteDuration * 0.9, startTime, frequency);
    }

    // Schedule UI callbacks tied to playback timing
    if (typeof window !== 'undefined') {
      const nowTone = audioContext.currentTime;
      const delayMs = Math.max(0, (startTime - nowTone) * 1000);
      const endDelayMs = Math.max(0, (startTime - nowTone + noteDuration) * 1000);

      if (options?.onIndexStart) {
        window.setTimeout(() => options.onIndexStart!(index), delayMs);
      }
      if (options?.onIndexEnd) {
        window.setTimeout(() => options.onIndexEnd!(index), endDelayMs);
      }
    }

    return startTime;
  });

  // Call onFinish callback when all notes have played
  if (onFinish) {
    setTimeout(() => onFinish(), totalDuration * 1000);
  }
}

// Play a chord in block format (all notes simultaneously)
export function playBlockChord(audioContext: AudioContext, frequencies: number[], notes?: { note: string; octave: number }[], onFinish?: () => void) {
  const now = audioContext.currentTime;

  // Use map with functional approach instead of forEach
  frequencies.map((frequency, index) => {
    if (notes) {
      // Use enhanced grand piano sound
      playGrandPianoSynth(audioContext, notes[index].note, notes[index].octave, 1.5, now);
    } else {
      // Fallback if note information isn't available
      playGrandPianoSynth(audioContext, '', 0, 1.5, now, frequency);
    }
    // Return the frequency to follow map pattern (even though not used)
    return frequency;
  });

  // Call onFinish callback after a fixed duration for block chords
  if (onFinish) {
    setTimeout(() => onFinish(), 1500); // 1.5 seconds matches the duration value above
  }
}

// Synthesize a grand piano sound
function playGrandPianoSynth(
  audioContext: AudioContext,
  noteName: string,
  octave: number,
  duration: number,
  startTime: number,
  frequencyOverride?: number
) {
  // Calculate frequency from note name and octave, or use override
  const frequency = frequencyOverride || noteToFrequency(noteName, octave);

  // Master gain for the entire piano note
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);

  // Create dynamics compressor for a fuller sound
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-24, startTime);
  compressor.knee.setValueAtTime(40, startTime);
  compressor.ratio.setValueAtTime(12, startTime);
  compressor.attack.setValueAtTime(0, startTime);
  compressor.release.setValueAtTime(0.25, startTime);
  compressor.connect(masterGain);

  // Create convolver for reverb effect
  const convolver = audioContext.createConvolver();
  const reverbGain = audioContext.createGain();
  reverbGain.gain.setValueAtTime(0.2, startTime); // Subtle reverb
  convolver.connect(reverbGain);
  reverbGain.connect(masterGain);

  // Generate impulse response for the convolver
  const impulseLength = audioContext.sampleRate * 2.5; // 2.5 seconds reverb
  const impulse = audioContext.createBuffer(2, impulseLength, audioContext.sampleRate);

  // Use map to process channels in a functional programming style
  const channels = Array.from({ length: impulse.numberOfChannels });
  channels.map((_, channel) => {
    const impulseData = impulse.getChannelData(channel);

    // Use map to fill the impulse data in a functional way
    Array.from({ length: impulseLength }).map((_, i) => {
      // Exponential decay
      impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
      return impulseData[i]; // Return value to follow map pattern
    });

    return channel; // Return value to follow map pattern
  });

  convolver.buffer = impulse;

  // Primary oscillator (Hammer strike)
  createPianoOscillator(audioContext, frequency, startTime, duration, compressor, 'triangle', 1.0, 0.8, 1.0);

  // Second oscillator for body resonance
  createPianoOscillator(audioContext, frequency, startTime, duration * 1.2, compressor, 'sine', 0.6, 0.1, 1.0);

  // Third oscillator for harmonics
  createPianoOscillator(audioContext, frequency * 2, startTime, duration * 0.75, compressor, 'sine', 0.3, 0.05, 2.0);

  // Fourth oscillator for bass presence
  createPianoOscillator(audioContext, frequency * 0.5, startTime, duration * 0.5, compressor, 'sine', 0.4, 0.2, 0.5);

  // String resonance
  createPianoOscillator(audioContext, frequency * 1.01, startTime + 0.01, duration, compressor, 'sawtooth', 0.2, 0.05, 0.5);

  // A slight detuned oscillator for richness
  createPianoOscillator(audioContext, frequency * 1.003, startTime, duration * 0.6, compressor, 'triangle', 0.2, 0.05, 1.0);

  // Add some noise for the hammer strike
  const noise = audioContext.createBufferSource();
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);

  // Use functional approach to fill the noise buffer
  Array.from({ length: noiseBuffer.length }).forEach((_, i) => {
    noiseData[i] = Math.random() * 2 - 1;
  });

  noise.buffer = noiseBuffer;

  // Noise envelope
  const noiseGain = audioContext.createGain();
  noiseGain.gain.setValueAtTime(0, startTime);
  noiseGain.gain.linearRampToValueAtTime(0.15, startTime + 0.005);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

  // Noise filter
  const noiseFilter = audioContext.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(frequency * 2, startTime);
  noiseFilter.Q.setValueAtTime(1, startTime);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(compressor);

  noise.start(startTime);
  noise.stop(startTime + 0.1);

  // Master envelope
  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(0.7, startTime + 0.005);
  masterGain.gain.setValueAtTime(0.7, startTime + 0.01);
  masterGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.1);
  masterGain.gain.exponentialRampToValueAtTime(0.1, startTime + 0.3);
  masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
}

// Helper function to create a piano oscillator with specific parameters
function createPianoOscillator(
  audioContext: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  destination: AudioNode,
  type: OscillatorType,
  gainValue: number,
  sustainValue: number,
  filterMultiplier: number
) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Piano-like envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gainValue, startTime + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(sustainValue, startTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  // Filter to shape tone
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(frequency * filterMultiplier, startTime);
  filter.frequency.exponentialRampToValueAtTime(frequency, startTime + duration * 0.75);
  filter.Q.setValueAtTime(2, startTime);
  filter.Q.linearRampToValueAtTime(0.5, startTime + duration);

  // Connect nodes
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);

  // Start and stop
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  return oscillator;
}