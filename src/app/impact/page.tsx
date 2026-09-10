'use client';

import { useCallback, useEffect, useState } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getProject, getProjects } from '@/lib/api';
import { formatAmount } from '@/lib/format';

const POLL_INTERVAL_MS = 20_000;

type PlatformImpact = {
  totalDeposited: bigint;
  totalReleased: bigint;
  attestedMilestones: number;
  projectCount: number;
};

/**
 * There's no platform-wide aggregate endpoint on the backend — only
 * per-project stats (/projects/:id). This fetches the approved-projects
 * list and sums their own totalDeposited/totalReleased fields client-side
 * instead, which the backend already maintains directly from on-chain
 * events (no N+1 fetch needed, unlike a stat that only exists on each
 * project's own detail response).
 *
 * Attested-milestone counts aren't available on the list endpoint, so
 * this fetches each project's detail for that one number — the first
 * thing to replace with a real backend aggregate if the project count
 * ever gets large.
 */
async function loadPlatformImpact(): Promise<PlatformImpact> {
  const projects = await getProjects();

  let totalDeposited = 0n;
  let totalReleased = 0n;
  for (const project of projects) {
    totalDeposited += BigInt(project.totalDeposited);
    totalReleased += BigInt(project.totalReleased);
  }

  const profiles = await Promise.all(projects.map((project) => getProject(project.id)));
  const attestedMilestones = profiles.reduce(
    (sum, profile) => sum + (profile?.stats.milestonesAttested ?? 0),
    0,
  );

  return { totalDeposited, totalReleased, attestedMilestones, projectCount: projects.length };
}

export default function ImpactPage() {
  const [impact, setImpact] = useState<PlatformImpact | null>(null);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(() => {
    loadPlatformImpact()
      .then(setImpact)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    refresh();
    // Simulates "live" via polling — there's no websocket/SSE push from
    // the backend to actually stream updates.
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <>
      <Header />
      <main className="px-6 py-16 sm:px-12">
        <h1 className="text-2xl font-bold">Platform impact</h1>
        <p className="mt-2 text-sm text-gray-500">
          Updates automatically every {POLL_INTERVAL_MS / 1000} seconds.
        </p>

        {loadError && (
          <p className="mt-8 text-red-600">
            Couldn&apos;t reach the Canopychain API. Is the backend running?
          </p>
        )}

        {!loadError && !impact && <p className="mt-8 text-gray-500">Loading…</p>}

        {!loadError && impact && (
          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <dt className="text-sm text-gray-500">Total deposited</dt>
              <dd className="text-2xl font-bold">
                {formatAmount(impact.totalDeposited.toString())}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Released to operators</dt>
              <dd className="text-2xl font-bold">
                {formatAmount(impact.totalReleased.toString())}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Milestones attested</dt>
              <dd className="text-2xl font-bold">{impact.attestedMilestones}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Approved projects</dt>
              <dd className="text-2xl font-bold">{impact.projectCount}</dd>
            </div>
          </dl>
        )}
      </main>
      <Footer />
    </>
  );
}
