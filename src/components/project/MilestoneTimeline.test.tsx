import { act } from 'react';

import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Milestone } from '@/lib/api';

import { MilestoneTimeline } from './MilestoneTimeline';

const mockGetProject = vi.fn();

vi.mock('@/lib/api', () => ({
  getProject: (...args: unknown[]) => mockGetProject(...args),
}));

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'm-0',
    index: 0,
    thresholdBps: 1000,
    payoutBps: 2500,
    status: 'PENDING',
    attestedAt: null,
    payoutAmount: null,
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
    render(<MilestoneTimeline projectId="1" initialMilestones={[]} />);

    expect(screen.getByText('No milestone schedule configured yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('formats threshold and payout basis points as percentages', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[makeMilestone({ thresholdBps: 250, payoutBps: 5000 })]}
      />,
    );

    expect(screen.getByText(/2\.50% forest-cover change/)).toBeInTheDocument();
    expect(screen.getByText(/50\.00% of funds/)).toBeInTheDocument();
  });

  it('sorts milestones by index regardless of input order', () => {
    render(
      <MilestoneTimeline
        projectId="1"
        initialMilestones={[
          makeMilestone({ id: 'm-2', index: 2, thresholdBps: 300, payoutBps: 300 }),
          makeMilestone({ id: 'm-0', index: 0, thresholdBps: 100, payoutBps: 100 }),
          makeMilestone({ id: 'm-1', index: 1, thresholdBps: 200, payoutBps: 200 }),
        ]}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('1.00% forest-cover change');
    expect(items[1]).toHaveTextContent('2.00% forest-cover change');
    expect(items[2]).toHaveTextContent('3.00% forest-cover change');
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
            payoutAmount: '500',
          }),
          makeMilestone({ id: 'm-1', index: 1, status: 'PENDING' }),
        ]}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText(/^Attested/)).toBeInTheDocument();
    expect(within(items[0]).getByText(/released 500/i)).toBeInTheDocument();
    expect(within(items[1]).getByText('Pending')).toBeInTheDocument();
  });

  it('polls for updates and re-renders with the latest milestones', async () => {
    vi.useFakeTimers();

    mockGetProject.mockResolvedValue({
      milestones: [
        makeMilestone({ id: 'm-0', index: 0, status: 'ATTESTED', thresholdBps: 500, payoutBps: 500 }),
      ],
    });

    render(
      <MilestoneTimeline
        projectId="42"
        initialMilestones={[makeMilestone({ id: 'm-0', index: 0, status: 'PENDING' })]}
      />,
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(mockGetProject).toHaveBeenCalledWith('42');
    expect(screen.getByText(/^Attested/)).toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });
});
