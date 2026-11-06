import type { CompiledScenario, Family, Tactic } from './types';

export interface RedFlagCard { id: string; tactic: Tactic; family: Family; cue: string }

export function cardId(tactic: Tactic, family: Family): string {
  return `${tactic}-${family}`;
}

/**
 * The Red Flag card set, derived from content: one card per distinct (tactic, family) pair flagged in a scam
 * scenario, in content order. The card's cue is the first phrase flagged for that pair.
 */
export function deriveCards(scenarios: CompiledScenario[]): RedFlagCard[] {
  const out: RedFlagCard[] = [];
  const seen = new Set<string>();
  for (const s of scenarios) {
    if (s.meta.type !== 'scam') continue;
    for (const f of s.flags) {
      const id = cardId(f.tactic, s.meta.family);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ id, tactic: f.tactic, family: s.meta.family, cue: f.phrase });
    }
  }
  return out;
}
