import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { gradeSemester, moneyHealth, semesterInputs, type SemesterSnapshot } from './grade';

const base = { judgement: 80, celikAvg: 60, imunitiAvg: 60, moneyHealth: 50, flags: 70, rekod: 'Bersih' as const };

describe('gradeSemester', () => {
  it('SDS 5.4 example: 65.5 -> C', () => {
    expect(gradeSemester(base)).toEqual({ score: 65.5, grade: 'C' });
  });
  it('Disiasat on a C stays C', () => {
    expect(gradeSemester({ ...base, rekod: 'Disiasat' }).grade).toBe('C');
  });
  it('caps a would-be A at C when Rekod is not Bersih', () => {
    const all90 = { judgement: 90, celikAvg: 90, imunitiAvg: 90, moneyHealth: 90, flags: 90 };
    expect(gradeSemester({ ...all90, rekod: 'Bersih' })).toEqual({ score: 90, grade: 'A' });
    expect(gradeSemester({ ...all90, rekod: 'Disiasat' })).toEqual({ score: 90, grade: 'C' });
    expect(gradeSemester({ ...all90, rekod: 'Didakwa' }).grade).toBe('C');
  });
  it('caps a would-be B at C', () => {
    const s = { judgement: 75, celikAvg: 75, imunitiAvg: 75, moneyHealth: 75, flags: 75 };
    expect(gradeSemester({ ...s, rekod: 'Bersih' }).grade).toBe('B');
    expect(gradeSemester({ ...s, rekod: 'Disiasat' }).grade).toBe('C');
  });
  it('boundaries 85 / 70 / 55 are inclusive', () => {
    const at = (n: number) => gradeSemester({ judgement: n, celikAvg: n, imunitiAvg: n, moneyHealth: n, flags: n, rekod: 'Bersih' });
    expect(at(85).grade).toBe('A');
    expect(at(84.9).grade).toBe('B');
    expect(at(70).grade).toBe('B');
    expect(at(69.9).grade).toBe('C');
    expect(at(55).grade).toBe('C');
    expect(at(54.9).grade).toBe('D');
  });
  it('D stays D under a cap', () => {
    const low = { judgement: 20, celikAvg: 20, imunitiAvg: 20, moneyHealth: 20, flags: 20 };
    expect(gradeSemester({ ...low, rekod: 'Didakwa' }).grade).toBe('D');
  });
  it('clamps inputs to 0-100', () => {
    expect(gradeSemester({ judgement: 500, celikAvg: 500, imunitiAvg: 500, moneyHealth: 500, flags: 500, rekod: 'Bersih' }).score).toBe(100);
    expect(gradeSemester({ judgement: -5, celikAvg: -5, imunitiAvg: -5, moneyHealth: -5, flags: -5, rekod: 'Bersih' }).score).toBe(0);
  });
  it('weights come from BALANCE and sum to 1', () => {
    const w = BALANCE.grade.weights;
    expect(w.judgement + w.celik + w.imuniti + w.money + w.flags).toBeCloseTo(1, 10);
  });
});

describe('moneyHealth', () => {
  const ex = { finalDuit: 2000, finalLabur: 200, startTotal: 2000, incomeTotal: 1200, simpananW12: 300, laburW12: 200 };
  it('SDS example parts: 68.75 kept, 100 emergency, 100 invested -> 84.38', () => {
    expect(moneyHealth(ex)).toBe(84.38);
  });
  it('no Labur and low Simpanan', () => {
    // kept 2200/3200 = 68.75 -> 34.375; emergency 150/300 = 50 -> 12.5; invested 0
    expect(moneyHealth({ ...ex, finalLabur: 0, finalDuit: 2200, laburW12: 0, simpananW12: 150 })).toBe(46.88);
  });
  it('caps emergency at 100 and money kept at 100', () => {
    expect(moneyHealth({ ...ex, simpananW12: 9999, finalDuit: 99999 })).toBe(100);
  });
  it('clamps money kept at 0 and ignores negatives', () => {
    expect(moneyHealth({ ...ex, finalDuit: -500, finalLabur: 0, simpananW12: -10, laburW12: 0 })).toBe(0);
  });
  it('divide by zero gives money kept 0', () => {
    expect(moneyHealth({ finalDuit: 100, finalLabur: 0, startTotal: 0, incomeTotal: 0, simpananW12: 0, laburW12: 0 })).toBe(0);
  });
});

describe('semesterInputs', () => {
  const imuniti = { greed: 10, urgency: 20, authority: 30, fear: 40, secrecy: 50, social: 60, payfirst: 70 };
  const celik = { bajet: 10, kecemasan: 20, kompaun: 30, risiko: 40, hutang: 50, semak: 60 };
  const snap: SemesterSnapshot = {
    results: [
      { right: true, flagsFound: 2, flagsTotal: 3 },
      { right: false, flagsFound: 1, flagsTotal: 1 },
      { right: true, flagsFound: 0, flagsTotal: 0 },
      { right: true, flagsFound: 0, flagsTotal: 0 },
    ],
    meters: { duit: 2000, simpanan: 300, imuniti, celik, labur: { amanah: 100, ekuiti: 100 }, rekod: 'Disiasat' },
    incomeTotal: 1200,
  };
  it('derives judgement, flags, means, rekod and money health', () => {
    const r = semesterInputs(snap, 2000);
    expect(r.judgement).toBe(75);
    expect(r.flags).toBe(75);
    expect(r.celikAvg).toBe(35);
    expect(r.imunitiAvg).toBe(40);
    expect(r.rekod).toBe('Disiasat');
    expect(r.moneyHealth).toBe(84.38);
  });
  it('no results -> judgement 0 and flags 0', () => {
    const r = semesterInputs({ ...snap, results: [] }, 2000);
    expect(r.judgement).toBe(0);
    expect(r.flags).toBe(0);
  });
  it('results but no flags exist -> flags 100', () => {
    const r = semesterInputs({ ...snap, results: [{ right: true, flagsFound: 0, flagsTotal: 0 }] }, 2000);
    expect(r.flags).toBe(100);
  });
});
