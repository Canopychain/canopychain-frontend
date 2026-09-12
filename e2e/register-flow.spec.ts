import { expect, test } from '@playwright/test';

/**
 * Navigation-level coverage of the operator entry point that doesn't
 * require a wallet extension — same rationale as donor-flow.spec.ts:
 * runnable in CI with just `npm run dev`, no backend, contracts, or
 * Freighter needed. Everything up to the wallet prompt is testable this
 * way; actually submitting a registration needs a connected wallet and
 * belongs in the Freighter-gated suite alongside wallet-flow.spec.ts.
 */
test.describe('registration page (no wallet extension required)', () => {
  test('register page loads and prompts wallet connection before the form', async ({ page }) => {
    await page.goto('/register');

    await expect(
      page.getByRole('heading', { name: /register a reforestation project/i }),
    ).toBeVisible();

    // Scoped to <main>: the header also renders its own "Connect Wallet"
    // button whenever no wallet is connected, so an unscoped lookup would
    // match both it and the form's own prompt.
    const main = page.getByRole('main');

    // No wallet connected in this suite, so the form itself is replaced by
    // a connect prompt — the same pattern as the fund page in
    // donor-flow.spec.ts.
    await expect(main.getByText(/connect your wallet to register a project/i)).toBeVisible();
    await expect(main.getByRole('button', { name: /connect wallet/i })).toBeVisible();

    // The form's fields shouldn't be reachable until a wallet is connected.
    await expect(main.getByLabel(/project name/i)).not.toBeVisible();
  });
});
