declare module 'react-piano' {
  import { FC } from 'react';

  export interface NoteRange {
    first: number;
    last: number;
  }

  export interface KeyboardShortcutsConfig {
    firstNote: number;
    lastNote: number;
    keyboardConfig: KeyboardConfig;
  }

  export type KeyboardConfig = unknown;

  export interface PianoProps {
    noteRange: NoteRange;
    playNote: (midiNumber: number) => void;
    stopNote: (midiNumber: number) => void;
    width?: number;
    keyWidthToHeight?: number;
    keyboardShortcuts?: KeyboardConfig;
    activeNotes?: number[];
    disabled?: boolean;
    gliss?: boolean;
    renderNoteLabel?: (props: { midiNumber: number; isAccidental: boolean }) => React.ReactNode;
  }

  export const Piano: FC<PianoProps>;

  export const MidiNumbers: {
    fromNote: (note: string) => number;
    toNote: (midiNumber: number) => string;
    NATURAL_MIDI_NUMBERS: number[];
  };

  export const KeyboardShortcuts: {
    create: (config: KeyboardShortcutsConfig) => KeyboardConfig;
    HOME_ROW: KeyboardConfig;
    BOTTOM_ROW: KeyboardConfig;
    QWERTY_ROW: KeyboardConfig;
  };
}

declare module 'react-piano/dist/styles.css' {
  const content: string;
  export default content;
}
