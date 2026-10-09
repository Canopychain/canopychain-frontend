import { act } from 'react';

import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Milestone, NextMilestoneProgress } from '@/lib/api';

import { MilestoneTimeline } from './MilestoneTimeline';

const mockGetProject = vi.fn();

vi.mock('@/lib/api', () => ({
  getProject: (...args: unknown[]) => mockGetProject(...args),
}));

const DAY = 24 * 60 * 60;

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'm-0',
    index: 0,
    retentionFloorBps: 9900,
    sustainSeconds: 90 * DAY,
    payoutBps: 2500,
    status: 'PENDING',
    attestedAt: null,
    payoutAmount: null,
    ...overrides,
  };
}

function makeProgress(overrides: Partial<NextMilestoneProgress> = {}): NextMilestoneProgress {
  return {
    index: 0,
    retentionFloorBps: 9900,
    requiredSeconds: 90 * DAY,
    currentRetentionBps: 9950,
    sustainedSeconds: 45 * DAY,
    ready: false,
    ...overrides,
  };
}

describe('MilestoneTimeline', () => {
  beforeEach(() => {
    mockGetProject.mockReset();
    mockGetProject.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a message when there is no milestone schedule', () => {
    render(<MilestoneTimeline projectId="1" initialMilestones={[]} initialProgress={null} />);

    expect(screen.getByText('No milestone schedule configured yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('states both conditions a milestone has to meet', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[
          makeMilestone({ retentionFloorBps: 9500, sustainSeconds: 365 * DAY, payoutBps: 5000 }),
        ]}
        initialProgress={null}
      />,
    );

    expect(
      screen.getByText(/Hold 95\.00% of baseline forest for 1 year .* 50\.00% of funds/),
    ).toBeInTheDocument();
  });

  it('sorts milestones by index regardless of input order', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[
          makeMilestone({ id: 'm-2', index: 2, sustainSeconds: 365 * DAY }),
          makeMilestone({ id: 'm-0', index: 0, sustainSeconds: 30 * DAY }),
          makeMilestone({ id: 'm-1', index: 1, sustainSeconds: 90 * DAY }),
        ]}
        initialProgress={null}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('for 1 month');
    expect(items[1]).toHaveTextContent('for 3 months');
    expect(items[2]).toHaveTextContent('for 1 year');
  });

  it('distinguishes attested milestones from pending ones', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[
          makeMilestone({
            id: 'm-0',
            index: 0,
            status: 'ATTESTED',
            attestedAt: '2026-01-15T00:00:00.000Z',
            payoutAmount: '5000000000', // 500 XLM, in stroops
          }),
          makeMilestone({ id: 'm-1', index: 1, status: 'PENDING' }),
        ]}
        initialProgress={null}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText(/^Attested/)).toBeInTheDocument();
    expect(within(items[0]).getByText(/released 500 XLM/i)).toBeInTheDocument();
    expect(within(items[1]).getByText('Pending')).toBeInTheDocument();
  });

  // The two halves of a milestone fail independently, so each of the next
  // milestone's states gets its own assertion: holding and partway through,
  // holding long enough, and dropped below the floor.
  it('shows how far along the next milestone is while retention holds', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[makeMilestone(), makeMilestone({ id: 'm-1', index: 1 })]}
        initialProgress={makeProgress()}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(
      within(items[0]).getByText(/99\.50% standing .* holding for 45 days of 3 months/),
    ).toBeInTheDocument();
    // Only the next pending milestone gets a progress readout; the ones
    // behind it have nothing measured against them yet.
    expect(within(items[1]).getByText('Pending')).toBeInTheDocument();
  });

  it('says the clock restarts when retention is below the floor', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[makeMilestone()]}
        initialProgress={makeProgress({ currentRetentionBps: 9400, sustainedSeconds: 0 })}
      />,
    );

    expect(screen.getByText(/94\.00% standing .* below the floor/)).toBeInTheDocument();
    expect(screen.queryByText(/holding for/)).not.toBeInTheDocument();
  });

  it('flags a milestone that has been earned but not yet attested', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[makeMilestone()]}
        initialProgress={makeProgress({ sustainedSeconds: 90 * DAY, ready: true })}
      />,
    );

    expect(screen.getByText('Earned — awaiting on-chain attestation.')).toBeInTheDocument();
  });

  it('explains the gap before a project has been checked at all', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[makeMilestone()]}
        initialProgress={makeProgress({ currentRetentionBps: null, sustainedSeconds: 0 })}
      />,
    );

    expect(screen.getByText("Awaiting the project's first satellite check.")).toBeInTheDocument();
  });

  it('polls for updates and re-renders with the latest milestones', async () => {
    vi.useFakeTimers();

    mockGetProject.mockResolvedValue({
      milestones: [makeMilestone({ id: 'm-0', index: 0, status: 'ATTESTED' })],
      nextMilestoneProgress: null,
    });

    render(
      <MilestoneTimeline
        projectId="42"
        initialMilestones={[makeMilestone({ id: 'm-0', index: 0, status: 'PENDING' })]}
        initialProgress={makeProgress()}
      />,
    );

    expect(screen.getByText(/99\.50% standing/)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(mockGetProject).toHaveBeenCalledWith('42');
    expect(screen.getByText(/^Attested/)).toBeInTheDocument();
    expect(screen.queryByText(/standing/)).not.toBeInTheDocument();
  });
});
