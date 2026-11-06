// View-models for the three Kalkulator tabs: read what the player typed, call engine/finance.ts, and hand back
// numbers ready to format. No money maths lives here. Anything that cannot be computed returns null, which the
// screens show as "Isi semua nombor" (never NaN or Infinity).
import { BALANCE } from '../../engine/balance';
import {
  bandFor, futureValue, growthSeries, isUnrealistic, loanCost, yearlyFromPeriodic,
  type BandKey, type Period,
} from '../../engine/finance';

const CALC = BALANCE.finance.calc;
const NUMBER_RE = /^(\d+\.?\d*|\.\d+)$/;

/** "50" -> 50, "5.5" -> 5.5; empty, ".", negatives, exponents and words -> null. */
export function parseNum(s: string): number | null {
  const t = s.trim();
  if (!NUMBER_RE.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const finite = (...xs: number[]): boolean => xs.every((x) => Number.isFinite(x));

export interface MasaInput { monthly: string; rate: string; startAge: string; endAge: string }
export interface MasaResult {
  value: number; contributed: number; growth: number;
  series: { age: number; contributed: number; value: number }[];
  startAge: number; endAge: number;
}

/** True when both ages are numbers but the end is not after the start (a hint line beside "Isi semua nombor"). */
export function agesOutOfOrder(i: Pick<MasaInput, 'startAge' | 'endAge'>): boolean {
  const a = parseNum(i.startAge);
  const b = parseNum(i.endAge);
  return a !== null && b !== null && b <= a;
}

/** Mesin Masa: a monthly saving at a yearly rate (percent) between two ages. */
export function masaResult(i: MasaInput): MasaResult | null {
  const monthly = parseNum(i.monthly);
  const ratePct = parseNum(i.rate);
  const start = parseNum(i.startAge);
  const end = parseNum(i.endAge);
  if (monthly === null || ratePct === null || start === null || end === null) return null;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start || end > CALC.maxAge) return null;
  try {
    const yearlyRate = ratePct / 100;
    const { value, contributed, growth } = futureValue({ monthly, yearlyRate, months: (end - start) * 12 });
    const series = growthSeries({ monthly, yearlyRate }, start, end);
    if (!finite(value, contributed, growth, ...series.map((p) => p.value))) return null;
    return { value, contributed, growth, series, startAge: start, endAge: end };
  } catch {
    return null;
  }
}

export interface PulanganInput { promised: string; period: Period }
export type BandHit = { key: BandKey; min: number; max: number; contains: boolean };
export interface PulanganResult {
  /** Yearly compounded rate in percent (capped for display when absurd). */
  pct: number;
  /** True when the real rate is at or above displayCapPct or overflowed to Infinity. */
  capped: boolean;
  unrealistic: boolean;
  /** The example band that contains the rate, 'atas' above every band; contains=false means "in no band". */
  band: BandHit | 'atas';
}

/** Semak Pulangan: a promised return per period -> the yearly rate, and where it sits against the example bands. */
export function pulanganResult(i: PulanganInput): PulanganResult | null {
  const promisedPct = parseNum(i.promised);
  if (promisedPct === null) return null;
  try {
    const yearly = yearlyFromPeriodic(promisedPct / 100, i.period);
    if (Number.isNaN(yearly)) return null;
    const unrealistic = isUnrealistic(yearly);
    const key = bandFor(yearly);
    const bands = BALANCE.finance.bands;
    const band: PulanganResult['band'] = key === 'atas'
      ? 'atas'
      : { key, min: bands[key].min, max: bands[key].max, contains: yearly >= bands[key].min && yearly <= bands[key].max };
    const pct = yearly * 100;
    const capped = !Number.isFinite(pct) || pct >= CALC.displayCapPct;
    return { pct: capped ? CALC.displayCapPct : pct, capped, unrealistic, band };
  } catch {
    return null;
  }
}

export interface KosInput { amount: string; mode: 'flat' | 'fee'; flat: string; fee: string; months: string }
export interface KosResult { instalment: number; total: number; cost: number; effectivePct: number }

/** Kos Sebenar: a loan or BNPL with a flat yearly rate (percent) or a fee (RM). */
export function kosResult(i: KosInput): KosResult | null {
  const amount = parseNum(i.amount);
  const months = parseNum(i.months);
  const extra = parseNum(i.mode === 'flat' ? i.flat : i.fee);
  if (amount === null || months === null || extra === null) return null;
  if (!Number.isInteger(months) || months < 1 || months > CALC.maxMonths) return null;
  try {
    const r = loanCost(i.mode === 'flat'
      ? { amount, months, flatRate: extra / 100 }
      : { amount, months, fee: extra });
    if (!finite(r.instalment, r.total, r.cost, r.effectiveYearly)) return null;
    return { instalment: r.instalment, total: r.total, cost: r.cost, effectivePct: r.effectiveYearly * 100 };
  } catch {
    return null;
  }
}
