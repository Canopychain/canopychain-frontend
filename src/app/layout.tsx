import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ToastProvider } from '@/components/toast/ToastProvider';
import { WalletProvider } from '@/components/wallet/WalletProvider';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const DESCRIPTION = 'Milestone-verified reforestation funding on Stellar.';

export const metadata: Metadata = {
  title: {
    default: 'Canopychain',
    // Child routes set just their own segment (e.g. "Explore Projects")
    // and get this composed automatically, rather than repeating
    // "Canopychain" in every page's own metadata.
    template: '%s — Canopychain',
  },
  description: DESCRIPTION,
  openGraph: {
    title: 'Canopychain',
    description: DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Canopychain',
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <WalletProvider>{children}</WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
