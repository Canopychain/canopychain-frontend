'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/toast/ToastProvider';
import { useWallet } from '@/components/wallet/WalletProvider';
import { listPendingProjects, rejectProject, type PendingProject } from '@/lib/adminApi';
import { getProjectRegistryClient } from '@/lib/projectRegistryClient';

export default function AdminPage() {
  const { address, connect, signMessage, signTransaction } = useWallet();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<PendingProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      setProjects(await listPendingProjects(address, signMessage));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load pending projects — are you connected as the configured admin address?',
      );
    } finally {
      setLoading(false);
    }
  }, [address, signMessage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleApprove(project: PendingProject): Promise<void> {
    if (!address) return;
    setBusyId(project.id);
    setError(null);
    try {
      // On-chain only: there's no off-chain "approved" review status to
      // update separately — `approved` on the project row is just a
      // mirror of this same call's event, picked up by the indexer. The
      // project stays in this pending list until that happens; removing
      // it here optimistically avoids a confusing "approve again" retry.
      const client = await getProjectRegistryClient(address, signTransaction);
      const tx = await client.approve_project({ project_id: BigInt(project.onChainId) });
      await tx.signAndSend();

      setProjects((current) => current.filter((p) => p.id !== project.id));
      showToast('success', `Approved "${project.name}" on-chain.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      showToast('error', message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(project: PendingProject): Promise<void> {
    if (!address) return;
    setBusyId(project.id);
    setError(null);
    try {
      await rejectProject(address, signMessage, project.id);
      setProjects((current) => current.filter((p) => p.id !== project.id));
      showToast('success', `Rejected "${project.name}".`);
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
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-2 max-w-xl text-sm text-gray-600">
          Review pending projects. Only the wallet configured as the platform&apos;s{' '}
          <code className="mx-1 rounded bg-gray-100 px-1">ADMIN_ADDRESS</code>
          can act here — approving calls the on-chain registry directly; rejecting is
          backend-only, since there&apos;s no on-chain &quot;reject&quot;.
        </p>
        <Link href="/admin/projects" className="mt-2 inline-block text-sm underline">
          View all projects (oversight) →
        </Link>

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
          <p className="mt-8 text-gray-600">No pending projects.</p>
        )}

        {address && !loading && projects.length > 0 && (
          <ul className="mt-8 space-y-4">
            {projects.map((project) => (
              <li key={project.id} className="rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">{project.name}</h2>
                    <p className="mt-2 font-mono text-xs break-all text-gray-400">
                      Operator {project.operatorAddress}
                    </p>
                    {project.recipientAddress && (
                      <p className="mt-1 font-mono text-xs break-all text-gray-400">
                        Recipient {project.recipientAddress}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApprove(project)}
                      disabled={busyId === project.id}
                      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {busyId === project.id ? 'Working…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(project)}
                      disabled={busyId === project.id}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
