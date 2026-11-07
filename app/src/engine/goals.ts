import { BALANCE } from './balance';
import type { GoalId, Meters } from './types';

export interface GoalState { goal: GoalId | null; meters: Meters }
export interface GoalProgress { goal: GoalId; value: number; target: number; ratio: number }

/** Contract stub (A1): the target is real, progress is 0. A4 measures it (SDS 5.9). Null when no goal is picked. */
export function goalProgress(state: GoalState): GoalProgress | null {
  if (!state.goal) return null;
  return { goal: state.goal, value: 0, target: BALANCE.matlamat.targets[state.goal], ratio: 0 };
}

/** Contract stub (A1): never reached. A4 replaces it. */
export function goalReached(_state: GoalState): boolean {
  return false;
}
