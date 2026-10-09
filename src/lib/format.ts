// Every Stellar Asset Contract token (native XLM included) uses 7 decimal
// places — fixed by the protocol, not something per-asset to look up.
const TOKEN_DECIMALS = 7;

/** Formats a raw i128 amount string (as returned by the backend) into a
 * human-readable decimal, with a unit suffix. Safe for typical
 * donation-sized amounts; not intended for values anywhere near
 * Number.MAX_SAFE_INTEGER.
 *
 * Defaults to "XLM" because every project funded through this app so far
 * is — but `deposit` accepts any Stellar Asset Contract token, and
 * nothing in the API currently reports which one a given project
 * actually holds (see `Project` in `./api.ts`). Pass `unit: ''` at a
 * call site once that's exposed, rather than let this default silently
 * mislabel a non-native deposit. */
export function formatAmount(raw: string, unit = 'XLM'): string {
  const decimal = (Number(BigInt(raw)) / 10 ** TOKEN_DECIMALS).toLocaleString(undefined, {
    maximumFractionDigits: 7,
  });
  return unit ? `${decimal} ${unit}` : decimal;
}
