import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chord',
  description: 'Chord reference: structures, voicings, filters, and playback.'
};

export default function ChordsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
