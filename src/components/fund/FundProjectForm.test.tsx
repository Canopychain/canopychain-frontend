import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FundProjectForm } from './FundProjectForm';

const DONOR_ADDRESS = 'G' + 'D'.repeat(55);
const RECIPIENT_ADDRESS = 'G' + 'R'.repeat(55);
const ATTESTOR_ADDRESS = 'G' + 'T'.repeat(55);
const NATIVE_TOKEN_ADDRESS = 'CNATIVEFAKE';
const PROJECT_ON_CHAIN_ID = '7';

const mockSignTransaction = vi.fn();
const mockShowToast = vi.fn();

vi.mock('@/components/wallet/WalletProvider', () => ({
  useWallet: () => ({
    address: DONOR_ADDRESS,
    connecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    signTransaction: mockSignTransaction,
    signMessage: vi.fn(),
  }),
}));

vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/lib/stellar', () => ({
  getNativeAssetAddress: () => NATIVE_TOKEN_ADDRESS,
}));

const mockDeposit = vi.fn();

vi.mock('@/lib/milestoneVaultClient', () => ({
  getMilestoneVaultClient: vi.fn(async () => ({
    deposit: mockDeposit,
  })),
}));

function renderForm() {
  return render(
    <FundProjectForm
      projectOnChainId={PROJECT_ON_CHAIN_ID}
      recipientAddress={RECIPIENT_ADDRESS}
      attestorAddress={ATTESTOR_ADDRESS}
    />,
  );
}

describe('FundProjectForm', () => {
  beforeEach(() => {
    mockDeposit.mockReset();
    mockShowToast.mockReset();
  });

  it('disables submit until a valid amount is entered', async () => {
    const user = userEvent.setup();
    renderForm();

    const submit = screen.getByRole('button', { name: /review & sign/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText('100'), '100');

    expect(submit).not.toBeDisabled();
  });

  it('requires a token address once "Custom asset" is selected', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText('100'), '100');
    await user.click(screen.getByLabelText(/custom asset/i));

    const submit = screen.getByRole('button', { name: /review & sign/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/token contract address/i), 'CTOKENADDRESS');
    expect(submit).not.toBeDisabled();
  });

  it('submits a contract-shaped deposit and shows a success toast', async () => {
    mockDeposit.mockResolvedValue({
      signAndSend: vi.fn().mockResolvedValue({ result: 1_000_000_000n }),
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText('100'), '100');
    await user.click(screen.getByRole('button', { name: /review & sign/i }));

    expect(await screen.findByText(/deposit confirmed/i)).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith('success', expect.stringMatching(/confirmed/i));

    // 100 * 10^7, milestone-vault's `deposit` has no rate/duration to derive.
    expect(mockDeposit).toHaveBeenCalledWith({
      donor: DONOR_ADDRESS,
      project_id: 7n,
      recipient: RECIPIENT_ADDRESS,
      attestor: ATTESTOR_ADDRESS,
      token: NATIVE_TOKEN_ADDRESS,
      amount: 1_000_000_000n,
    });
  });

  it('shows an error toast when the deposit call rejects', async () => {
    mockDeposit.mockRejectedValue(new Error('simulation failed'));

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText('100'), '100');
    await user.click(screen.getByRole('button', { name: /review & sign/i }));

    expect(await screen.findByText(/simulation failed/i)).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith('error', 'simulation failed');
  });
});
