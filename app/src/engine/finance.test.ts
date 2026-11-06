import { describe, expect, it } from 'vitest';
import {
  bandFor,
  futureValue,
  growthSeries,
  isUnrealistic,
  loanCost,
  yearlyFromPeriodic,
} from './finance';

describe('futureValue', () => {
  it('RM50/month at 5% for 10 years (SDS 5.7)', () => {
    const r = futureValue({ monthly: 50, yearlyRate: 0.05, months: 120 });
    expect(r.value).toBe(7764.11);
    expect(r.contributed).toBe(6000);
    expect(r.growth).toBe(1764.11);
  });
  it('19 to 30 and 19 to 55', () => {
    expect(futureValue({ monthly: 50, yearlyRate: 0.05, months: 132 }).value).toBe(8775.28);
    const r = futureValue({ monthly: 50, yearlyRate: 0.05, months: 432 });
    expect(r.value).toBe(60324.8);
    expect(r.growth).toBe(Math.round((r.value - r.contributed) * 100) / 100);
  });
  it('0% rate: no division by zero, value equals contributed', () => {
    const r = futureValue({ monthly: 50, yearlyRate: 0, months: 120, initial: 100 });
    expect(r.value).toBe(6100);
    expect(r.contributed).toBe(6100);
    expect(r.growth).toBe(0);
  });
  it('0 months returns the initial amount', () => {
    const r = futureValue({ monthly: 50, yearlyRate: 0.05, months: 0, initial: 250 });
    expect(r).toEqual({ value: 250, contributed: 250, growth: 0 });
  });
  it('throws RangeError on bad input', () => {
    expect(() => futureValue({ monthly: -1, yearlyRate: 0.05, months: 12 })).toThrow(RangeError);
    expect(() => futureValue({ monthly: NaN, yearlyRate: 0.05, months: 12 })).toThrow(RangeError);
    expect(() => futureValue({ monthly: 50, yearlyRate: Infinity, months: 12 })).toThrow(RangeError);
    expect(() => futureValue({ monthly: 50, yearlyRate: -0.01, months: 12 })).toThrow(RangeError);
    expect(() => futureValue({ monthly: 50, yearlyRate: 0.05, months: -1 })).toThrow(RangeError);
    expect(() => futureValue({ monthly: 50, yearlyRate: 0.05, months: 1.5 })).toThrow(RangeError);
    expect(() => futureValue({ monthly: 50, yearlyRate: 0.05, months: 12, initial: -5 })).toThrow(RangeError);
  });
});

describe('growthSeries', () => {
  it('one point per year from 19 to 30', () => {
    const s = growthSeries({ monthly: 50, yearlyRate: 0.05 }, 19, 30);
    expect(s).toHaveLength(12);
    expect(s[0]).toEqual({ age: 19, contributed: 0, value: 0 });
    expect(s[11]).toEqual({ age: 30, contributed: 6600, value: 8775.28 });
  });
  it('throws when endAge is before startAge', () => {
    expect(() => growthSeries({ monthly: 50, yearlyRate: 0.05 }, 30, 19)).toThrow(RangeError);
  });
});

describe('yearlyFromPeriodic', () => {
  it('10% a month is about 213.8% a year', () => {
    expect(yearlyFromPeriodic(0.1, 'bulan')).toBeCloseTo(2.1384, 4);
  });
  it('30% a week is far above the unrealistic line', () => {
    const y = yearlyFromPeriodic(0.3, 'minggu');
    expect(y).toBeGreaterThan(0.2);
    expect(isUnrealistic(y)).toBe(true);
  });
  it('tahun is identity; hari uses 365', () => {
    expect(yearlyFromPeriodic(0.04, 'tahun')).toBeCloseTo(0.04, 12);
    expect(yearlyFromPeriodic(0.001, 'hari')).toBeCloseTo(1.001 ** 365 - 1, 12);
  });
  it('throws on bad rate', () => {
    expect(() => yearlyFromPeriodic(-0.1, 'bulan')).toThrow(RangeError);
    expect(() => yearlyFromPeriodic(NaN, 'bulan')).toThrow(RangeError);
  });
});

describe('isUnrealistic and bandFor', () => {
  it('4% is fine, exactly 20% is not flagged, above is', () => {
    expect(isUnrealistic(0.04)).toBe(false);
    expect(isUnrealistic(0.2)).toBe(false);
    expect(isUnrealistic(0.2001)).toBe(true);
  });
  it('bandFor returns a band key or atas', () => {
    expect(bandFor(0.005)).toBe('simpanan');
    expect(bandFor(0.03)).toBe('simpananTetap');
    expect(bandFor(0.1)).toBe('unitAmanah');
    expect(bandFor(5)).toBe('atas');
  });
});

describe('loanCost', () => {
  it('flat 18% over 12 months on RM1,000', () => {
    const r = loanCost({ amount: 1000, flatRate: 0.18, months: 12 });
    expect(r.total).toBe(1180);
    expect(r.instalment).toBe(98.33);
    expect(r.cost).toBe(180);
    expect(Math.abs(r.effectiveYearly - 0.317)).toBeLessThan(0.001);
  });
  it('fee variant', () => {
    const r = loanCost({ amount: 1000, fee: 100, months: 10 });
    expect(r.total).toBe(1100);
    expect(r.instalment).toBe(110);
    expect(r.cost).toBe(100);
    expect(r.effectiveYearly).toBeGreaterThan(0);
  });
  it('zero cost gives zero effective rate', () => {
    expect(loanCost({ amount: 1000, flatRate: 0, months: 12 }).effectiveYearly).toBe(0);
    expect(loanCost({ amount: 1000, fee: 0, months: 12 }).cost).toBe(0);
  });
  it('throws RangeError on bad input', () => {
    expect(() => loanCost({ amount: 1000, flatRate: 0.1, fee: 50, months: 12 })).toThrow(RangeError);
    expect(() => loanCost({ amount: 1000, months: 12 })).toThrow(RangeError);
    expect(() => loanCost({ amount: -1, flatRate: 0.1, months: 12 })).toThrow(RangeError);
    expect(() => loanCost({ amount: 1000, flatRate: NaN, months: 12 })).toThrow(RangeError);
    expect(() => loanCost({ amount: 1000, fee: Infinity, months: 12 })).toThrow(RangeError);
    expect(() => loanCost({ amount: 1000, flatRate: 0.1, months: 0 })).toThrow(RangeError);
    expect(() => loanCost({ amount: 1000, flatRate: 0.1, months: 2.5 })).toThrow(RangeError);
  });
});
