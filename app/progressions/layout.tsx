import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chord Progressions',
  description: 'Browse, filter, and build chord progressions in any key and mode.'
};

export default function ProgressionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
