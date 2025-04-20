/**
 * Rhythm MusicXML Builder using xmlbuilder2
 */

import { create } from 'xmlbuilder2';

interface RhythmNote {
  duration: number;
  type: string;
  dots: number;
  beamNumber?: string;
}

interface RhythmXMLOptions {
  divisions: number;
  beatType: number;
  notes: RhythmNote[];
  needBeam: boolean;
}

/**
 * Generate MusicXML for rhythm patterns using xmlbuilder2
 */
export function generateRhythmMusicXML(options: RhythmXMLOptions): string {
  const { divisions, beatType, notes, needBeam } = options;

  const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
  const beatsInMeasure = Math.ceil(totalDuration / divisions);

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
  notes.forEach((note, idx) => {
    const noteObj: Record<string, unknown> = {
      pitch: {
        step: 'C',
        octave: '4'
      },
      duration: String(note.duration),
      type: note.type
    };

    // Add dots if present
    if (note.dots > 0) {
      noteObj.dot = Array(note.dots).fill({});
    }

    // Add beam if needed
    if (note.duration < 16 && needBeam) {
      let beamValue: string;
      if (idx === 0) {
        beamValue = 'begin';
      } else if (idx === notes.length - 1) {
        beamValue = 'end';
      } else {
        beamValue = 'continue';
      }
      noteObj.beam = { '@number': '1', '#': beamValue };
    }

    currentMeasure = currentMeasure.ele('note', noteObj);
  });

  // Convert to XML string
  return doc.end({ prettyPrint: true });
}
