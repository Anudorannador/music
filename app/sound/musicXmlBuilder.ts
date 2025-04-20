/**
 * MusicXML Builder utility using xmlbuilder2 instead of string concatenation
 */

import { create } from 'xmlbuilder2';

interface NoteData {
  note: string;
  octave: number;
  isActive: boolean;
}

interface BuilderOptions {
  showAllNotes: boolean;
  useColors: boolean;
  activeNotesSet: Set<string>;
}

type NoteObject = Record<string, unknown>;

/**
 * Create a MusicXML note element
 */
function createNoteObject(
  noteData: NoteData,
  options: BuilderOptions,
  getNoteColor: (note: string, octave: number) => string
): NoteObject {
  const { note, octave, isActive } = noteData;
  const { showAllNotes, useColors } = options;

  const isSharp = note.includes('#');
  const baseNote = note.charAt(0);
  const staffNumber = octave < 4 ? '2' : '1';
  const shouldBeVisible = showAllNotes || isActive;

  // Determine color
  let color: string;
  if (useColors) {
    color = getNoteColor(note, octave);
  } else {
    color = isActive ? '#0070f3' : 'black';
  }

  const noteObj: NoteObject = {
    '@color': !shouldBeVisible ? '#FF000000' : undefined,
    pitch: {
      step: baseNote,
      ...(isSharp && { alter: '1' }),
      octave: String(octave)
    },
    duration: '1',
    type: 'quarter',
    ...(isSharp && { accidental: 'sharp' }),
    staff: staffNumber,
    stem: shouldBeVisible
      ? { '@color': color, '#': 'up' }
      : 'up',
    ...(shouldBeVisible && {
      notehead: { '@color': color, '#': 'normal' }
    })
  };

  // Remove undefined values
  if (noteObj['@color'] === undefined) {
    delete noteObj['@color'];
  }

  return noteObj;
}

/**
 * Generate MusicXML using xmlbuilder2
 */
export function generateMusicXML(
  options: BuilderOptions,
  getNoteColor: (note: string, octave: number) => string
): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Helper to check if note is active
  const isNoteActive = (note: string, octave: number): boolean => {
    const noteId = `${note}${octave}`;
    return options.activeNotesSet.has(noteId);
  };

  // Generate all notes
  const allNotes: NoteObject[] = [];

  for (let octave = 0; octave <= 8; octave++) {
    let octaveNotes: string[];

    if (octave === 0) {
      octaveNotes = ['A', 'B'];
    } else if (octave === 8) {
      octaveNotes = ['C'];
    } else {
      octaveNotes = notes;
    }

    for (const note of octaveNotes) {
      allNotes.push(
        createNoteObject(
          { note, octave, isActive: isNoteActive(note, octave) },
          options,
          getNoteColor
        )
      );
    }
  }

  // Add placeholder note
  allNotes.push({
    '@print-leger': 'no',
    '@color': '#00000000',
    pitch: {
      step: 'C',
      octave: '8'
    },
    duration: '1',
    type: 'quarter',
    stem: 'none',
    staff: '1',
    notehead: { '@color': '#00000000', '#': 'none' }
  });

  // Build the complete MusicXML document
  const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: false })
    .dtd({
      pubID: '-//Recordare//DTD MusicXML 4.0 Partwise//EN',
      sysID: 'http://www.musicxml.org/dtds/partwise.dtd'
    })
    .ele('score-partwise', { version: '4.0' })
    .ele('part-list')
    .ele('score-part', { id: 'P1' })
    .ele('part-name').txt('Music').up()
    .up()
    .up()
    .ele('part', { id: 'P1' })
    .ele('measure', { number: '1', width: '1600' })
    .ele('attributes')
    .ele('divisions').txt('1').up()
    .ele('key')
    .ele('fifths').txt('0').up()
    .up()
    .ele('time')
    .ele('beats').txt('4').up()
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

  // Add all notes
  let currentMeasure = doc;
  allNotes.forEach(noteObj => {
    currentMeasure = currentMeasure.ele('note', noteObj);
  });

  // Convert to XML string
  return doc.end({ prettyPrint: true });
}
