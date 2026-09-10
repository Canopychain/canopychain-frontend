import type { Metadata } from 'next';

// Overrides the parent /admin segment's title; robots directive is
// inherited from there since it isn't indexable either.
export const metadata: Metadata = {
  title: 'Project Oversight',
};

export default function ProjectOversightLayout({ children }: { children: React.ReactNode }) {
  return children;
}
