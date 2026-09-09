import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

// Placeholder — the real landing page (mission, how-it-works) lands in a
// later commit. This just confirms the scaffold, and now wallet
// connection, render and wire up end to end.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-3xl font-bold">Canopychain</h1>
      <p className="text-gray-500">Milestone-verified reforestation funding on Stellar.</p>
      <ConnectWalletButton />
    </main>
  );
}
