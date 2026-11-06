import type { Family, Tactic } from './types';

export function cardId(tactic: Tactic, family: Family): string {
  return `${tactic}-${family}`;
}
