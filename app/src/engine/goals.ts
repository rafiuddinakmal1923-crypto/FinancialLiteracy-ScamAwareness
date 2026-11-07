import { BALANCE } from './balance';
import { LABUR_PRODUCTS, type GoalId, type GoalMeasure, type Meters } from './types';

export interface GoalState { goal: GoalId | null; meters: Pick<Meters, 'duit' | 'simpanan' | 'labur'> }
export interface GoalProgress { goal: GoalId; value: number; target: number; ratio: number }

function measure(goal: GoalId, m: GoalState['meters']): number {
  const kind = BALANCE.matlamat.measures[goal] as GoalMeasure;
  switch (kind) {
    case 'simpanan': return m.simpanan;
    case 'duit': return m.duit;
    case 'labur': return LABUR_PRODUCTS.reduce((sum, p) => sum + m.labur[p], 0);
  }
}

/** Progress = current value of the goal's measure / its target, capped at 100% (SDS 5.9). Null with no goal. */
export function goalProgress(state: GoalState): GoalProgress | null {
  if (!state.goal) return null;
  const value = measure(state.goal, state.meters);
  const target = BALANCE.matlamat.targets[state.goal];
  return { goal: state.goal, value, target, ratio: Math.min(1, value / target) };
}

export function goalReached(state: GoalState): boolean {
  const p = goalProgress(state);
  return p !== null && p.ratio >= 1;
}
