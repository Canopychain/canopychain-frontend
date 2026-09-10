import type { Metadata } from 'next';

// Single-admin-address-gated review panel — not indexable content.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
