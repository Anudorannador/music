'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import RhythmPatterns, { type Instrument } from './RhythmPatterns';
import { getCommonTimeSignatures } from './rhythmUtils';

const TEMPO_OPTIONS = [
  { value: 'Largo', label: 'Largo', bpm: 45 },
  { value: 'Adagio', label: 'Adagio', bpm: 65 },
  { value: 'Lento', label: 'Lento', bpm: 55 },
  { value: 'Andante', label: 'Andante', bpm: 90 },
  { value: 'Moderato', label: 'Moderato', bpm: 110 },
  { value: 'Allegro', label: 'Allegro', bpm: 140 },
  { value: 'Presto', label: 'Presto', bpm: 180 },
  { value: 'Prestissimo', label: 'Prestissimo', bpm: 200 },
] as const;

const INSTRUMENT_OPTIONS: { value: Instrument; label: string }[] = [
  { value: 'drums', label: 'Drums' },
  { value: 'piano', label: 'Piano' },
  { value: 'strings', label: 'Strings' },
];

export default function RhythmPage() {
  const [tempo, setTempo] = useState<typeof TEMPO_OPTIONS[number]['value']>('Moderato');
  const [instrument, setInstrument] = useState<Instrument>('drums');
  const selectedTempo = TEMPO_OPTIONS.find(t => t.value === tempo);

  // Log time signature analysis on mount (for debugging/educational purposes)
  useEffect(() => {
    const timeSignatures = getCommonTimeSignatures();
    console.log('🎵 Time Signatures Analysis (using Tonal library):', timeSignatures);
  }, []);

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center">
        <div className="w-full max-w-[1400px] flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-10 px-4 gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="instrument-select" className="text-sm font-medium">
                Instrument:
              </label>
              <select
                id="instrument-select"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value as Instrument)}
                className="rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-[#1a1a1a] transition-colors px-3 py-2 text-sm font-medium hover:border-black/[.2] dark:hover:border-white/[.3] focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent cursor-pointer"
              >
                {INSTRUMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="tempo-select" className="text-sm font-medium">
                Tempo:
              </label>
              <select
                id="tempo-select"
                value={tempo}
                onChange={(e) => setTempo(e.target.value as typeof tempo)}
                className="rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-[#1a1a1a] transition-colors px-3 py-2 text-sm font-medium hover:border-black/[.2] dark:hover:border-white/[.3] focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent cursor-pointer"
              >
                {TEMPO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} (♩ = {option.bpm})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Rhythm Patterns</h1>
        <p className="text-lg text-black/70 dark:text-white/70 max-w-2xl text-center">
          Explore 8 simple rhythm patterns and 62 compound rhythm patterns
        </p>
        <RhythmPatterns tempo={selectedTempo?.bpm || 110} instrument={instrument} />
      </main>
    </div>
  );
}
