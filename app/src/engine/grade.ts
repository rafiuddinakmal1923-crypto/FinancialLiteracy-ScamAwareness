import { BALANCE } from './balance';
import { round2 } from './money';

export type GradeLetter = 'A' | 'B' | 'C' | 'D';
type RekodName = 'Bersih' | 'Disiasat' | 'Didakwa';

const clamp100 = (n: number): number => (Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);

export interface MoneyHealthInput {
  finalDuit: number; finalLabur: number; startTotal: number; incomeTotal: number; simpananW12: number; laburW12: number;
}

/** Money health 0-100 (SDS 5.4): 50% money kept, 25% emergency fund, 25% invested. Rounded to 2 decimals. */
export function moneyHealth(i: MoneyHealthInput, b: typeof BALANCE = BALANCE): number {
  const denom = i.startTotal + i.incomeTotal;
  const kept = denom > 0 ? clamp100(((i.finalDuit + i.finalLabur) / denom) * 100) : 0;
  const emergency = clamp100((i.simpananW12 / b.finance.emergencyTarget) * 100);
  const invested = i.laburW12 > 0 ? 100 : 0;
  const w = b.grade.moneyHealth;
  return round2(w.kept * kept + w.emergency * emergency + w.invested * invested);
}

export interface GradeInput {
  judgement: number; celikAvg: number; imunitiAvg: number; moneyHealth: number; flags: number; rekod: RekodName;
}

/** Weighted semester score (1 decimal) and letter grade. A Rekod other than Bersih caps A/B at C. */
export function gradeSemester(i: GradeInput, b: typeof BALANCE = BALANCE): { score: number; grade: GradeLetter } {
  const w = b.grade.weights;
  const raw =
    w.judgement * clamp100(i.judgement) + w.celik * clamp100(i.celikAvg) + w.imuniti * clamp100(i.imunitiAvg) +
    w.money * clamp100(i.moneyHealth) + w.flags * clamp100(i.flags);
  const score = Math.round(raw * 10 + 1e-9) / 10;
  let grade: GradeLetter = score >= b.grade.A ? 'A' : score >= b.grade.B ? 'B' : score >= b.grade.C ? 'C' : 'D';
  if (i.rekod !== 'Bersih' && (grade === 'A' || grade === 'B')) grade = b.grade.capWhenRecord;
  return { score, grade };
}

/** Structural view of the saved game that grading needs (engine does not import state). */
export interface SemesterSnapshot {
  results: { right: boolean; flagsFound: number; flagsTotal: number }[];
  meters: {
    duit: number; simpanan: number;
    imuniti: Record<string, number>; celik: Record<string, number>;
    labur: { amanah: number; ekuiti: number }; rekod: RekodName;
  };
  incomeTotal: number;
}

const mean = (r: Record<string, number>): number => {
  const v = Object.values(r);
  return v.length === 0 ? 0 : v.reduce((s, n) => s + n, 0) / v.length;
};

/** Turns a finished semester into the inputs of gradeSemester. */
export function semesterInputs(g: SemesterSnapshot, startTotal: number): GradeInput {
  const n = g.results.length;
  const right = g.results.filter((r) => r.right).length;
  const found = g.results.reduce((s, r) => s + r.flagsFound, 0);
  const total = g.results.reduce((s, r) => s + r.flagsTotal, 0);
  const labur = g.meters.labur.amanah + g.meters.labur.ekuiti;
  return {
    judgement: n === 0 ? 0 : (right / n) * 100,
    celikAvg: mean(g.meters.celik),
    imunitiAvg: mean(g.meters.imuniti),
    moneyHealth: moneyHealth({
      finalDuit: g.meters.duit, finalLabur: labur, startTotal, incomeTotal: g.incomeTotal,
      simpananW12: g.meters.simpanan, laburW12: labur,
    }),
    flags: n === 0 ? 0 : total === 0 ? 100 : (found / total) * 100,
    rekod: g.meters.rekod,
  };
}
