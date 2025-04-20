import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Musical Keys & Key Signatures',
  description: 'Explore key signatures, relative keys, and the circle of fifths.'
};

export default function KeysLayout({ children }: { children: React.ReactNode }) {
  return children;
}
