import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { gradeSemester, semesterInputs } from './grade';
import { reportModel, type ReportSnapshot } from './report';
import { CONCEPTS, TACTICS } from './types';

const catalog = {
  s1: { meta: { type: 'scam' } }, s2: { meta: { type: 'scam' } }, s3: { meta: { type: 'scam' } },
  l1: { meta: { type: 'legit' } },
};
const res = (id: string, right: boolean, found = 2, total = 3) => ({ id, right, flagsFound: found, flagsTotal: total });
type Celik = ReportSnapshot['meters']['celik'];
type Imuniti = ReportSnapshot['meters']['imuniti'];
const flatC = (n: number, o: Record<string, number> = {}) => ({ ...Object.fromEntries(CONCEPTS.map((k) => [k, n])), ...o }) as Celik;
const flatI = (n: number, o: Record<string, number> = {}) => ({ ...Object.fromEntries(TACTICS.map((k) => [k, n])), ...o }) as Imuniti;

function snap(over: Partial<ReportSnapshot> = {}, meters: Partial<ReportSnapshot['meters']> = {}): ReportSnapshot {
  return {
    week: 12,
    results: [res('s1', true), res('s2', false), res('l1', true)],
    incomeTotal: 1000,
    meters: { duit: 1500, simpanan: 320, labur: { amanah: 100, ekuiti: 50 }, rekod: 'Bersih', celik: flatC(60), imuniti: flatI(60), ...meters },
    ...over,
  };
}

describe('reportModel', () => {
  it('grade and score match gradeSemester', () => {
    const s = snap();
    const m = reportModel(s, BALANCE.start.duit, catalog);
    const g = gradeSemester(semesterInputs(s, BALANCE.start.duit));
    expect(m.score).toBe(g.score);
    expect(m.grade).toBe(g.grade);
  });
  it('SDS 5.4 inputs (80/60/60/50/70, Bersih) grade 65.5 C through the engine', () => {
    expect(gradeSemester({ judgement: 80, celikAvg: 60, imunitiAvg: 60, moneyHealth: 50, flags: 70, rekod: 'Bersih' })).toEqual({ score: 65.5, grade: 'C' });
    // judgement 80 = 4 of 5 right, flags 70 = 7 of 10 found
    const results = [res('s1', true, 2, 2), res('s2', true, 2, 2), res('s3', true, 2, 2), res('l1', true, 1, 4), res('s1', false, 0, 0)];
    const m = reportModel(snap({ results }), 2000, catalog);
    expect(m.judgementPct).toBe(80);
    expect(m.flagsPct).toBe(70);
  });
  it('counts scams avoided and fell for among scam scenarios only', () => {
    const m = reportModel(snap({ results: [res('s1', true), res('s2', false), res('s3', true), res('l1', false)] }), 2000, catalog);
    expect(m.scamsAvoided).toBe(2);
    expect(m.scamsFellFor).toBe(1);
  });
  it('reports money rows and flags', () => {
    const m = reportModel(snap(), 2000, catalog);
    expect(m.duit).toBe(1500);
    expect(m.laburValue).toBe(150);
    expect(m.netWorth).toBe(1650);
    expect(m.flagsFound).toBe(6);
    expect(m.flagsTotal).toBe(9);
  });
  it('emergency fund reached at exactly the target', () => {
    const t = BALANCE.finance.emergencyTarget;
    expect(reportModel(snap({}, { simpanan: t }), 2000, catalog).emergencyReached).toBe(true);
    expect(reportModel(snap({}, { simpanan: t - 0.01 }), 2000, catalog).emergencyReached).toBe(false);
  });
  it('weakest item: lowest score; concept before tactic and code order on ties', () => {
    expect(reportModel(snap(), 2000, catalog).weakest).toEqual({ kind: 'concept', code: CONCEPTS[0] });
    expect(reportModel(snap({}, { celik: flatC(60, { semak: 10, hutang: 10 }) }), 2000, catalog).weakest).toEqual({ kind: 'concept', code: 'hutang' });
    expect(reportModel(snap({}, { imuniti: flatI(60, { fear: 5 }) }), 2000, catalog).weakest).toEqual({ kind: 'tactic', code: 'fear' });
    const both = reportModel(snap({}, { celik: flatC(60, { risiko: 5 }), imuniti: flatI(60, { greed: 5 }) }), 2000, catalog);
    expect(both.weakest).toEqual({ kind: 'concept', code: 'risiko' });
    expect(reportModel(snap({}, { celik: flatC(60, { risiko: 9 }), imuniti: flatI(60, { greed: 5 }) }), 2000, catalog).weakest).toEqual({ kind: 'tactic', code: 'greed' });
  });
  it('lists celik per concept and imuniti per tactic in code order', () => {
    const m = reportModel(snap(), 2000, catalog);
    expect(m.celik.map((x) => x.code)).toEqual([...CONCEPTS]);
    expect(m.imuniti.map((x) => x.code)).toEqual([...TACTICS]);
  });
  it('finished only at week 12 with results', () => {
    expect(reportModel(snap(), 2000, catalog).finished).toBe(true);
    expect(reportModel(snap({ week: 8 }), 2000, catalog).finished).toBe(false);
    expect(reportModel(snap({ results: [] }), 2000, catalog).finished).toBe(false);
  });
  it('empty results give no NaN', () => {
    const m = reportModel(snap({ results: [] }), 2000, catalog);
    for (const v of [m.score, m.judgementPct, m.flagsPct, m.scamsAvoided, m.scamsFellFor, m.netWorth]) expect(Number.isFinite(v)).toBe(true);
  });
  it('flags a Rekod cap only when it lowered an A or B', () => {
    const high = { celik: flatC(95), imuniti: flatI(95), simpanan: 400 };
    const good = [res('s1', true, 3, 3), res('s2', true, 3, 3)];
    const capped = reportModel(snap({ results: good }, { ...high, rekod: 'Disiasat' }), 2000, catalog);
    expect(capped.grade).toBe('C');
    expect(capped.rekodCapped).toBe(true);
    expect(reportModel(snap({ results: good }, high), 2000, catalog).rekodCapped).toBe(false);
    const low = reportModel(snap({ results: [res('s1', false, 0, 3)] }, { celik: flatC(0), imuniti: flatI(0), simpanan: 0, rekod: 'Didakwa' }), 2000, catalog);
    expect(low.grade).toBe('D');
    expect(low.rekodCapped).toBe(false);
  });
});
