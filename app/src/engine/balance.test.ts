import { describe, it, expect } from 'vitest';
import { BALANCE } from './balance';

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

describe('BALANCE (SDS 5.2-5.8, D20-D24)', () => {
  it('grade weights and money health parts each sum to 1', () => {
    expect(BALANCE.grade.weights).toEqual({ judgement: 0.3, celik: 0.25, imuniti: 0.2, money: 0.15, flags: 0.1 });
    expect(sum(BALANCE.grade.weights)).toBeCloseTo(1, 10);
    expect(BALANCE.grade.moneyHealth).toEqual({ kept: 0.5, emergency: 0.25, invested: 0.25 });
    expect(sum(BALANCE.grade.moneyHealth)).toBeCloseTo(1, 10);
  });

  it('SDS 5.4 worked example gives 65.5', () => {
    const w = BALANCE.grade.weights;
    const score = 80 * w.judgement + 60 * w.celik + 60 * w.imuniti + 50 * w.money + 70 * w.flags;
    expect(score).toBeCloseTo(65.5, 10);
  });

  it('MoneyChain hops are 600-1200 ms, the pulse is slow (< 3 Hz) and reduced-motion fades are < 200 ms', () => {
    const m = BALANCE.moneyChain;
    expect(m.hopMs).toBeGreaterThanOrEqual(600);
    expect(m.hopMs).toBeLessThanOrEqual(1200);
    expect(1000 / m.pulseMs).toBeLessThan(3);
    expect(m.reducedMs).toBeLessThan(200);
  });

  it('keeps the scam share band at 35-45% (D20)', () => {
    expect(BALANCE.adaptive.scamShareMin).toBe(0.35);
    expect(BALANCE.adaptive.scamShareMax).toBe(0.45);
  });

  it('has the Celik and finance XP values (D24)', () => {
    expect(BALANCE.celik).toEqual({ right: 10, wrong: -10, cardRight: 3, cardWrong: -5 });
    expect(BALANCE.xp).toMatchObject({ financeRight: 50, financeWrong: 20, calc: 10, kadIlmu: 10, moneyCardRight: 5, moneyCardWrong: 0 });
  });

  it('ekuiti path: 12 weeks, -6% in week 8, back above the week-7 value by week 11 (D22)', () => {
    const path = BALANCE.finance.ekuitiPath;
    expect(path).toHaveLength(12);
    expect(path[7]).toBe(-6);
    path.forEach((p, i) => { if (i !== 7) expect(p, `week ${i + 1}`).toBeGreaterThan(0); });
    const value = (weeks: number) => path.slice(0, weeks).reduce((v, p) => v * (1 + p / 100), 1);
    expect(value(8)).toBeLessThan(value(7));
    expect(value(10)).toBeLessThan(value(7));
    expect(value(11)).toBeGreaterThan(value(7));
  });

  it('every illustrative rate band is TODO-VERIFY with a year (CLAUDE.md rule 11)', () => {
    const { bands } = BALANCE.finance;
    expect(Object.keys(bands).sort()).toEqual(['hargaTetap', 'simpanan', 'simpananTetap', 'unitAmanah']);
    for (const [name, b] of Object.entries(bands)) {
      expect(b.source, name).toBe('TODO-VERIFY');
      expect(Number.isInteger(b.year), name).toBe(true);
      expect(b.min, name).toBeLessThanOrEqual(b.max);
    }
    expect(BALANCE.finance.illustrative.source).toBe('TODO-VERIFY');
    expect(Number.isInteger(BALANCE.finance.illustrative.year)).toBe(true);
  });

  it('finance thresholds (D21, D22)', () => {
    expect(BALANCE.finance).toMatchObject({ emergencyTarget: 300, unrealisticAbove: 0.2, laburBeforeEmergencyTekanan: 5, amanahYearly: 0.04 });
  });
});
