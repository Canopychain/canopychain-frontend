import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OperatorRegistrationForm } from './OperatorRegistrationForm';

const OPERATOR_ADDRESS = 'G' + 'O'.repeat(55);
const RECIPIENT_ADDRESS = 'G' + 'R'.repeat(55);
const ATTESTOR_ADDRESS = 'G' + 'T'.repeat(55);

const VALID_POLYGON_GEOJSON = JSON.stringify({
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
  ],
});

const mockShowToast = vi.fn();

vi.mock('@/components/wallet/WalletProvider', () => ({
  useWallet: () => ({
    address: OPERATOR_ADDRESS,
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

vi.mock('@/components/project/PolygonMap', () => ({
  PolygonMap: () => <div data-testid="polygon-map" />,
}));

const mockRegister = vi.fn();

vi.mock('@/lib/projectRegistryClient', () => ({
  getProjectRegistryClient: vi.fn(async () => ({
    register: mockRegister,
  })),
}));

const mockRegisterProjectDetails = vi.fn();

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    registerProjectDetails: mockRegisterProjectDetails,
  };
});

function renderForm() {
  return render(<OperatorRegistrationForm />);
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/project name/i), 'Test Project');
  await user.type(screen.getByLabelText(/recipient address/i), RECIPIENT_ADDRESS);
  await user.type(screen.getByLabelText(/attestor address/i), ATTESTOR_ADDRESS);
}

function makeFile(contents: string, name = 'plot.geojson') {
  return new File([contents], name, { type: 'application/json' });
}

describe('OperatorRegistrationForm', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockRegisterProjectDetails.mockReset();
    mockShowToast.mockReset();
  });

  it('shows an error and keeps submit disabled when the file is not valid JSON', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.upload(screen.getByLabelText(/plot boundary/i), makeFile('not { valid json'));

    expect(await screen.findByText('That file is not valid JSON.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register project/i })).toBeDisabled();
  });

  it('shows an error and keeps submit disabled when the geometry is not a polygon', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.upload(
      screen.getByLabelText(/plot boundary/i),
      makeFile(JSON.stringify({ type: 'Point', coordinates: [0, 0] })),
    );

    expect(
      await screen.findByText('Only Polygon and MultiPolygon geometries are supported.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register project/i })).toBeDisabled();
  });

  it('registers on-chain then posts details to the backend, showing success', async () => {
    mockRegister.mockResolvedValue({
      signAndSend: vi.fn().mockResolvedValue({ result: 7 }),
    });
    mockRegisterProjectDetails.mockResolvedValue({});

    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.upload(screen.getByLabelText(/plot boundary/i), makeFile(VALID_POLYGON_GEOJSON));
    await user.click(screen.getByRole('button', { name: /register project/i }));

    expect(await screen.findByText(/project registered/i)).toBeInTheDocument();
    expect(screen.getByText(/project #7/i)).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith('success', expect.stringMatching(/registered/i));

    expect(mockRegister).toHaveBeenCalledWith({
      operator: OPERATOR_ADDRESS,
      recipient: RECIPIENT_ADDRESS,
      attestor: ATTESTOR_ADDRESS,
      polygon_hash: expect.any(Uint8Array),
      name: 'Test Project',
    });

    expect(mockRegisterProjectDetails).toHaveBeenCalledWith({
      onChainId: '7',
      recipientAddress: RECIPIENT_ADDRESS,
      attestorAddress: ATTESTOR_ADDRESS,
      polygonHash: expect.stringMatching(/^[0-9a-f]+$/),
      polygonGeoJson: JSON.parse(VALID_POLYGON_GEOJSON),
    });
  });

  it('shows a backend error after the on-chain call already succeeded', async () => {
    const mockSignAndSend = vi.fn().mockResolvedValue({ result: 7 });
    mockRegister.mockResolvedValue({ signAndSend: mockSignAndSend });
    mockRegisterProjectDetails.mockRejectedValue(new Error('Failed to submit project details.'));

    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.upload(screen.getByLabelText(/plot boundary/i), makeFile(VALID_POLYGON_GEOJSON));
    await user.click(screen.getByRole('button', { name: /register project/i }));

    expect(await screen.findByText('Failed to submit project details.')).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to submit project details.');

    // The on-chain call had already gone through by the time the backend rejected.
    expect(mockSignAndSend).toHaveBeenCalled();
    expect(mockRegisterProjectDetails).toHaveBeenCalled();
    expect(screen.queryByText(/project registered/i)).not.toBeInTheDocument();
  });
});
