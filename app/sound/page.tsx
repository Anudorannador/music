'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import Link from 'next/link';
import * as Tone from 'tone';
import { WebMidi } from 'webmidi';
// MusicXML generation centralized in musicXmlBuilder.ts
import { generateMusicXML } from './musicXmlBuilder';
import Keyboard from '../../components/Keyboard/Keyboard';
import { getNoteColor } from '@lib/noteColors';
import { MidiInputManager, ChordEvent } from '@lib/midiInputManager';
import styles from './sound.module.css';

// Add type declaration for WebKit audio context
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// Instrument types
type InstrumentType = 'piano' | 'steinway' | 'electric-piano' | 'strings' | 'violin' | 'synth' | 'organ';

// Instrument configurations
const INSTRUMENTS = {
  steinway: { name: 'Steinway Piano', icon: '🎹' },
  piano: { name: 'Grand Piano', icon: '🎹' },
  'electric-piano': { name: 'Electric Piano', icon: '🎹' },
  strings: { name: 'String Ensemble', icon: '🎻' },
  violin: { name: 'Violin', icon: '🎻' },
  synth: { name: 'Synthesizer', icon: '🎛️' },
  organ: { name: 'Electric Organ', icon: '🎹' },
} as const;

// Adapter around centralized builder (deprecated manual generation removed)
const generateStaffWithNotes = (
  _activeNote: string | null,
  _activeOctave: number | null,
  showAllNotes: boolean = true,
  activeNotesSet: Set<string> = new Set(),
  useColors: boolean = true
) => {
  return generateMusicXML({
    showAllNotes,
    useColors,
    activeNotesSet
  }, getNoteColor);
};

// Helper for formatting MIDI to note strings for display
const SEMITONE_TO_NOTE: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiToNote = (midi: number): { note: string; octave: number; id: string } => {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const note = SEMITONE_TO_NOTE[pc];
  return { note, octave, id: `${note}${octave}` };
};
// OSMD configuration object (pure data)
const OSMD_CONFIG = {
  autoResize: true,
  drawTitle: false,
  drawSubtitle: false,
  drawPartNames: false,
  drawMeasureNumbers: false,
  drawTimeSignatures: false,
  drawingParameters: 'compact',
  followCursor: true,
  disableCursor: false,
  logLevel: 'error', // Only show error logs from OSMD
};


// Main component using functional approach
export default function Sound() {
  // Display mode: 'active' = only playing notes, 'all' = all notes with highlights, 'both' = show both
  type DisplayMode = 'active' | 'all' | 'both';
  
  const playingNotesStaffRef = useRef<HTMLDivElement>(null);
  const allNotesStaffRef = useRef<HTMLDivElement>(null);
  const playingNotesOsmdInstance = useRef<OpenSheetMusicDisplay | null>(null);
  const allNotesOsmdInstance = useRef<OpenSheetMusicDisplay | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('active');
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('piano');
  const [isLoading, setIsLoading] = useState(false);
  const [midiEnabled, setMidiEnabled] = useState(false);
  const [sustainPedalDown, setSustainPedalDown] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [displayNotes, setDisplayNotes] = useState<string>('');
  const midiMgrRef = useRef<MidiInputManager | null>(null);
  const [audioContextReady, setAudioContextReady] = useState(false);
  const [useColors, setUseColors] = useState(true); // Color mode - default ON
  
  // Floating display position state (initialize after mount to avoid SSR issues)
  const [floatingPosition, setFloatingPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const keyboardRef = useRef<HTMLDivElement>(null);

  // Track sustained notes when pedal is down
  const sustainedNotesRef = useRef<Set<string>>(new Set());
  
  // Keep a ref to activeNotes for immediate access (avoid stale closure)
  const activeNotesRef = useRef<Set<string>>(new Set());
  
  // Keep a ref to sustainPedalDown for immediate access
  const sustainPedalDownRef = useRef<boolean>(false);
  
  // Store MIDI timestamps to compensate for JS event delays
  const firstNoteAudioTimeRef = useRef<number | null>(null);
  const firstNoteMidiTimeRef = useRef<number | null>(null);
  
  // Keep refs to handler functions to avoid closure issues in event listeners
  const handleKeyDownRef = useRef<((note: string, octave: number, velocity?: number) => void) | null>(null);
  const handleKeyUpRef = useRef<((note: string, octave: number) => void) | null>(null);

  // Tone.js instruments
  const steinwayRef = useRef<Tone.PolySynth | null>(null);
  const steinwayChorusRef = useRef<Tone.Chorus | null>(null);
  const steinwayReverbRef = useRef<Tone.Reverb | null>(null);
  const steinwayWidenerRef = useRef<Tone.StereoWidener | null>(null);
  const steinwayCompressorRef = useRef<Tone.Compressor | null>(null);
  const steinwayEqRef = useRef<Tone.EQ3 | null>(null);
  const pianoRef = useRef<Tone.PolySynth | null>(null);
  const electricPianoRef = useRef<Tone.FMSynth | null>(null);
  const stringsRef = useRef<Tone.PolySynth | null>(null);
  const violinRef = useRef<Tone.MonoSynth | null>(null);
  const synthRef = useRef<Tone.Synth | null>(null);
  const organRef = useRef<Tone.PolySynth | null>(null);

  // Initialize Tone.js instruments
  useEffect(() => {
    const initInstruments = async () => {
      setIsLoading(true);
      
      try {
        
        // Create Steinway Model D Concert Grand Piano sound
        // Premium Steinway Model D characteristics:
        // - Extremely rich harmonic content with complex overtones
        // - Powerful bass, singing middle register, brilliant treble
        // - Long sustain with natural decay (continues to decay even when held)
        // - Complex inharmonicity in upper partials
        const steinway = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'custom',
            // Complex harmonic series inspired by Steinway Model D
            // Strong fundamentals with rich upper partials
            partials: [
              1.0,   // Fundamental
              0.7,   // 2nd harmonic
              0.45,  // 3rd harmonic
              0.35,  // 4th harmonic
              0.28,  // 5th harmonic
              0.22,  // 6th harmonic
              0.18,  // 7th harmonic
              0.15,  // 8th harmonic
              0.12,  // 9th harmonic
              0.10,  // 10th harmonic
              0.08,  // 11th harmonic
              0.06,  // 12th harmonic
            ],
          },
          envelope: {
            attack: 0.0008,     // Extremely fast, hammer strike precision
            decay: 10,          // Very long decay - sound continues to fade even when held
            sustain: 0,         // Sustain = 0 means continuous decay (like real piano strings)
            release: 0.8,       // Relatively quick release when damper hits strings
          },
          volume: -6,           // Louder, more present
        }).toDestination();
        
        // Stereo widening for concert hall width
        const steinwayWidener = new Tone.StereoWidener({
          width: 0.5,
        }).toDestination();
        steinwayWidenerRef.current = steinwayWidener;
        
        // Subtle chorus for string resonance (una corda pedal effect)
        const steinwayChorus = new Tone.Chorus({
          frequency: 2,
          delayTime: 2.5,
          depth: 0.4,
          wet: 0.25,
        }).toDestination();
        steinwayChorusRef.current = steinwayChorus;
        
        // Concert hall reverb - larger, more prestigious space
        const steinwayReverb = new Tone.Reverb({
          decay: 3.5,          // Longer decay for concert hall
          preDelay: 0.015,     // Slight pre-delay
          wet: 0.18,           // More reverb presence
        }).toDestination();
        steinwayReverbRef.current = steinwayReverb;
        
        // Compression for dynamic control (like a well-regulated piano)
        const steinwayCompressor = new Tone.Compressor({
          threshold: -24,
          ratio: 4,
          attack: 0.003,
          release: 0.25,
        }).toDestination();
        steinwayCompressorRef.current = steinwayCompressor;
        
        // EQ to enhance the characteristic Steinway tone curve
        const steinwayEq = new Tone.EQ3({
          low: 2,              // Boost bass for powerful low end
          mid: 0,              // Flat mids
          high: 3,             // Boost highs for brilliance
          lowFrequency: 200,
          highFrequency: 4000,
        }).toDestination();
        steinwayEqRef.current = steinwayEq;
        
        // Signal chain: Piano -> EQ -> Compressor -> Chorus -> Widener -> Reverb
        steinway.chain(steinwayEq, steinwayCompressor, steinwayChorus, steinwayWidener, steinwayReverb);
        
        steinwayRef.current = steinway;

        // Create simple Grand Piano sound
        const piano = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            partials: [1, 0.5, 0.3, 0.2],
          },
          envelope: {
            attack: 0.001,
            decay: 6.0,       // Long decay for natural fade
            sustain: 0,       // Continuous decay like real piano
            release: 0.6,
          },
        }).toDestination();
        pianoRef.current = piano;

        // Electric Piano (FM synthesis for Rhodes-like sound)
        const electricPiano = new Tone.FMSynth({
          harmonicity: 3.01,
          modulationIndex: 14,
          oscillator: {
            type: 'triangle',
          },
          envelope: {
            attack: 0.005,
            decay: 4.0,       // Electric piano has moderate decay
            sustain: 0,       // Continuous decay
            release: 0.8,
          },
          modulation: {
            type: 'square',
          },
          modulationEnvelope: {
            attack: 0.002,
            decay: 0.2,
            sustain: 0,
            release: 0.2,
          },
        }).toDestination();
        electricPianoRef.current = electricPiano;

        // Strings (Polyphonic synth with slow attack and very long sustain)
        const strings = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'sawtooth',
          },
          envelope: {
            attack: 0.3,
            decay: 12.0,      // Very long decay for strings
            sustain: 0.1,     // Strings can sustain longer than piano
            release: 2.5,
          },
        }).toDestination();
        stringsRef.current = strings;

        // Violin (Monophonic synth with portamento)
        const violin = new Tone.MonoSynth({
          oscillator: {
            type: 'sawtooth',
          },
          envelope: {
            attack: 0.1,      // Slow attack for bow stroke
            decay: 8.0,       // Long decay
            sustain: 0.2,     // Some sustain for bowed instruments
            release: 1.2,
          },
          portamento: 0.05,   // Slight portamento for expressive slides
          volume: -8,
        }).toDestination();
        violinRef.current = violin;

        // Synth (Lead synthesizer)
        const synth = new Tone.Synth({
          oscillator: {
            type: 'square',
          },
          envelope: {
            attack: 0.005,
            decay: 3.0,
            sustain: 0,       // Synth with natural decay
            release: 0.8,
          },
        }).toDestination();
        synthRef.current = synth;

        // Organ (Polyphonic with sustained envelope - organs don't decay!)
        const organ = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'sine',
          },
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.9,     // Organ maintains volume (powered by air/electricity)
            release: 0.5,
          },
        }).toDestination();
        organRef.current = organ;

        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };

    initInstruments();

    return () => {
      // Cleanup
      steinwayRef.current?.dispose();
      steinwayChorusRef.current?.dispose();
      steinwayReverbRef.current?.dispose();
      steinwayWidenerRef.current?.dispose();
      steinwayCompressorRef.current?.dispose();
      steinwayEqRef.current?.dispose();
      pianoRef.current?.dispose();
      electricPianoRef.current?.dispose();
      stringsRef.current?.dispose();
      violinRef.current?.dispose();
      synthRef.current?.dispose();
      organRef.current?.dispose();
    };
  }, []);

  // Initialize floating display position after mount
  useEffect(() => {
    setFloatingPosition({
      x: window.innerWidth - 200,
      y: window.innerHeight / 2 - 30
    });
  }, []);

  // Start audio context on any user interaction
  useEffect(() => {
    const startAudioContext = async () => {
      if (Tone.getContext().state !== 'running') {
        try {
          await Tone.start();
          setAudioContextReady(true);
        } catch {
        }
      }
    };

    // Try to start on various events
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(eventType => {
      document.addEventListener(eventType, startAudioContext, { once: true });
    });

    return () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, startAudioContext);
      });
    };
  }, []);

  // Removed batch triggering - now playing immediately

  // Function to play a note with the selected instrument (attack only)
  const playNote = useCallback(
    async (note: string, octave: number, velocity = 0.8, timestamp?: number) => {
      const midiTimestamp = timestamp ?? performance.now();
      const noteFormat = `${note}${octave}`;
      
      // Ensure Tone.js context is started
      if (Tone.getContext().state !== 'running') {
        try {
          await Tone.start();
        } catch {
          return;
        }
      }

      // Get synth reference
      let currentSynthRef: any = null;
      switch (selectedInstrument) {
        case 'steinway':
          currentSynthRef = steinwayRef;
          break;
        case 'piano':
          currentSynthRef = pianoRef;
          break;
        case 'electric-piano':
          currentSynthRef = electricPianoRef;
          break;
        case 'strings':
          currentSynthRef = stringsRef;
          break;
        case 'violin':
          currentSynthRef = violinRef;
          break;
        case 'synth':
          currentSynthRef = synthRef;
          break;
        case 'organ':
          currentSynthRef = organRef;
          break;
      }
      
      if (!currentSynthRef?.current) {
        return;
      }
      
      // Check if synth is disposed before using it
      if (currentSynthRef.current.disposed) {
        return;
      }
      
      // Use audio context currentTime (more accurate than Tone.now)
      const audioContext = Tone.getContext();
      const audioNow = audioContext.currentTime;
      
      // Reset reference after 1 second of silence
      if (firstNoteMidiTimeRef.current && (midiTimestamp - firstNoteMidiTimeRef.current) > 1000) {
        firstNoteAudioTimeRef.current = null;
        firstNoteMidiTimeRef.current = null;
      }
      
      // Set baseline on first note
      if (firstNoteAudioTimeRef.current === null) {
        firstNoteAudioTimeRef.current = audioNow;
        firstNoteMidiTimeRef.current = midiTimestamp;
      }
      
      // Calculate delay based on MIDI timestamp difference
      const midiDelay = (midiTimestamp - (firstNoteMidiTimeRef.current || 0)) / 1000;
      const scheduleTime = (firstNoteAudioTimeRef.current || audioNow) + midiDelay;
      
      // Use audio context's precise scheduling
      currentSynthRef.current.triggerAttack(noteFormat, scheduleTime, velocity);
    },
    [selectedInstrument, steinwayRef, pianoRef, electricPianoRef, stringsRef, violinRef, synthRef, organRef]
  );

  // Function to release a note
  const releaseNote = useCallback(
    (note: string, octave: number) => {
      const noteFormat = `${note}${octave}`;

      switch (selectedInstrument) {
        case 'steinway':
          if (steinwayRef.current && !steinwayRef.current.disposed) {
            steinwayRef.current.triggerRelease([noteFormat]);
          }
          break;
        case 'piano':
          if (pianoRef.current && !pianoRef.current.disposed) {
            pianoRef.current.triggerRelease([noteFormat]);
          }
          break;
        case 'electric-piano':
          if (electricPianoRef.current && !electricPianoRef.current.disposed) {
            electricPianoRef.current.triggerRelease(noteFormat);
          }
          break;
        case 'strings':
          if (stringsRef.current && !stringsRef.current.disposed) {
            stringsRef.current.triggerRelease([noteFormat]);
          }
          break;
        case 'violin':
          if (violinRef.current && !violinRef.current.disposed) {
            violinRef.current.triggerRelease(noteFormat);
          }
          break;
        case 'synth':
          if (synthRef.current && !synthRef.current.disposed) {
            synthRef.current.triggerRelease(noteFormat);
          }
          break;
        case 'organ':
          if (organRef.current && !organRef.current.disposed) {
            organRef.current.triggerRelease([noteFormat]);
          }
          break;
      }
    },
    [selectedInstrument]
  );

  // Handle keyboard key down (attack)
  const handleKeyDown = useCallback(
    (note: string, octave: number, velocity = 0.8, timestamp?: number) => {
      const noteId = `${note}${octave}`;
      
      // Check immediately using ref to avoid batching issues
      if (activeNotesRef.current.has(noteId)) {
        return;
      }
      
      // 1. IMMEDIATELY play sound (don't wait for state), pass timestamp
      playNote(note, octave, velocity, timestamp);
      
      // 2. Update ref immediately for next check
      activeNotesRef.current.add(noteId);
      
      // 3. Update state for UI (async, React will handle)
      setActiveNotes((prev) => new Set(prev).add(noteId));
    },
    [playNote]
  );
  
  // Update ref whenever function changes
  handleKeyDownRef.current = handleKeyDown;

  // Handle keyboard key up (release)
  const handleKeyUp = useCallback(
    (note: string, octave: number) => {
      const noteId = `${note}${octave}`;
      
      // 1. IMMEDIATELY handle sound (check pedal state from ref)
      if (sustainPedalDownRef.current) {
        // Add to sustained notes instead of releasing immediately
        sustainedNotesRef.current.add(noteId);
      } else {
        // Release the note immediately
        releaseNote(note, octave);
      }
      
      // 2. Update ref immediately
      activeNotesRef.current.delete(noteId);
      
      // 3. Update state for UI (async, React will handle)
      setActiveNotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    },
    [releaseNote]
  );
  
  // Update ref whenever function changes
  handleKeyUpRef.current = handleKeyUp;

  // Drag handlers for floating display
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - floatingPosition.x,
      y: e.clientY - floatingPosition.y,
    });
  }, [floatingPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setFloatingPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Init MidiInputManager and subscribe to chord events (for display + grouping awareness)
  useEffect(() => {
    const mgr = new MidiInputManager();
    midiMgrRef.current = mgr;
    const offChord = mgr.onChord((evt: ChordEvent) => {
      if (evt.name) {
        setDisplayNotes(evt.name);
      } else if (evt.notes.length) {
        setDisplayNotes(evt.notes.map(midiToNote).map(n => n.id).join(', '));
      } else {
        setDisplayNotes('');
      }
    });
    return () => { offChord(); mgr.dispose(); midiMgrRef.current = null; };
  }, []);

  // Clear all notes when instrument changes
  useEffect(() => {
    // Clear refs immediately
    activeNotesRef.current.clear();
    sustainPedalDownRef.current = false;
    sustainedNotesRef.current.clear();
    
    // Clear state
    setActiveNotes(new Set());
    setSustainPedalDown(false);
    
    // Release all notes from all instruments
    if (steinwayRef.current && 'releaseAll' in steinwayRef.current) {
      steinwayRef.current.releaseAll();
    }
    if (pianoRef.current && 'releaseAll' in pianoRef.current) {
      pianoRef.current.releaseAll();
    }
    if (stringsRef.current && 'releaseAll' in stringsRef.current) {
      stringsRef.current.releaseAll();
    }
    if (organRef.current && 'releaseAll' in organRef.current) {
      organRef.current.releaseAll();
    }
  }, [selectedInstrument]);

  // Update staff notation whenever active notes change
  useEffect(() => {
    // Update playing notes staff (only shows active notes)
    if (playingNotesOsmdInstance.current) {
      const playingNotesXML = generateStaffWithNotes(null, null, false, activeNotes, useColors);
      playingNotesOsmdInstance.current
        .load(playingNotesXML)
        .then(() => {
          playingNotesOsmdInstance.current?.render();
        })
        .catch(() => {
          setIsLoading(false);
        });
    }

    // Update all notes staff (shows all notes with highlights)
    if (allNotesOsmdInstance.current) {
      const allNotesXML = generateStaffWithNotes(null, null, true, activeNotes, useColors);
      allNotesOsmdInstance.current
        .load(allNotesXML)
        .then(() => {
          allNotesOsmdInstance.current?.render();
        })
        .catch(() => {
        });
    }
  }, [activeNotes, useColors]);

  // Initialize MIDI input
  useEffect(() => {
    let isMounted = true;
    
    const initMidi = async () => {
      try {
        // Check if already enabled
        if (WebMidi.enabled) {
          setMidiEnabled(true);
          return;
        }

        // WebMidi v3 uses Promise-based API
        await WebMidi.enable({
          sysex: false,
          software: false,
        });
        
        if (!isMounted) return;
        
        setMidiEnabled(true);

        // Check if there are any MIDI inputs available
        if (!WebMidi.inputs || WebMidi.inputs.length === 0) {
          return;
        }

        // Listen to all MIDI inputs
        WebMidi.inputs.forEach((input: any) => {
          if (!input) {
            return;
          }

          // WebMidi v3 uses channels - listen to all channels (1-16)
          // Or use input.addForwarder() for forwarding events
          // The correct way in v3 is to iterate through channels or use input directly with 'on'
          
          // Note on - WebMidi v3 syntax
          input.channels.forEach((channel: any) => {
            channel.addListener('noteon', (e: any) => {
              try {
                const fullNote = e.note.identifier; // e.g., "C#4" with sharp
                // Parse the note and octave from identifier
                const match = fullNote.match(/^([A-G][#b]?)(-?\d+)$/);
                if (!match) {
                  return;
                }
                const noteName = match[1]; // e.g., "C#"
                const octave = parseInt(match[2], 10); // e.g., 4
                // In webmidi v3, velocity is in the event object, normalized to 0-1
                const velocity = e.note.attack || e.rawVelocity / 127 || 0.8;
                // Get MIDI event timestamp
                const timestamp = e.timestamp;
                // Feed MidiInputManager with raw MIDI values for grouping
                midiMgrRef.current?.handleNoteOn(e.note.number, Math.max(0, Math.min(127, e.rawVelocity ?? Math.round(velocity * 127))));
                
                // Some MIDI keyboards send velocity 0 as note-off instead of noteoff event
                if (velocity === 0 || e.rawVelocity === 0) {
                  handleKeyUp(noteName, octave);
                  return;
                }
                
                // Handle key down with velocity and timestamp
                handleKeyDown(noteName, octave, velocity, timestamp);
              } catch {
              }
            });

            // Note off
            channel.addListener('noteoff', (e: any) => {
              try {
                const fullNote = e.note.identifier;
                // Parse the note and octave from identifier
                const match = fullNote.match(/^([A-G][#b]?)(-?\d+)$/);
                if (!match) {
                  return;
                }
                const noteName = match[1]; // e.g., "C#"
                const octave = parseInt(match[2], 10); // e.g., 4
                // Forward to MidiInputManager
                midiMgrRef.current?.handleNoteOff(e.note.number);
                
                // Handle key up
                handleKeyUp(noteName, octave);
              } catch {
              }
            });

            // Sustain pedal (Control Change 64)
            channel.addListener('controlchange', (e: any) => {
              try {
                if (e.controller.number === 64) {
                  // Sustain pedal
                  // WebMidi v3 normalizes value to 0-1, but we need the raw MIDI value (0-127)
                  // Use e.rawValue for the actual MIDI value, or convert normalized value
                  const rawValue = e.message?.data?.[2] ?? Math.round(e.value * 127);
                  const isDown = rawValue >= 64; // MIDI CC value >= 64 means pedal down
                  // Forward to MidiInputManager
                  midiMgrRef.current?.handleControlChange(64, rawValue);
                  
                  // Update ref immediately for instant access
                  const prevState = sustainPedalDownRef.current;
                  sustainPedalDownRef.current = isDown;
                  
                  // When pedal is released, release all sustained notes
                  if (prevState && !isDown) {
                    sustainedNotesRef.current.forEach((noteId) => {
                      const match = noteId.match(/^([A-G]#?)(\d+)$/);
                      if (match) {
                        const [, note, octave] = match;
                        releaseNote(note, parseInt(octave));
                      }
                    });
                    sustainedNotesRef.current.clear();
                  }
                  
                  // Update state for UI
                  setSustainPedalDown(isDown);
                }
              } catch {
              }
            });
          });
        });
      } catch {
        if (isMounted) {
          setMidiEnabled(false);
        }
      }
    };

    initMidi();

    return () => {
      isMounted = false;
      // Don't disable WebMidi on cleanup as it's a global singleton
      // and may be needed by other components or future re-renders
    };
  }, [selectedInstrument, handleKeyDown, handleKeyUp, releaseNote]);

  useEffect(() => {
    // Reset OSMD instances when displayMode changes to force re-initialization
    if (displayMode === 'all' || displayMode === 'active') {
      if (displayMode === 'active') {
        allNotesOsmdInstance.current = null;
      }
      if (displayMode === 'all') {
        playingNotesOsmdInstance.current = null;
      }
    }
  }, [displayMode]);

  useEffect(() => {
    if (playingNotesStaffRef.current && !playingNotesOsmdInstance.current) {
      playingNotesOsmdInstance.current = new OpenSheetMusicDisplay(playingNotesStaffRef.current, {
        ...OSMD_CONFIG,
        drawingParameters: 'compact',
      });

      // For playing notes staff, only show active notes
      const playingNotesXML = generateStaffWithNotes(null, null, false, new Set(), useColors);

      playingNotesOsmdInstance.current
        .load(playingNotesXML)
        .then(() => {
          playingNotesOsmdInstance.current?.render();
        })
        .catch(() => {
        });
    }

    if (allNotesStaffRef.current && !allNotesOsmdInstance.current) {
      allNotesOsmdInstance.current = new OpenSheetMusicDisplay(allNotesStaffRef.current, {
        ...OSMD_CONFIG,
        drawingParameters: 'compact',
      });

      // For all notes staff, show all notes with highlights
      const allNotesXML = generateStaffWithNotes(null, null, true, new Set(), useColors);

      allNotesOsmdInstance.current
        .load(allNotesXML)
        .then(() => {
          allNotesOsmdInstance.current?.render();

          // Add click event listeners to notes on the all notes staff
          if (allNotesStaffRef.current) {
            const staffElement = allNotesStaffRef.current;

            staffElement.addEventListener('click', (event) => {
              const clickedElement = event.target as HTMLElement;
              const noteElement = findNoteElement(clickedElement);

              if (noteElement) {
                const noteInfo = extractNoteInfo(noteElement);
                if (noteInfo) {
                  // Use refs to get current functions
                  if (handleKeyDownRef.current && handleKeyUpRef.current) {
                    handleKeyDownRef.current(noteInfo.note, noteInfo.octave);
                    setTimeout(() => {
                      handleKeyUpRef.current?.(noteInfo.note, noteInfo.octave);
                    }, 300);
                  }
                }
              }
            });
          }
        })
        .catch(() => {
        });
    }

    // Cleanup on unmount
    return () => {
      playingNotesOsmdInstance.current = null;
      allNotesOsmdInstance.current = null;
    };
  }, [displayMode, useColors]); // Re-run when displayMode or useColors changes

  // Helper function to find the note element from a clicked element
  const findNoteElement = (element: HTMLElement): HTMLElement | null => {
    // Check if we're clicking directly on a note or a note container
    let current = element;

    // If we click on an SVG element, traverse up to find the note container
    if (
      current.tagName.toLowerCase() === 'path' ||
      current.tagName.toLowerCase() === 'rect' ||
      current.tagName.toLowerCase() === 'g' ||
      current.tagName.toLowerCase() === 'svg'
    ) {
      // Check if it's part of a note (common OSMD/VexFlow note structure)
      while (current && current !== allNotesStaffRef.current) {
        // Check for common OSMD/VexFlow note classes
        // Handle SVG classList objects and regular strings
        const getClassValue = (elem: HTMLElement): string => {
          const cn = elem.className;
          if (typeof cn === 'string') return cn;
          if (cn && typeof cn === 'object' && 'baseVal' in cn) return (cn as SVGAnimatedString).baseVal;
          return '';
        };
        const classValue = getClassValue(current);
        const hasClass = (className: string) => {
          if (typeof classValue === 'string') {
            return classValue.includes(className);
          } else if (current.classList) {
            return current.classList.contains(className);
          }
          return false;
        };

        if (hasClass('vf-note') || hasClass('vf-notehead') || hasClass('vf-stavenote')) {
          return current;
        }

        // Also check for OSMD note class attributes
        if (
          current.hasAttribute('data-staff') ||
          current.hasAttribute('data-measure') ||
          current.hasAttribute('data-note')
        ) {
          return current;
        }

        current = current.parentElement as HTMLElement;
      }
    }

    // If we didn't find a note container, check if we're clicking on an element inside a note container
    if (current && current !== allNotesStaffRef.current) {
      // Check if this element or any parent has pitch information
      const pitchElement =
        current.closest('[data-pitch-step]') ||
        current.closest('[data-note]') ||
        current.closest('.note');

      if (pitchElement) {
        return pitchElement as HTMLElement;
      }
    }

    return null;
  };

  // Helper function to extract note information from a note element
  const extractNoteInfo = (noteElement: HTMLElement): { note: string; octave: number } | null => {
    // Get coordinates of the clicked element
    const rect = noteElement.getBoundingClientRect();
    const staffRect = allNotesStaffRef.current?.getBoundingClientRect();

    if (staffRect) {
      // Direct click position to note mapping
      // This is the most reliable method since we know exactly which notes we generated

      // Calculate the relative position within the staff (as a percentage)
      const xPosition = rect.left - staffRect.left;
      const staffWidth = staffRect.width;
      const positionRatio = xPosition / staffWidth;

      // Define our 88-key piano range (A0 to C8)
      const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const totalKeys = 88;

      // Map the position ratio directly to a key index (0-87)
      const keyIndex = Math.floor(positionRatio * totalKeys);
      const boundedIndex = Math.max(0, Math.min(keyIndex, totalKeys - 1));

      // The piano range starts with A0, then A#0, B0, then C1 through B1, etc.
      // We need to map the index (0-87) to the correct note and octave

      // First, define our full range of notes
      const fullRange = [
        // Octave 0: only A, A#, B
        { note: 'A', octave: 0 },
        { note: 'A#', octave: 0 },
        { note: 'B', octave: 0 },

        // Octave 1: C through B
        { note: 'C', octave: 1 },
        { note: 'C#', octave: 1 },
        { note: 'D', octave: 1 },
        { note: 'D#', octave: 1 },
        { note: 'E', octave: 1 },
        { note: 'F', octave: 1 },
        { note: 'F#', octave: 1 },
        { note: 'G', octave: 1 },
        { note: 'G#', octave: 1 },
        { note: 'A', octave: 1 },
        { note: 'A#', octave: 1 },
        { note: 'B', octave: 1 },

        // Octaves 2-7: full range
        // Octave 2
        ...allNotes.map((note) => ({ note, octave: 2 })),
        // Octave 3
        ...allNotes.map((note) => ({ note, octave: 3 })),
        // Octave 4
        ...allNotes.map((note) => ({ note, octave: 4 })),
        // Octave 5
        ...allNotes.map((note) => ({ note, octave: 5 })),
        // Octave 6
        ...allNotes.map((note) => ({ note, octave: 6 })),
        // Octave 7
        ...allNotes.map((note) => ({ note, octave: 7 })),

        // Octave 8: only C
        { note: 'C', octave: 8 },
      ];

      // Get the note info directly from our array
      const noteInfo = fullRange[boundedIndex];

      if (noteInfo) {
        return noteInfo;
      }
    }

    return null;
    return null;
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sound</h1>
        
        {/* Display mode selector */}
        <div className={styles.instrumentSelector}>
          <label htmlFor="display-mode-select" className={styles.label}>
            📊 Display:
          </label>
          <select
            id="display-mode-select"
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
            className={styles.select}
          >
            <option value="active">Only Playing Notes</option>
            <option value="all">All Notes (Highlighted)</option>
            <option value="both">Both Views</option>
          </select>
        </div>
        
        {/* Timbre selector */}
        <div className={styles.instrumentSelector}>
          <label htmlFor="instrument-select" className={styles.label}>
            🎼 Timbre:
          </label>
          <select
            id="instrument-select"
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value as InstrumentType)}
            className={styles.select}
            disabled={isLoading}
          >
            {Object.entries(INSTRUMENTS).map(([key, { name, icon }]) => (
              <option key={key} value={key}>
                {icon} {name}
              </option>
            ))}
          </select>
          {isLoading && <span className={styles.loading}>Loading...</span>}
        </div>
        
        {/* Color mode toggle */}
        <div className={styles.instrumentSelector}>
          <button
            className={styles.colorToggleButton}
            onClick={() => setUseColors(!useColors)}
            title={useColors ? 'Disable octave-aware colors' : 'Enable octave-aware colors'}
            aria-label={useColors ? 'Disable octave-aware colors' : 'Enable octave-aware colors'}
          >
            {useColors ? '🎨 Colors On' : '🎨 Colors Off'}
          </button>
        </div>

        {/* Audio prompt or status displays */}
        {!audioContextReady ? (
          <div className={styles.headerAudioPrompt}>
            🎵 Click anywhere on the page to enable audio
          </div>
        ) : (
          <div className={styles.headerStatusContainer}>
            <div className={styles.midiStatus}>
              <span className={midiEnabled ? styles.midiEnabled : styles.midiDisabled}>
                {midiEnabled ? '🎹 MIDI Connected' : '🎹 MIDI Disconnected'}
              </span>
            </div>
            {midiEnabled && (
              <div className={styles.pedalStatus}>
                <span className={sustainPedalDown ? styles.pedalDown : styles.pedalUp}>
                  🦶 Sustain: {sustainPedalDown ? 'ON' : 'OFF'}
                </span>
              </div>
            )}
          </div>
        )}
        
        <Link href="/" className={styles.backButton}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="dark:invert"
          >
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Playing notes staff (only shows currently playing notes) */}
      {(displayMode === 'active' || displayMode === 'both') && (
        <div className={styles.playingNotesStaffContainer}>
          <div ref={playingNotesStaffRef} className={styles.musicStaff}></div>
        </div>
      )}

      {/* All notes staff (shows all notes with highlights) */}
      {(displayMode === 'all' || displayMode === 'both') && (
        <div className={styles.allNotesStaffContainer}>
          <div ref={allNotesStaffRef} className={styles.musicStaff}></div>
        </div>
      )}

      {/* Keyboard moved to bottom */}
      <div className={styles.keyboardWrapper} ref={keyboardRef}>
  <Keyboard onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} activeNotes={activeNotes} useColors={useColors} />
      </div>

      {/* Floating draggable display */}
      <div
        className={styles.floatingDisplay}
        style={{
          left: `${floatingPosition.x}px`,
          top: `${floatingPosition.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        {displayNotes ? `Playing: ${displayNotes}` : 'Not Playing'}
      </div>
    </main>
  );
}
