import { BALANCE } from './balance';
import { applyEffect } from './meters';
import { round2 } from './money';
import { LABUR_PRODUCTS, type LaburProduct, type Meters } from './types';
import type { WeekDef } from './schemas';

export type { WeekDef };

export interface IntroSummary {
  meters: Meters;
  desperate: boolean;
  costs: { label: string; amount: number }[];
  income: number;
  laburGrowth: Record<LaburProduct, number>;
}

/**
 * The week intro (SDS 5.1, D17, D22). Order: income, costs, Labur growth for the week, desperation.
 * Weeks are 1..12. Pure: returns new meters.
 */
export function applyWeekIntro(m: Meters, week: WeekDef, b: typeof BALANCE = BALANCE): IntroSummary {
  let meters = m;
  const income = (b.incomeWeeks as readonly number[]).includes(week.week) ? b.income : 0;
  if (income > 0) meters = applyEffect(meters, { kind: 'duit', delta: income });

  const costs = week.costs.map((c) => ({ label: c.label.ms, amount: c.amount }));
  for (const c of costs) meters = applyEffect(meters, { kind: 'duit', delta: -c.amount });

  const pct = b.finance.ekuitiPath[week.week - 1] ?? 0;
  const laburGrowth = {
    amanah: round2((meters.labur.amanah * b.finance.amanahYearly) / 52),
    ekuiti: round2((meters.labur.ekuiti * pct) / 100),
  } as Record<LaburProduct, number>;
  for (const p of LABUR_PRODUCTS) {
    if (laburGrowth[p] !== 0) meters = applyEffect(meters, { kind: 'labur', product: p, delta: laburGrowth[p] });
  }

  if (meters.simpanan < b.desperation.simpananBelow) {
    meters = applyEffect(meters, { kind: 'tekanan', delta: b.desperation.tekananUp });
  }
  return { meters, desperate: meters.tekanan >= b.desperation.cueAt, costs, income, laburGrowth };
}

export interface BudgetSplit { needs: number; wants: number; savings: number }

/** Week 0 budget split: Simpanan = savings% of Duit, rounded to RM10. Rejects splits that are not 100 or have negatives. */
export function applyBudget(m: Meters, split: BudgetSplit): Meters {
  const parts = [split.needs, split.wants, split.savings];
  if (parts.some((p) => !Number.isFinite(p) || p < 0) || round2(parts[0]! + parts[1]! + parts[2]!) !== 100) {
    throw new RangeError('Budget split must be non-negative and sum to 100');
  }
  const simpanan = Math.min(m.duit, Math.round((m.duit * split.savings) / 100 / 10) * 10);
  return { ...m, simpanan };
}

export type MoveResult = { meters: Meters; tip?: 'kecemasan' } | { error: 'not-week-intro' | 'insufficient' };

/** Moves money between Duit and a Labur product, only at a week intro. Net worth never changes. */
export function moveLabur(m: Meters, product: LaburProduct, delta: number, atWeekIntro: boolean, b: typeof BALANCE = BALANCE): MoveResult {
  if (!atWeekIntro) return { error: 'not-week-intro' };
  if (delta === 0) return { meters: m };
  if (delta > 0) {
    if (m.duit < delta) return { error: 'insufficient' };
  } else if (m.labur[product] < -delta) {
    return { error: 'insufficient' };
  }
  const moved: Meters = {
    ...m,
    duit: round2(m.duit - delta),
    labur: { ...m.labur, [product]: round2(m.labur[product] + delta) },
  };
  moved.simpanan = Math.min(moved.simpanan, moved.duit);
  if (delta > 0 && m.simpanan < b.finance.emergencyTarget) {
    return { meters: applyEffect(moved, { kind: 'tekanan', delta: b.finance.laburBeforeEmergencyTekanan }), tip: 'kecemasan' };
  }
  return { meters: moved };
}
