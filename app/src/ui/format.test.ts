import { describe, expect, it } from 'vitest';
import { formatBank, formatMoney, formatSignedBank, formatSignedMoney } from './format';

describe('formatMoney', () => {
  it('whole ringgit: thousands separator, no decimals', () => {
    expect(formatMoney(2140)).toBe('RM2,140');
    expect(formatMoney(0)).toBe('RM0');
    expect(formatMoney(1940)).toBe('RM1,940');
  });
  it('sen when not whole, always two decimals', () => {
    expect(formatMoney(0.15)).toBe('RM0.15');
    expect(formatMoney(1234.5)).toBe('RM1,234.50');
    expect(formatMoney(100.004)).toBe('RM100');
  });
  it('negatives put the sign before RM', () => {
    expect(formatMoney(-6)).toBe('-RM6');
    expect(formatMoney(-0.5)).toBe('-RM0.50');
  });
  it('signed: + for gains, - for losses', () => {
    expect(formatSignedMoney(400)).toBe('+RM400');
    expect(formatSignedMoney(0.15)).toBe('+RM0.15');
    expect(formatSignedMoney(-6)).toBe('-RM6');
  });
});

describe('formatBank (BankKu, Review Focus 2)', () => {
  it('always shows the sen', () => {
    expect(formatBank(0)).toBe('RM0.00');
    expect(formatBank(-0)).toBe('RM0.00');
    expect(formatBank(1234.5)).toBe('RM1,234.50');
    expect(formatBank(-10)).toBe('-RM10.00');
    expect(formatSignedBank(400)).toBe('+RM400.00');
    expect(formatSignedBank(-2.9)).toBe('-RM2.90');
  });
});
