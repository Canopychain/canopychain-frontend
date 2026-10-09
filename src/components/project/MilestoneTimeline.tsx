'use client';

import { useEffect, useState } from 'react';

import { getProject, type Milestone, type NextMilestoneProgress } from '@/lib/api';
import { formatAmount } from '@/lib/format';

// Attestation happens on the backend's own schedule (a satellite check
// confirming a plot has held its retention floor long enough), not in
// response to anything the donor does — so a page left open needs to poll
// for it rather than wait for a manual reload. GFW's own data doesn't
// refresh faster than hours, so this only needs to catch up with the
// backend's DB, not the satellite itself.
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

/** Sustain periods are configured in seconds but read in months and days,
 * so they're shown in the largest unit that stays exact. */
function formatDuration(seconds: number): string {
  const days = Math.round(seconds / (24 * 60 * 60));
  if (days >= 365 && days % 365 === 0) {
    const years = days / 365;
    return years === 1 ? '1 year' : `${years} years`;
  }
  if (days >= 30 && days % 30 === 0) {
    const months = days / 30;
    return months === 1 ? '1 month' : `${months} months`;
  }
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * Renders a project's tranche-release schedule as a timeline, not a live
 * balance ticker — milestones only ever move from pending to attested at
 * discrete points, so there's nothing to animate between those events.
 * Starts from the server-rendered props and polls the project afterward,
 * so an attestation that lands while this page is open still shows up
 * without a manual reload.
 *
 * Each milestone is two conditions, not one: retention has to be at or
 * above the floor *and* has to have stayed there long enough. The next
 * pending milestone shows both, because a plot sitting at 99.5% for a week
 * and one sitting there for six months are in very different places.
 */
export function MilestoneTimeline({
  projectId,
  initialMilestones,
  initialProgress,
}: {
  projectId: string;
  initialMilestones: Milestone[];
  initialProgress: NextMilestoneProgress | null;
}) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    const interval = setInterval(() => {
      getProject(projectId)
        .then((project) => {
          if (project) {
            setMilestones(project.milestones);
            setProgress(project.nextMilestoneProgress);
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

  return (
    <ol className="mt-8 space-y-6">
      {sorted.map((milestone) => {
        const attested = milestone.status === 'ATTESTED';
        const isNext = !attested && progress?.index === milestone.index;
        const currentBps = isNext ? (progress?.currentRetentionBps ?? null) : null;
        const holding = currentBps !== null && currentBps >= milestone.retentionFloorBps;
        const timePct =
          isNext && progress
            ? Math.min(100, (progress.sustainedSeconds / progress.requiredSeconds) * 100)
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
                Hold {formatBps(milestone.retentionFloorBps)} of baseline forest for{' '}
                {formatDuration(milestone.sustainSeconds)} &middot;{' '}
                {formatBps(milestone.payoutBps)} of funds
              </p>

              {attested ? (
                <p className="mt-1 text-sm text-gray-600">
                  Attested{milestone.attestedAt ? ` ${formatDate(milestone.attestedAt)}` : ''}
                  {milestone.payoutAmount ? ` — released ${formatAmount(milestone.payoutAmount)}` : ''}
                </p>
              ) : isNext && progress ? (
                <div className="mt-2 max-w-sm">
                  {currentBps === null ? (
                    <p className="text-sm text-gray-500">
                      Awaiting the project&apos;s first satellite check.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">
                        {formatBps(currentBps)} standing &middot;{' '}
                        {holding
                          ? `holding for ${formatDuration(progress.sustainedSeconds)} of ${formatDuration(
                              progress.requiredSeconds,
                            )}`
                          : 'below the floor — the clock restarts once it recovers'}
                      </p>
                      {timePct !== null && (
                        <div className="mt-1 h-2 rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${holding ? 'bg-green-600' : 'bg-amber-500'}`}
                            style={{ width: `${Math.max(timePct, holding ? 2 : 0)}%` }}
                          />
                        </div>
                      )}
                      {progress.ready && (
                        <p className="mt-1 text-sm text-green-700">
                          Earned — awaiting on-chain attestation.
                        </p>
                      )}
                    </>
                  )}
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
