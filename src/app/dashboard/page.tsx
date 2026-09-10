'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useWallet } from '@/components/wallet/WalletProvider';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getDonations, type Donation } from '@/lib/api';
import { formatAmount } from '@/lib/format';

export default function DashboardPage() {
  const { address, connect } = useWallet();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!address) {
      setDonations([]);
      return;
    }

    setLoading(true);
    setLoadError(false);
    getDonations(address)
      .then(setDonations)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [address]);

  const totalDonated = donations.reduce((sum, d) => sum + BigInt(d.amount), 0n);
  const fundedProjectCount = new Set(donations.map((d) => d.project.id)).size;

  return (
    <>
      <Header />
      <main className="px-6 py-16 sm:px-12">
        <h1 className="text-2xl font-bold">Your donations</h1>

        {!address && (
          <div className="mt-8 rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-600">Connect your wallet to see your funded projects.</p>
            <button
              type="button"
              onClick={() => void connect()}
              className="mt-4 rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {address && loading && <p className="mt-8 text-gray-500">Loading your donations…</p>}

        {address && !loading && loadError && (
          <p className="mt-8 text-red-600">
            Couldn&apos;t reach the Canopychain API. Is the backend running?
          </p>
        )}

        {address && !loading && !loadError && donations.length === 0 && (
          <p className="mt-8 text-gray-600">
            You haven&apos;t funded any projects yet.{' '}
            <Link href="/projects" className="underline">
              Explore Projects
            </Link>
            .
          </p>
        )}

        {address && !loading && !loadError && donations.length > 0 && (
          <>
            <dl className="mt-8 grid grid-cols-2 gap-6 sm:w-fit sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Total donated</dt>
                <dd className="text-lg font-semibold">{formatAmount(totalDonated.toString())}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Projects funded</dt>
                <dd className="text-lg font-semibold">{fundedProjectCount}</dd>
              </div>
            </dl>

            <ul className="mt-8 space-y-4">
              {donations.map((donation) => (
                <li key={donation.id} className="rounded-lg border border-gray-200 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link
                        href={`/projects/${donation.project.id}`}
                        className="font-semibold hover:underline"
                      >
                        {donation.project.name}
                      </Link>
                      <p className="mt-1 text-sm text-gray-500">
                        {donation.project.cancelled ? 'Cancelled' : 'Active'} · You gave{' '}
                        {formatAmount(donation.amount)} · Project total{' '}
                        {formatAmount(donation.project.totalDeposited)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
