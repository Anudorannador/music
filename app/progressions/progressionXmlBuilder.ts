// MusicXML builder for chord progressions using xmlbuilder2
import { create } from 'xmlbuilder2';
import { ChordInProgression, chordSymbolToNotes } from './progressionUtils';

/**
 * Generate MusicXML for a chord progression
 */
export function generateProgressionMusicXML(
  progressionName: string,
  chords: ChordInProgression[],
  key: string,
  tempo: number = 120
): string {
  // Calculate key signature (fifths)
  const keySignatures: { [key: string]: number } = {
    'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6,
    'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7,
    'C#': 7, 'D#': 3, 'G#': 5, 'A#': 6
  };
  const fifths = keySignatures[key] || 0;

  // Create root XML document
  const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
    .dtd({
      pubID: '-//Recordare//DTD MusicXML 4.0 Partwise//EN',
      sysID: 'http://www.musicxml.org/dtds/partwise.dtd'
    })
    .ele('score-partwise', { version: '4.0' });

  // Add work title
  doc.ele('work')
    .ele('work-title').txt(progressionName).up()
    .up();

  // Add identification
  doc.ele('identification')
    .ele('encoding')
    .ele('software').txt('Music Theory App').up()
    .ele('encoding-date').txt(new Date().toISOString().split('T')[0]).up()
    .up()
    .up();

  // Add part list
  doc.ele('part-list')
    .ele('score-part', { id: 'P1' })
    .ele('part-name').txt('Piano').up()
    .up()
    .up();

  // Add part with measures
  const part = doc.ele('part', { id: 'P1' });

  chords.forEach((chord, index) => {
    const measureNumber = index + 1;
    const measure = part.ele('measure', { number: measureNumber.toString() });

    // Add attributes for first measure
    if (index === 0) {
      const attributes = measure.ele('attributes');
      attributes.ele('divisions').txt('1').up();
      attributes.ele('key').ele('fifths').txt(fifths.toString()).up().up();
      attributes.ele('time')
        .ele('beats').txt('4').up()
        .ele('beat-type').txt('4').up()
        .up();
      attributes.ele('staves').txt('2').up();
      attributes.ele('clef', { number: '1' })
        .ele('sign').txt('G').up()
        .ele('line').txt('2').up()
        .up();
      attributes.ele('clef', { number: '2' })
        .ele('sign').txt('F').up()
        .ele('line').txt('4').up()
        .up();

      // Add tempo marking
      const direction = measure.ele('direction', { placement: 'above' });
      direction.ele('direction-type')
        .ele('metronome', { 'parentheses': 'no' })
        .ele('beat-unit').txt('quarter').up()
        .ele('per-minute').txt(tempo.toString()).up()
        .up()
        .up();
      direction.ele('sound', { tempo: tempo.toString() }).up();
    }

    // Add harmony (chord symbol)
    const harmony = measure.ele('harmony', { 'print-frame': 'no' });
    harmony.ele('root')
      .ele('root-step').txt(chord.root.charAt(0)).up();

    if (chord.root.includes('#')) {
      harmony.ele('root').ele('root-alter').txt('1').up().up();
    } else if (chord.root.includes('b')) {
      harmony.ele('root').ele('root-alter').txt('-1').up().up();
    }

    // Add kind based on quality
    let kind = 'major';
    if (chord.chordSymbol.includes('m7')) {
      kind = 'minor-seventh';
    } else if (chord.chordSymbol.includes('maj7')) {
      kind = 'major-seventh';
    } else if (chord.chordSymbol.includes('7')) {
      kind = 'dominant';
    } else if (chord.chordSymbol.includes('m')) {
      kind = 'minor';
    } else if (chord.chordSymbol.includes('dim')) {
      kind = 'diminished';
    } else if (chord.chordSymbol.includes('aug')) {
      kind = 'augmented';
    } else if (chord.chordSymbol.includes('ø7')) {
      kind = 'half-diminished';
    }

    harmony.ele('kind').txt(kind).up();

    // Get notes for this chord
    const notes = chordSymbolToNotes(chord.chordSymbol, 4);

    // Add notes as a chord
    notes.forEach((noteInfo, noteIndex) => {
      const note = measure.ele('note');

      // Add chord tag for all notes except the first
      if (noteIndex > 0) {
        note.ele('chord').up();
      }

      // Add pitch
      const pitch = note.ele('pitch');
      pitch.ele('step').txt(noteInfo.note.charAt(0)).up();

      if (noteInfo.note.includes('#')) {
        pitch.ele('alter').txt('1').up();
      } else if (noteInfo.note.includes('b')) {
        pitch.ele('alter').txt('-1').up();
      }

      pitch.ele('octave').txt(noteInfo.octave.toString()).up();
      pitch.up(); // close pitch

      // Duration (whole note = 4 quarter notes)
      note.ele('duration').txt('4').up();
      note.ele('type').txt('whole').up();

      // Determine staff based on octave
      const staff = noteInfo.octave < 4 ? '2' : '1';
      note.ele('staff').txt(staff).up();
    });
  });

  // Convert to string
  return doc.end({ prettyPrint: true });
}

/**
 * Generate MIDI-like timing data for playback
 */
export interface ProgressionTiming {
  chordIndex: number;
  startTime: number; // in seconds
  duration: number; // in seconds
  chord: ChordInProgression;
}

export function generateProgressionTiming(
  chords: ChordInProgression[],
  tempo: number = 120,
  beatsPerChord: number = 4
): ProgressionTiming[] {
  const secondsPerBeat = 60 / tempo;
  const chordDuration = secondsPerBeat * beatsPerChord;

  return chords.map((chord, index) => ({
    chordIndex: index,
    startTime: index * chordDuration,
    duration: chordDuration,
    chord
  }));
}
