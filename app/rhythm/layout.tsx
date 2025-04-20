import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rhythm Patterns',
  description: 'Practice and explore simple and compound rhythm patterns at various tempi.'
};

export default function RhythmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
