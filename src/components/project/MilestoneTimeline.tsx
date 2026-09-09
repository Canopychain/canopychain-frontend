import type { Milestone } from '@/lib/api';

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
 * discrete points (when the backend's satellite check confirms a
 * threshold and the attestor signs), so there's nothing to animate
 * between those events.
 */
export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return <p className="mt-8 text-gray-600">No milestone schedule configured yet.</p>;
  }

  const sorted = [...milestones].sort((a, b) => a.index - b.index);

  return (
    <ol className="mt-8 space-y-6">
      {sorted.map((milestone) => {
        const attested = milestone.status === 'ATTESTED';
        return (
          <li key={milestone.id} className="flex gap-4">
            <div
              className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                attested ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {milestone.index + 1}
            </div>
            <div>
              <p className="font-medium">
                {formatBps(milestone.thresholdBps)} forest-cover change &middot;{' '}
                {formatBps(milestone.payoutBps)} of funds
              </p>
              {attested ? (
                <p className="mt-1 text-sm text-gray-600">
                  Attested{milestone.attestedAt ? ` ${formatDate(milestone.attestedAt)}` : ''}
                  {milestone.payoutAmount ? ` — released ${milestone.payoutAmount}` : ''}
                </p>
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
