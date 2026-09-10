'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';

import { PolygonMap } from '@/components/project/PolygonMap';
import { useToast } from '@/components/toast/ToastProvider';
import { useWallet } from '@/components/wallet/WalletProvider';
import { ApiError, registerProjectDetails, type PolygonGeometry } from '@/lib/api';
import { bytesToHex, hashPolygon, parsePolygonFile } from '@/lib/polygon';
import { getProjectRegistryClient } from '@/lib/projectRegistryClient';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function OperatorRegistrationForm() {
  const { address, connect, signTransaction } = useWallet();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [attestorAddress, setAttestorAddress] = useState('');
  const [polygon, setPolygon] = useState<PolygonGeometry | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const canSubmit =
    !!address &&
    name.trim().length > 0 &&
    recipientAddress.trim().length > 0 &&
    attestorAddress.trim().length > 0 &&
    polygon !== null &&
    status !== 'submitting';

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setPolygon(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        setPolygon(parsePolygonFile(String(reader.result)));
      } catch (err) {
        setFileError(err instanceof Error ? err.message : 'Could not read that file.');
      }
    };
    reader.onerror = () => setFileError('Could not read that file.');
    reader.readAsText(file);
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit || !address || !polygon) return;

    setStatus('submitting');
    setErrorMessage(null);

    try {
      const hash = await hashPolygon(polygon);

      const client = await getProjectRegistryClient(address, signTransaction);
      const tx = await client.register({
        operator: address,
        recipient: recipientAddress.trim(),
        attestor: attestorAddress.trim(),
        polygon_hash: hash,
        name: name.trim(),
      });
      const { result } = await tx.signAndSend();
      const onChainId = String(result);

      await registerProjectDetails({
        onChainId,
        recipientAddress: recipientAddress.trim(),
        attestorAddress: attestorAddress.trim(),
        polygonHash: bytesToHex(hash),
        polygonGeoJson: polygon,
      });

      setProjectId(onChainId);
      setStatus('success');
      showToast('success', 'Project registered on-chain.');
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMessage(message);
      setStatus('error');
      showToast('error', message);
    }
  }

  if (status === 'success' && projectId !== null) {
    return (
      <div className="max-w-md rounded-lg border border-green-200 bg-green-50 p-6">
        <p className="font-medium text-green-800">Project registered!</p>
        <p className="mt-1 text-sm text-green-700">
          Project #{projectId} is now awaiting admin approval before donors can fund it.
        </p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="max-w-md rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-600">Connect your wallet to register a project.</p>
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
    <form onSubmit={(event) => void handleSubmit(event)} className="max-w-md space-y-6">
      <label className="block">
        <span className="text-sm font-medium">Project name</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Recipient address</span>
        <input
          type="text"
          value={recipientAddress}
          onChange={(event) => setRecipientAddress(event.target.value)}
          placeholder="G..."
          required
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-gray-500">
          Where released tranches are paid out.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Attestor address</span>
        <input
          type="text"
          value={attestorAddress}
          onChange={(event) => setAttestorAddress(event.target.value)}
          placeholder="G..."
          required
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-gray-500">
          The backend&apos;s attestor key — see the docs for the semi-trusted-attestor design.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Plot boundary (GeoJSON)</span>
        <input
          type="file"
          accept=".json,.geojson,application/json,application/geo+json"
          onChange={handleFileChange}
          required
          className="mt-2 w-full text-sm"
        />
        <span className="mt-1 block text-xs text-gray-500">
          A Polygon or MultiPolygon geometry — draw one at geojson.io and download it.
        </span>
        {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
      </label>

      {polygon && (
        <div>
          <PolygonMap geometry={polygon} />
        </div>
      )}

      {status === 'error' && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Confirm in your wallet…' : 'Register project'}
      </button>
    </form>
  );
}
