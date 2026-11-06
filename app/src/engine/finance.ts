import { BALANCE } from './balance';
import { round2 } from './money';

/** Pure money maths for Kalkulator (D21, SDS 5.7). Rates are yearly decimals; money is rounded to the sen. */

export type Period = 'hari' | 'minggu' | 'bulan' | 'tahun';
export type BandKey = keyof typeof BALANCE.finance.bands;

export interface FutureValueInput {
  monthly: number;
  yearlyRate: number;
  months: number;
  initial?: number;
}

const PERIODS_PER_YEAR: Record<Period, number> = { hari: 365, minggu: 52, bulan: 12, tahun: 1 };

function requireNonNegative(name: string, n: number): void {
  if (!Number.isFinite(n) || n < 0) throw new RangeError(`${name} must be a finite number >= 0`);
}

function requireMonths(name: string, n: number, min: number): void {
  if (!Number.isInteger(n) || n < min) throw new RangeError(`${name} must be an integer >= ${min}`);
}

/**
 * Future value of a monthly top-up with monthly compounding.
 * FV = P0 x (1 + i)^n + PMT x ((1 + i)^n - 1) / i, i = yearlyRate / 12, n = months.
 * At i = 0: FV = P0 + PMT x n. contributed = P0 + PMT x n; growth = value - contributed.
 */
export function futureValue({ monthly, yearlyRate, months, initial = 0 }: FutureValueInput): {
  value: number;
  contributed: number;
  growth: number;
} {
  requireNonNegative('monthly', monthly);
  requireNonNegative('yearlyRate', yearlyRate);
  requireNonNegative('initial', initial);
  requireMonths('months', months, 0);
  const contributed = initial + monthly * months;
  const i = yearlyRate / 12;
  const value = i === 0 ? contributed : initial * (1 + i) ** months + (monthly * ((1 + i) ** months - 1)) / i;
  return { value: round2(value), contributed: round2(contributed), growth: round2(round2(value) - round2(contributed)) };
}

/**
 * One point per year from startAge to endAge inclusive, each with months = (age - startAge) x 12.
 * Same formula as futureValue.
 */
export function growthSeries(
  input: Omit<FutureValueInput, 'months'>,
  startAge: number,
  endAge: number,
): { age: number; contributed: number; value: number }[] {
  if (!Number.isInteger(startAge) || !Number.isInteger(endAge) || startAge < 0 || endAge < startAge) {
    throw new RangeError('ages must be integers with endAge >= startAge >= 0');
  }
  const out: { age: number; contributed: number; value: number }[] = [];
  for (let age = startAge; age <= endAge; age++) {
    const { value, contributed } = futureValue({ ...input, months: (age - startAge) * 12 });
    out.push({ age, contributed, value });
  }
  return out;
}

/**
 * Yearly compounded rate of a promised periodic return: (1 + rate)^periods - 1,
 * periods per year hari 365, minggu 52, bulan 12, tahun 1. Returned as a full-precision ratio.
 */
export function yearlyFromPeriodic(rate: number, period: Period): number {
  requireNonNegative('rate', rate);
  return (1 + rate) ** PERIODS_PER_YEAR[period] - 1;
}

/** True when the yearly return is strictly above finance.unrealisticAbove. */
export function isUnrealistic(yearly: number, b = BALANCE): boolean {
  if (!Number.isFinite(yearly)) throw new RangeError('yearly must be finite');
  return yearly > b.finance.unrealisticAbove;
}

/** Key of the first band (in balance order) whose max >= yearly, or 'atas' when above every band. */
export function bandFor(yearly: number, b = BALANCE): BandKey | 'atas' {
  if (!Number.isFinite(yearly)) throw new RangeError('yearly must be finite');
  const bands = b.finance.bands as Record<string, { max: number }>;
  for (const key of Object.keys(bands)) {
    if (yearly <= bands[key].max) return key as BandKey;
  }
  return 'atas';
}

/**
 * True cost of a loan or BNPL. Flat: total = P x (1 + flat x months / 12). Fee: total = P + fee.
 * Exactly one of flatRate / fee is required. instalment = total / months; cost = total - amount.
 * effectiveYearly = 12 x monthly IRR m, solved by bisection from amount = inst x (1 - (1 + m)^-n) / m.
 */
export function loanCost({
  amount,
  months,
  flatRate,
  fee,
}: {
  amount: number;
  months: number;
  flatRate?: number;
  fee?: number;
}): { instalment: number; total: number; cost: number; effectiveYearly: number } {
  if ((flatRate === undefined) === (fee === undefined)) {
    throw new RangeError('provide exactly one of flatRate or fee');
  }
  requireNonNegative('amount', amount);
  requireMonths('months', months, 1);
  let total: number;
  if (flatRate !== undefined) {
    requireNonNegative('flatRate', flatRate);
    total = amount * (1 + (flatRate * months) / 12);
  } else {
    requireNonNegative('fee', fee as number);
    total = amount + (fee as number);
  }
  const inst = total / months;
  const result = {
    instalment: round2(inst),
    total: round2(total),
    cost: round2(total - amount),
    effectiveYearly: 0,
  };
  if (total - amount <= 0 || amount === 0) return result;

  // Present value of the instalments at monthly rate m, minus the amount borrowed (decreasing in m).
  const gap = (m: number): number => inst * ((1 - (1 + m) ** -months) / m) - amount;
  let lo = 1e-12;
  let hi = 1;
  while (gap(hi) > 0 && hi < 1e6) hi *= 2;
  for (let k = 0; k < 200 && hi - lo > 1e-9; k++) {
    const mid = (lo + hi) / 2;
    if (gap(mid) > 0) lo = mid;
    else hi = mid;
  }
  result.effectiveYearly = 12 * ((lo + hi) / 2);
  return result;
}
