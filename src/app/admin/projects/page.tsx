'use client';

import { useCallback, useEffect, useState } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/toast/ToastProvider';
import { useWallet } from '@/components/wallet/WalletProvider';
import { listAllProjects, type PendingProject } from '@/lib/adminApi';
import { getMilestoneVaultClient } from '@/lib/milestoneVaultClient';

export default function ProjectOversightPage() {
  const { address, connect, signMessage, signTransaction } = useWallet();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<PendingProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [attestorDrafts, setAttestorDrafts] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      setProjects(await listAllProjects(address, signMessage));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load projects — are you connected as the configured admin address?',
      );
    } finally {
      setLoading(false);
    }
  }, [address, signMessage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleRotateAttestor(project: PendingProject): Promise<void> {
    if (!address) return;
    const newAttestor = (attestorDrafts[project.id] ?? '').trim();
    if (!newAttestor) return;

    setBusyId(project.id);
    setError(null);
    try {
      const client = await getMilestoneVaultClient(address, signTransaction);
      const tx = await client.set_attestor({
        project_id: BigInt(project.onChainId),
        new_attestor: newAttestor,
      });
      await tx.signAndSend();

      setProjects((current) =>
        current.map((p) => (p.id === project.id ? { ...p, attestorAddress: newAttestor } : p)),
      );
      setAttestorDrafts((current) => ({ ...current, [project.id]: '' }));
      showToast('success', `Attestor rotated for "${project.name}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      showToast('error', message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(project: PendingProject): Promise<void> {
    if (!address) return;
    setBusyId(project.id);
    setError(null);
    try {
      const client = await getMilestoneVaultClient(address, signTransaction);
      const tx = await client.cancel_project({ project_id: BigInt(project.onChainId) });
      await tx.signAndSend();

      // The backend's own `cancelled` flag is only ever mirrored from
      // this same event once the indexer processes it — updated
      // optimistically here so the panel doesn't look like nothing
      // happened until that catches up.
      setProjects((current) =>
        current.map((p) => (p.id === project.id ? { ...p, cancelled: true } : p)),
      );
      showToast('success', `Cancelled "${project.name}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      showToast('error', message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Header />
      <main className="px-6 py-16 sm:px-12">
        <h1 className="text-2xl font-bold">Project oversight</h1>
        <p className="mt-2 max-w-xl text-sm text-gray-600">
          Every registered project, regardless of status. Rotating an attestor replaces the key
          authorized to attest milestones for that project on milestone-vault; cancelling halts
          deposits and attestations and opens the project up for donor refunds.
        </p>

        {!address && (
          <div className="mt-8 rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-600">Connect the platform admin wallet.</p>
            <button
              type="button"
              onClick={() => void connect()}
              className="mt-4 rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {address && loading && <p className="mt-8 text-gray-500">Loading…</p>}

        {address && error && <p className="mt-8 text-red-600">{error}</p>}

        {address && !loading && !error && projects.length === 0 && (
          <p className="mt-8 text-gray-600">No projects registered yet.</p>
        )}

        {address && !loading && projects.length > 0 && (
          <ul className="mt-8 space-y-4">
            {projects.map((project) => (
              <li key={project.id} className="rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{project.name}</h2>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {project.cancelled ? 'Cancelled' : project.approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-xs break-all text-gray-400">
                      Attestor {project.attestorAddress ?? '—'}
                    </p>
                  </div>
                  {!project.cancelled && (
                    <button
                      type="button"
                      onClick={() => void handleCancel(project)}
                      disabled={busyId === project.id}
                      className="shrink-0 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === project.id ? 'Working…' : 'Cancel project'}
                    </button>
                  )}
                </div>

                {!project.cancelled && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={attestorDrafts[project.id] ?? ''}
                      onChange={(event) =>
                        setAttestorDrafts((current) => ({
                          ...current,
                          [project.id]: event.target.value,
                        }))
                      }
                      placeholder="New attestor address (G...)"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRotateAttestor(project)}
                      disabled={busyId === project.id || !(attestorDrafts[project.id] ?? '').trim()}
                      className="shrink-0 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Rotate attestor
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
