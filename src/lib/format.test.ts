import { describe, expect, it } from 'vitest';

import { formatAmount } from './format';

describe('formatAmount', () => {
  it('converts raw stroops to a decimal and labels it XLM by default', () => {
    expect(formatAmount('1000000000')).toBe('100 XLM');
  });

  it('keeps fractional amounts exact down to the 7-decimal stroop', () => {
    expect(formatAmount('1')).toBe('0.0000001 XLM');
  });

  it('adds thousands separators for large amounts', () => {
    expect(formatAmount('12345000000000')).toBe('1,234,500 XLM');
  });

  it('accepts a different unit for a non-native token', () => {
    expect(formatAmount('1000000000', 'USDC')).toBe('100 USDC');
  });

  // A project's token isn't exposed by the API yet, so a caller that
  // doesn't actually know what was deposited should say so by passing no
  // unit — not inherit the native-asset default and mislabel it.
  it('omits the unit entirely when passed an empty string', () => {
    expect(formatAmount('1000000000', '')).toBe('100');
  });
});
