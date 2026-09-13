'use client';

import { useState, type FormEvent } from 'react';

import { useToast } from '@/components/toast/ToastProvider';
import { useWallet } from '@/components/wallet/WalletProvider';
import { getMilestoneVaultClient } from '@/lib/milestoneVaultClient';
import { getNativeAssetAddress } from '@/lib/stellar';

// Every Stellar Asset Contract token (native XLM included) uses 7 decimal
// places — that's fixed by the protocol, not something per-asset to look up.
const TOKEN_DECIMALS = 7;

type TokenChoice = 'native' | 'custom';
type SubmitState = 'idle' | 'signing' | 'success' | 'error';

export function FundProjectForm({
  projectOnChainId,
  recipientAddress,
  attestorAddress,
  hasMilestoneSchedule,
}: {
  projectOnChainId: string;
  recipientAddress: string;
  attestorAddress: string;
  hasMilestoneSchedule: boolean;
}) {
  const { address, connect, signTransaction } = useWallet();
  const { showToast } = useToast();

  const scheduleWarning = !hasMilestoneSchedule && (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="font-medium text-amber-800">No milestone schedule yet</p>
      <p className="mt-1 text-sm text-amber-700">
        This project hasn&apos;t had its milestone schedule configured. Funds you deposit will
        sit in escrow and can&apos;t be released until an admin sets one up.
      </p>
    </div>
  );

  const [tokenChoice, setTokenChoice] = useState<TokenChoice>('native');
  const [customToken, setCustomToken] = useState('');
  const [amount, setAmount] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalDeposited, setTotalDeposited] = useState<string | null>(null);

  const amountNumber = Number(amount);
  const isAmountValid = Number.isFinite(amountNumber) && amountNumber > 0;
  const depositRaw = isAmountValid ? BigInt(Math.round(amountNumber * 10 ** TOKEN_DECIMALS)) : null;

  const isTokenValid = tokenChoice === 'native' || customToken.trim().length > 0;
  const canSubmit = isAmountValid && isTokenValid && submitState !== 'signing';

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit || !address || depositRaw === null) {
      return;
    }

    setSubmitState('signing');
    setErrorMessage(null);

    try {
      const tokenAddress = tokenChoice === 'native' ? getNativeAssetAddress() : customToken.trim();

      const client = await getMilestoneVaultClient(address, signTransaction);
      const tx = await client.deposit({
        donor: address,
        project_id: BigInt(projectOnChainId),
        recipient: recipientAddress,
        attestor: attestorAddress,
        token: tokenAddress,
        amount: depositRaw,
      });
      const { result } = await tx.signAndSend();

      setTotalDeposited(String(result));
      setSubmitState('success');
      showToast('success', 'Deposit confirmed on-chain.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMessage(message);
      setSubmitState('error');
      showToast('error', message);
    }
  }

  if (submitState === 'success' && totalDeposited !== null) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <p className="font-medium text-green-800">Deposit confirmed!</p>
        <p className="mt-1 text-sm text-green-700">
          The project&apos;s pool now holds {totalDeposited} (raw units) total.
        </p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="max-w-md">
        {scheduleWarning}
        <div className="rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600">Connect your wallet to fund this project.</p>
          <button
            type="button"
            onClick={() => void connect()}
            className="mt-4 rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      {scheduleWarning}
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
        <fieldset>
          <legend className="text-sm font-medium">Token</legend>
          <div className="mt-2 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="token"
                checked={tokenChoice === 'native'}
                onChange={() => setTokenChoice('native')}
              />
              XLM (native)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="token"
                checked={tokenChoice === 'custom'}
                onChange={() => setTokenChoice('custom')}
              />
              Custom asset
            </label>
          </div>
          {tokenChoice === 'custom' && (
            <input
              type="text"
              value={customToken}
              onChange={(event) => setCustomToken(event.target.value)}
              placeholder="Token contract address (C...)"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          )}
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium">Amount</span>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="100"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <p className="text-sm text-gray-500">
          Funds are held in the project&apos;s escrow vault and released to the operator only as
          milestones are attested — never all at once.
        </p>

        {submitState === 'error' && errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitState === 'signing' ? 'Confirm in your wallet…' : 'Review & Sign'}
        </button>
      </form>
    </div>
  );
}
