'use client';

import { useEffect, useState } from 'react';

import { getProject, type Milestone } from '@/lib/api';

// Attestation happens on the backend's own schedule (a satellite check
// crossing a threshold), not in response to anything the donor does — so
// a page left open needs to poll for it rather than wait for a manual
// reload. GFW's own data doesn't refresh faster than hours, so this only
// needs to catch up with the backend's DB, not the satellite itself.
const POLL_INTERVAL_MS = 15_000;

function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Renders a project's tranche-release schedule as a timeline, not a live
 * balance ticker — milestones only ever move from pending to attested at
 * discrete points, so there's nothing to animate between those events.
 * Starts from the server-rendered `initialMilestones` and polls the
 * project for updates afterward, so an attestation that lands while this
 * page is open still shows up without a manual reload.
 */
export function MilestoneTimeline({
  projectId,
  initialMilestones,
}: {
  projectId: string;
  initialMilestones: Milestone[];
}) {
  const [milestones, setMilestones] = useState(initialMilestones);

  useEffect(() => {
    const interval = setInterval(() => {
      getProject(projectId)
        .then((project) => {
          if (project) {
            setMilestones(project.milestones);
          }
        })
        .catch(() => {
          // A missed refresh isn't worth surfacing — the next poll retries.
        });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [projectId]);

  if (milestones.length === 0) {
    return <p className="mt-8 text-gray-600">No milestone schedule configured yet.</p>;
  }

  const sorted = [...milestones].sort((a, b) => a.index - b.index);
  const nextIndex = sorted.findIndex((milestone) => milestone.status === 'PENDING');

  return (
    <ol className="mt-8 space-y-6">
      {sorted.map((milestone, position) => {
        const attested = milestone.status === 'ATTESTED';
        const isNext = position === nextIndex;
        const progressPct =
          isNext && milestone.currentValueBps !== null
            ? Math.min(100, (milestone.currentValueBps / milestone.thresholdBps) * 100)
            : null;

        return (
          <li key={milestone.id} className="flex gap-4">
            <div
              className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                attested ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {milestone.index + 1}
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {formatBps(milestone.thresholdBps)} forest-cover change &middot;{' '}
                {formatBps(milestone.payoutBps)} of funds
              </p>
              {attested ? (
                <p className="mt-1 text-sm text-gray-600">
                  Attested{milestone.attestedAt ? ` ${formatDate(milestone.attestedAt)}` : ''}
                  {milestone.payoutAmount ? ` — released ${milestone.payoutAmount}` : ''}
                </p>
              ) : progressPct !== null ? (
                <div className="mt-2 max-w-xs">
                  <p className="text-sm text-gray-500">
                    {formatBps(milestone.currentValueBps ?? 0)} of {formatBps(milestone.thresholdBps)}{' '}
                    &middot; {progressPct.toFixed(0)}% of the way there
                  </p>
                  <div className="mt-1 h-2 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-500">Pending</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
