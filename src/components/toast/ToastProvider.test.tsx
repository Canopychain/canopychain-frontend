import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './ToastProvider';

const DEFAULT_TOAST_DURATION_MS = 5000;
const ERROR_TOAST_DURATION_MS = 10000;

function ToastTrigger({ type }: { type: 'success' | 'error' | 'info' }) {
  const { showToast } = useToast();

  return <button onClick={() => showToast(type, `${type} message`)}>Show {type}</button>;
}

function renderToastTrigger(type: 'success' | 'error' | 'info') {
  return render(
    <ToastProvider>
      <ToastTrigger type={type} />
    </ToastProvider>,
  );
}

describe('ToastProvider', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows a toast', async () => {
    const user = userEvent.setup();
    renderToastTrigger('success');

    await user.click(screen.getByRole('button', { name: /show success/i }));

    expect(screen.getByRole('status')).toHaveTextContent('success message');
    expect(screen.getByRole('button', { name: /dismiss notification/i })).toBeInTheDocument();
  });

  it('dismisses a toast immediately', async () => {
    const user = userEvent.setup();
    renderToastTrigger('info');

    await user.click(screen.getByRole('button', { name: /show info/i }));
    await user.click(screen.getByRole('button', { name: /dismiss notification/i }));

    expect(screen.queryByText('info message')).not.toBeInTheDocument();
  });

  it.each(['success', 'info'] as const)('removes a %s toast after the normal timeout', (type) => {
    vi.useFakeTimers();
    renderToastTrigger(type);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`show ${type}`, 'i') }));

    act(() => vi.advanceTimersByTime(DEFAULT_TOAST_DURATION_MS - 1));
    expect(screen.getByText(`${type} message`)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText(`${type} message`)).not.toBeInTheDocument();
  });

  it('keeps an error toast longer, then removes it after its timeout', () => {
    vi.useFakeTimers();
    renderToastTrigger('error');
    fireEvent.click(screen.getByRole('button', { name: /show error/i }));

    act(() => vi.advanceTimersByTime(DEFAULT_TOAST_DURATION_MS));
    expect(screen.getByRole('alert')).toHaveTextContent('error message');

    act(() => vi.advanceTimersByTime(ERROR_TOAST_DURATION_MS - DEFAULT_TOAST_DURATION_MS));
    expect(screen.queryByText('error message')).not.toBeInTheDocument();
  });
});
