/**
 * Chord MusicXML Builder using xmlbuilder2
 */

import { create } from 'xmlbuilder2';

interface ChordNote {
  note: string;
  octave: number;
}

interface ChordXMLOptions {
  chordName: string;
  notes: ChordNote[];
  format: 'block' | 'arpeggio';
  keySignature: number;
  noteColors?: string[];
}

type NoteObject = Record<string, unknown>;

/**
 * Create a note object for xmlbuilder2
 */
function createNoteObject(
  note: ChordNote,
  duration: number,
  isChord: boolean,
  index: number,
  noteColor?: string
): NoteObject {
  const baseNote = note.note.charAt(0);
  const isSharp = note.note.includes('#');
  const isFlat = note.note.includes('b');
  const alter = isSharp ? '1' : (isFlat ? '-1' : '0');
  const staffNumber = note.octave < 4 ? '2' : '1';

  const noteObj: NoteObject = {
    ...(isChord && { '@print-object': 'yes' }),
    ...(noteColor && { '@color': noteColor }),
    ...(isChord && { chord: {} }),
    pitch: {
      step: baseNote,
      ...((isSharp || isFlat) && { alter }),
      octave: String(note.octave)
    },
    duration: String(duration),
    type: noteColor
      ? { '@color': noteColor, '#': 'quarter' }
      : 'quarter',
    ...((isSharp || isFlat) && {
      accidental: noteColor
        ? { '@color': noteColor, '#': isSharp ? 'sharp' : 'flat' }
        : isSharp ? 'sharp' : 'flat'
    }),
    staff: staffNumber,
    ...(noteColor && {
      notehead: { '@color': noteColor, '#': 'normal' },
      stem: { '@color': noteColor, '#': 'up' }
    })
  };

  return noteObj;
}

/**
 * Generate MusicXML for chord display using xmlbuilder2
 */
export function generateChordMusicXML(options: ChordXMLOptions): string {
  const { chordName, notes, format, keySignature, noteColors } = options;

  // Build the MusicXML document
  const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: false })
    .dtd({
      pubID: '-//Recordare//DTD MusicXML 4.0 Partwise//EN',
      sysID: 'http://www.musicxml.org/dtds/partwise.dtd'
    })
    .ele('score-partwise', { version: '4.0' })
    .ele('part-list')
    .ele('score-part', { id: 'P1' })
    .ele('part-name').txt(chordName).up()
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

  // Add notes
  let currentMeasure = doc;

  if (format === 'arpeggio') {
    // For arpeggio, each note separately
    notes.forEach((note, index) => {
      const noteColor = noteColors && noteColors[index];
      const noteObj = createNoteObject(note, 1, false, index, noteColor);
      currentMeasure = currentMeasure.ele('note', noteObj);
    });
  } else {
    // For block format, first note then chord notes
    const firstNoteColor = noteColors && noteColors[0];
    const firstNoteObj = createNoteObject(notes[0], 4, false, 0, firstNoteColor);
    currentMeasure = currentMeasure.ele('note', firstNoteObj);

    notes.slice(1).forEach((note, index) => {
      const noteColor = noteColors && noteColors[index + 1];
      const noteObj = createNoteObject(note, 4, true, index + 1, noteColor);
      currentMeasure = currentMeasure.ele('note', noteObj);
    });
  }

  // Convert to XML string
  return doc.end({ prettyPrint: true });
}
