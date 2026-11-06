import type { BudgetSplit } from '../../engine/week';

export type SplitKey = keyof BudgetSplit;
export const SPLIT_KEYS: readonly SplitKey[] = ['needs', 'wants', 'savings'];
/** Slider step in percent. */
export const SPLIT_STEP = 5;
/** Where the week-0 sliders start (the player decides; Kancil only suggests). */
export const DEFAULT_SPLIT: BudgetSplit = { needs: 60, wants: 30, savings: 10 };
/** Sang Kancil's starting suggestion. */
export const SUGGESTED_SPLIT: BudgetSplit = { needs: 50, wants: 30, savings: 20 };

const snap = (v: number) => Math.min(100, Math.max(0, Math.round(v / SPLIT_STEP) * SPLIT_STEP));

/**
 * Sets one part of the split (snapped to steps of 5, clamped to 0..100) and shares what is left between the other
 * two in proportion to their current values (evenly when both are 0). The result always sums to 100, in fives.
 */
export function rebalance(split: BudgetSplit, key: SplitKey, value: number): BudgetSplit {
  const v = snap(value);
  const [a, b] = SPLIT_KEYS.filter((k) => k !== key) as [SplitKey, SplitKey];
  const rest = 100 - v;
  const total = split[a] + split[b];
  const share = total > 0 ? (rest * split[a]) / total : rest / 2;
  const av = Math.min(rest, snap(share));
  return { ...split, [key]: v, [a]: av, [b]: rest - av } as BudgetSplit;
}
