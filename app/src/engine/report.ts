import { BALANCE } from './balance';
import { gradeSemester, semesterInputs, type GradeLetter, type SemesterSnapshot } from './grade';
import { round2 } from './money';
import { CONCEPTS, TACTICS, type Concept, type Tactic } from './types';

export type ReportSnapshot = Omit<SemesterSnapshot, 'results'> & {
  week: number;
  results: { id: string; right: boolean; flagsFound: number; flagsTotal: number }[];
};

export interface WeakestItem { kind: 'concept' | 'tactic'; code: string }

export interface ReportModel {
  grade: GradeLetter; score: number; finished: boolean;
  duit: number; laburValue: number; netWorth: number;
  emergencyReached: boolean; simpanan: number; emergencyTarget: number;
  scamsAvoided: number; scamsFellFor: number;
  flagsFound: number; flagsTotal: number; flagsPct: number; judgementPct: number;
  celik: { code: Concept; value: number }[];
  imuniti: { code: Tactic; value: number }[];
  weakest: WeakestItem;
  rekod: 'Bersih' | 'Disiasat' | 'Didakwa';
  /** True when a Rekod other than Bersih lowered an A or B to C. */
  rekodCapped: boolean;
}

const pct = (n: number): number => (Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n))) : 0);

/** Everything the report card (S13) shows. Grading maths stays in grade.ts; this only counts and picks. */
export function reportModel(
  g: ReportSnapshot, startTotal: number, scenarios: Record<string, { meta: { type: string } }>,
): ReportModel {
  const inputs = semesterInputs(g, startTotal);
  const { score, grade } = gradeSemester(inputs);
  const clean = gradeSemester({ ...inputs, rekod: 'Bersih' }).grade;
  const rekodCapped = g.meters.rekod !== 'Bersih' && grade !== clean;

  const scam = g.results.filter((r) => scenarios[r.id]?.meta.type === 'scam');
  const flagsFound = g.results.reduce((s, r) => s + r.flagsFound, 0);
  const flagsTotal = g.results.reduce((s, r) => s + r.flagsTotal, 0);
  const laburValue = round2(g.meters.labur.amanah + g.meters.labur.ekuiti);

  const celik = CONCEPTS.map((code) => ({ code, value: g.meters.celik[code] ?? 0 }));
  const imuniti = TACTICS.map((code) => ({ code, value: g.meters.imuniti[code] ?? 0 }));
  // Strictly lower wins, so the first in order (concepts, then tactics, each in code order) keeps a tie.
  let weakest: WeakestItem = { kind: 'concept', code: CONCEPTS[0] };
  let low = Infinity;
  for (const c of celik) if (c.value < low) { low = c.value; weakest = { kind: 'concept', code: c.code }; }
  for (const t of imuniti) if (t.value < low) { low = t.value; weakest = { kind: 'tactic', code: t.code }; }

  return {
    grade, score,
    finished: g.week >= BALANCE.semesterWeeks && g.results.length > 0,
    duit: g.meters.duit, laburValue, netWorth: round2(g.meters.duit + laburValue),
    emergencyReached: g.meters.simpanan >= BALANCE.finance.emergencyTarget,
    simpanan: g.meters.simpanan, emergencyTarget: BALANCE.finance.emergencyTarget,
    scamsAvoided: scam.filter((r) => r.right).length,
    scamsFellFor: scam.filter((r) => !r.right).length,
    flagsFound, flagsTotal, flagsPct: pct(inputs.flags), judgementPct: pct(inputs.judgement),
    celik, imuniti, weakest, rekod: g.meters.rekod, rekodCapped,
  };
}
