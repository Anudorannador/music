import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sound',
  description: 'Interact with notes, instruments, MIDI input, and live notation.'
};

export default function SoundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
