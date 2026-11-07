import { goals } from 'virtual:celik-content';
import type { GoalId } from '../../engine/types';

/** The goal's name in the current language, falling back to BM, then to its id. */
export function goalName(id: GoalId, lang: string): string {
  const g = goals?.find((x) => x.id === id);
  if (!g) return id;
  return (lang === 'en' ? g.name.en : undefined) ?? g.name.ms;
}
