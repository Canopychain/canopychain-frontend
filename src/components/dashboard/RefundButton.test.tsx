import { Ok } from '@stellar/stellar-sdk/contract';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RefundButton } from './RefundButton';

const DONOR_ADDRESS = 'G' + 'D'.repeat(55);

const mockShowToast = vi.fn();

vi.mock('@/components/wallet/WalletProvider', () => ({
  useWallet: () => ({
    address: DONOR_ADDRESS,
    connecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    signTransaction: vi.fn(),
    signMessage: vi.fn(),
  }),
}));

vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockRefund = vi.fn();

vi.mock('@/lib/milestoneVaultClient', () => ({
  getMilestoneVaultClient: vi.fn(async () => ({
    refund: mockRefund,
  })),
}));

describe('RefundButton', () => {
  beforeEach(() => {
    mockRefund.mockReset();
    mockShowToast.mockReset();
  });

  it('claims the refund and reports the refunded amount', async () => {
    mockRefund.mockResolvedValue({
      signAndSend: vi.fn().mockResolvedValue({ result: new Ok(250_000_000n) }),
    });
    const onRefunded = vi.fn();

    const user = userEvent.setup();
    render(<RefundButton projectOnChainId="7" onRefunded={onRefunded} />);
    await user.click(screen.getByRole('button', { name: /claim refund/i }));

    expect(mockRefund).toHaveBeenCalledWith({ project_id: 7n, donor: DONOR_ADDRESS });
    expect(mockShowToast).toHaveBeenCalledWith('success', expect.stringMatching(/^Refunded 25\b/));
    expect(onRefunded).toHaveBeenCalled();
  });

  it('shows an error toast when the refund call rejects', async () => {
    mockRefund.mockRejectedValue(new Error('simulation failed'));
    const onRefunded = vi.fn();

    const user = userEvent.setup();
    render(<RefundButton projectOnChainId="7" onRefunded={onRefunded} />);
    await user.click(screen.getByRole('button', { name: /claim refund/i }));

    expect(mockShowToast).toHaveBeenCalledWith('error', 'simulation failed');
    expect(onRefunded).not.toHaveBeenCalled();
  });
});
