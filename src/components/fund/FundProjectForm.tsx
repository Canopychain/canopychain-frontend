'use client';

import { useState, type FormEvent } from 'react';

import { useWallet } from '@/components/wallet/WalletProvider';

// Every Stellar Asset Contract token (native XLM included) uses 7 decimal
// places — that's fixed by the protocol, not something per-asset to look up.
const TOKEN_DECIMALS = 7;

type TokenChoice = 'native' | 'custom';

export function FundProjectForm({ projectId }: { projectId: string }) {
  const { address, connect } = useWallet();

  const [tokenChoice, setTokenChoice] = useState<TokenChoice>('native');
  const [customToken, setCustomToken] = useState('');
  const [amount, setAmount] = useState('');

  const amountNumber = Number(amount);
  const isAmountValid = Number.isFinite(amountNumber) && amountNumber > 0;
  const depositRaw = isAmountValid ? BigInt(Math.round(amountNumber * 10 ** TOKEN_DECIMALS)) : null;

  const isTokenValid = tokenChoice === 'native' || customToken.trim().length > 0;
  const canSubmit = isAmountValid && isTokenValid;

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    // Transaction building + wallet signing lands in the next commit —
    // for now this is just the form producing a valid, contract-shaped
    // deposit amount.
    console.log('deposit inputs', { projectId, tokenChoice, customToken, depositRaw });
  }

  if (!address) {
    return (
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
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
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

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        Review & Sign
      </button>
    </form>
  );
}
