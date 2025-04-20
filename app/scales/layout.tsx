import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Musical Scales',
  description: 'Browse and filter musical scales by tonic, family, note count, and type.'
};

export default function ScalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
