'use client';

import { useState } from 'react';

import { useToast } from '@/components/toast/ToastProvider';
import { useWallet } from '@/components/wallet/WalletProvider';
import { formatAmount } from '@/lib/format';
import { getMilestoneVaultClient } from '@/lib/milestoneVaultClient';

export function RefundButton({
  projectOnChainId,
  onRefunded,
}: {
  projectOnChainId: string;
  onRefunded: () => void;
}) {
  const { address, signTransaction } = useWallet();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleRefund(): Promise<void> {
    if (!address) return;
    setBusy(true);
    try {
      const client = await getMilestoneVaultClient(address, signTransaction);
      const tx = await client.refund({
        project_id: BigInt(projectOnChainId),
        donor: address,
      });
      const { result } = await tx.signAndSend();
      showToast('success', `Refunded ${formatAmount(String(result))}.`);
      onRefunded();
    } catch (err) {
      // The contract returns NothingToRefund once a donor's share has
      // already been claimed — a normal outcome, not a bug — but
      // friendlier per-error-code messages are a later polish pass, not
      // this one.
      showToast('error', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleRefund()}
      disabled={busy}
      className="shrink-0 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
    >
      {busy ? 'Claiming…' : 'Claim refund'}
    </button>
  );
}
