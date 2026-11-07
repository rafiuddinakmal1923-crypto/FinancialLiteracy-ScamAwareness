// The Semester Pertama loop (Task 25, D20): where the player goes next, and whether the next week may begin.
// Pure functions over a small slice of the store, so the whole 12-week order is testable without UI.
import { scenarios } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { WEEKS } from './weeks';

/** The slice of the game the loop reads. `budget` is true once the week-0 split is set. */
export interface LoopState {
  week: number;
  budget: boolean;
  weekIntroOpen: boolean;
  /** Id of the scenario whose aftermath is pending, or null. */
  lastEnded: string | null;
  /** Id of the scenario in progress, or null. */
  active: string | null;
  results: { id: string }[];
}

/** Reads the loop slice from the store state. */
export function loopState(s: {
  week: number; budget: unknown; weekIntroOpen: boolean; lastEnded: { id: string } | null; active: { id: string } | null; results: { id: string }[];
}): LoopState {
  return { week: s.week, budget: s.budget !== null, weekIntroOpen: s.weekIntroOpen, lastEnded: s.lastEnded?.id ?? null, active: s.active?.id ?? null, results: s.results };
}

/** Week 7 is the mid-semester break (Mesin Masa reflection). */
export const BREAK_WEEK = 7;

/** The scenario of a week (1..12), or null for weeks 7 and 12. */
export function weekScenario(week: number): string | null {
  return WEEKS[week - 1]?.scenario ?? null;
}

/** Where a scenario plays: calls on the incoming-call screen, everything else as a chat. */
export function scenarioPath(id: string): string {
  return scenarios[id]?.meta.ui === 'call' ? `/panggilan/${id}` : `/sembang/${id}`;
}

/** A chat opens behind the "Mesej baru dari ..." banner; a call just rings. */
export function withBanner(path: string): string {
  return path.replace(/^\/sembang\//, '/semester/mesej/');
}

/** What follows a week intro: its scenario, the week-7 reflection, or the report after week 12. */
export function afterIntroPath(week: number): string {
  const id = weekScenario(week);
  if (id) return scenarioPath(id);
  return week >= BALANCE.semesterWeeks ? '/semester/rapor' : week === BREAK_WEEK ? '/semester/cuti' : '/home';
}

/** True when every scenario of weeks 1..week has a result. */
function scenariosDone(s: LoopState, week: number): boolean {
  for (let w = 1; w <= week; w++) {
    const id = weekScenario(w);
    if (id && !s.results.some((r) => r.id === id)) return false;
  }
  return true;
}

/**
 * Store guard for starting the next week: no aftermath pending, no chat running, no intro open, fewer than 12 weeks
 * played, and the scenario of every week so far finished.
 */
export function canBeginWeek(s: LoopState): boolean {
  return !s.lastEnded && !s.active && !s.weekIntroOpen && s.week < BALANCE.semesterWeeks && scenariosDone(s, s.week);
}

/**
 * The route the Semester tile opens (and the intro's Teruskan goes to once the intro is closed): Dompet before the
 * split, a pending aftermath, an open intro, this week's unplayed scenario, the report after week 12, else the next
 * week's intro.
 */
export function nextStep(s: LoopState): string {
  if (!s.budget) return '/dompet';
  if (s.lastEnded) return `/semester/akibat/${s.lastEnded}`;
  if (s.active) return scenarioPath(s.active);
  if (s.weekIntroOpen) return '/semester/minggu';
  const id = weekScenario(s.week);
  if (s.week >= 1 && id && !s.results.some((r) => r.id === id)) return scenarioPath(id);
  if (s.week >= BALANCE.semesterWeeks) return '/semester/rapor';
  return '/semester/minggu';
}

export type HomeTile = { kind: 'pending' } | { kind: 'next'; week: number } | { kind: 'report' };

/** What the Semester tile on the home screen says. */
export function homeTile(s: LoopState): HomeTile {
  if (s.lastEnded || s.active) return { kind: 'pending' };
  if (s.weekIntroOpen) return { kind: 'next', week: Math.max(1, s.week) };
  const id = weekScenario(s.week);
  if (s.week >= 1 && id && !s.results.some((r) => r.id === id)) return { kind: 'pending' };
  if (s.week >= BALANCE.semesterWeeks) return { kind: 'report' };
  return { kind: 'next', week: s.week + 1 };
}
