/**
 * Scale MusicXML Builder using xmlbuilder2
 */

import { create } from 'xmlbuilder2';
import { getNoteColor } from '@lib/noteColors';

interface ScaleNote {
  note: string;
  index: number;
}

interface ScaleXMLOptions {
  scaleName: string;
  notes: string[];
  octave?: number;
  highlightNoteIndex?: number;
  useColors?: boolean;
  isPlaying?: boolean;
}

// Legacy type no longer needed after explicit element construction removed
// (was used for spreading '@color').

/**
 * Create a note object for xmlbuilder2
 */
function createScaleNoteObject(
  noteData: ScaleNote,
  octave: number,
  options: ScaleXMLOptions
): { color?: string; pitch: { step: string; alter?: string; octave: string }; duration: string; type: string } {
  const { note, index } = noteData;
  const { highlightNoteIndex, useColors, isPlaying } = options;

  // Parse note (e.g., "C#" -> step: C, alter: 1)
  const step = note[0].toUpperCase();
  const alter = note.includes('#') ? 1 : note.includes('b') ? -1 : 0;

  // Determine color based on state
  let color: string | undefined;
  if (useColors) {
    if (isPlaying) {
      // When playing: only color the currently playing note
      if (highlightNoteIndex === index) {
        color = getNoteColor(note, octave);
      }
    } else {
      // When not playing: color all scale notes with octave-aware colors
      color = getNoteColor(note, octave);
    }
  }

  return {
    color,
    pitch: {
      step,
      ...(alter !== 0 && { alter: String(alter) }),
      octave: String(octave)
    },
    duration: '1',
    type: 'quarter'
  };
}

/**
 * Generate MusicXML for scale display using xmlbuilder2
 */
export function generateScaleMusicXML(options: ScaleXMLOptions): string {
  const { scaleName, notes, octave = 4, highlightNoteIndex, useColors, isPlaying } = options;

  if (!notes || notes.length === 0) {
    return '';
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
    .ele('part-name').txt(scaleName).up()
    .up()
    .up()
    .ele('part', { id: 'P1' })
    .ele('measure', { number: '1' })
    .ele('attributes')
    .ele('divisions').txt('1').up()
    .ele('key')
    .ele('fifths').txt('0').up()
    .up()
    .ele('time')
    .ele('beats').txt(String(notes.length * 2)).up()
    .ele('beat-type').txt('4').up()
    .up()
    .ele('clef')
    .ele('sign').txt('G').up()
    .ele('line').txt('2').up()
    .up()
    .up();

  // Add notes - display 2 octaves (octave 4 and octave 5)
  let currentMeasure = doc;

  // First octave
  notes.forEach((note, index) => {
    const noteDef = createScaleNoteObject(
      { note, index },
      octave,
      { ...options, highlightNoteIndex, useColors, isPlaying }
    );

    // Create <note> element with optional color attribute
    const noteEl = noteDef.color
      ? currentMeasure.ele('note', { color: noteDef.color })
      : currentMeasure.ele('note');

    // pitch
    const pitchEl = noteEl.ele('pitch');
    pitchEl.ele('step').txt(noteDef.pitch.step).up();
    if (noteDef.pitch.alter !== undefined) {
      pitchEl.ele('alter').txt(noteDef.pitch.alter).up();
    }
    pitchEl.ele('octave').txt(noteDef.pitch.octave).up();

    // duration and type
    noteEl.ele('duration').txt(noteDef.duration).up();
    noteEl.ele('type').txt(noteDef.type).up();

    currentMeasure = noteEl.up();
  });

  // Second octave
  notes.forEach((note, index) => {
    const noteDef = createScaleNoteObject(
      { note, index },
      octave + 1,
      { ...options, highlightNoteIndex, useColors, isPlaying }
    );

    // Create <note> element with optional color attribute
    const noteEl = noteDef.color
      ? currentMeasure.ele('note', { color: noteDef.color })
      : currentMeasure.ele('note');

    // pitch
    const pitchEl = noteEl.ele('pitch');
    pitchEl.ele('step').txt(noteDef.pitch.step).up();
    if (noteDef.pitch.alter !== undefined) {
      pitchEl.ele('alter').txt(noteDef.pitch.alter).up();
    }
    pitchEl.ele('octave').txt(noteDef.pitch.octave).up();

    // duration and type
    noteEl.ele('duration').txt(noteDef.duration).up();
    noteEl.ele('type').txt(noteDef.type).up();

    currentMeasure = noteEl.up();
  });

  // Add barline
  currentMeasure = currentMeasure.ele('barline', { location: 'right' })
    .ele('bar-style').txt('light-heavy').up();

  // Convert to XML string
  return doc.end({ prettyPrint: true });
}
