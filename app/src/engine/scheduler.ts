import { BALANCE } from './balance';
import { ContentError, type SemesterFileSchema } from './schemas';
import type { z } from 'zod';
import type { CompiledScenario, Concept, Family, Tactic } from './types';

export type SemesterFile = z.infer<typeof SemesterFileSchema>;
/** The scenario facts the scheduler needs, so it works with partial content. */
export type ScenarioInfo = Pick<CompiledScenario['meta'], 'id' | 'type' | 'family' | 'tactics' | 'concepts'>;
export interface PlanEntry { week: number; scenario: ScenarioInfo | null }

/**
 * The semester plan (SDS 5.3): the fixed order in semester.json with each scenario id resolved.
 * Strict (default) throws a ContentError naming a missing id; non-strict gives `scenario: null` for unknown ids.
 */
export function semesterPlan(
  file: SemesterFile,
  scenarios: Record<string, ScenarioInfo>,
  opts: { strict?: boolean } = {},
): PlanEntry[] {
  const strict = opts.strict ?? true;
  return file.weeks.map((w) => {
    if (w.scenario === null) return { week: w.week, scenario: null };
    const found = scenarios[w.scenario];
    if (!found) {
      if (strict) throw new ContentError(`semester.json week ${w.week}: unknown scenario "${w.scenario}"`);
      return { week: w.week, scenario: null };
    }
    return { week: w.week, scenario: found };
  });
}

/** Scam scenarios / scenarios in the plan (0 when the plan has none). */
export function scamShare(plan: PlanEntry[]): number {
  const played = plan.filter((p) => p.scenario !== null);
  if (played.length === 0) return 0;
  return played.filter((p) => p.scenario!.type === 'scam').length / played.length;
}

/** Adaptive weight of a tactic or concept: weaker scores weigh more (D20). */
export function tacticWeight(score: number, b: typeof BALANCE = BALANCE): number {
  return b.adaptive.base - score + b.adaptive.bonus;
}

export interface AdaptiveState { imuniti: Record<Tactic, number>; celik: Record<Concept, number> }
export interface AdaptiveConstraints { before?: [string, string][] }

/**
 * Stretch: pick the next scenario with the highest summed weight over its tactics (Imuniti) and concepts (Celik).
 * Skips `lastFamily` when another candidate exists; an 'after' id is excluded while its 'before' id is still a
 * candidate. Ties go to the lowest id. Throws on an empty list.
 */
export function pickAdaptive(
  candidates: ScenarioInfo[],
  state: AdaptiveState,
  lastFamily: Family | null,
  b: typeof BALANCE = BALANCE,
  constraints: AdaptiveConstraints = {},
): ScenarioInfo {
  if (candidates.length === 0) throw new Error('pickAdaptive: no candidates');
  const ids = new Set(candidates.map((c) => c.id));
  const blocked = new Set((constraints.before ?? []).filter(([first]) => ids.has(first)).map(([, after]) => after));
  let pool = candidates.filter((c) => !blocked.has(c.id));
  if (pool.length === 0) pool = candidates;
  const fresh = pool.filter((c) => c.family !== lastFamily);
  if (fresh.length > 0) pool = fresh;
  const weight = (c: ScenarioInfo) =>
    c.tactics.reduce((s, t) => s + tacticWeight(state.imuniti[t], b), 0) +
    c.concepts.reduce((s, k) => s + tacticWeight(state.celik[k], b), 0);
  return [...pool].sort((x, y) => weight(y) - weight(x) || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))[0]!;
}
