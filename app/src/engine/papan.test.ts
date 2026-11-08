import { describe, expect, it } from 'vitest';
import { rankClassmates } from './papan';

const place = (grade: number) => rankClassmates(grade).findIndex((r) => r.player);

describe('rankClassmates', () => {
  it('has 9 classmates and one player', () => {
    const rows = rankClassmates(65.5);
    expect(rows).toHaveLength(10);
    expect(rows.filter((r) => r.player)).toEqual([{ id: 'player', grade: 65.5, player: true, change: null }]);
  });

  it('sorts highest first', () => {
    const grades = rankClassmates(65.5).map((r) => r.grade);
    expect(grades).toEqual([...grades].sort((a, b) => b - a));
  });

  it('places the player at grades 0, 65.5 and 100', () => {
    expect(place(0)).toBe(9);
    expect(place(65.5)).toBe(5);
    expect(place(100)).toBe(0);
  });

  it('places the player above a classmate on a tie', () => {
    expect(place(67)).toBe(4);
  });
});

describe('classmates over the semester (scaled by week, with ups and downs)', () => {
  const classmates = (week: number) => rankClassmates(50, week).filter((r) => !r.player);
  const byId = (week: number) => Object.fromEntries(classmates(week).map((r) => [r.id, r.grade]));

  it('week 12 and later give the final grades from balance.ts', () => {
    expect(rankClassmates(65.5, 12).map((r) => r.grade)).toEqual(rankClassmates(65.5).map((r) => r.grade));
    expect(byId(14)).toEqual(byId(12));
  });

  it('early in the semester classmates sit near the starting score, not their final grade', () => {
    for (const g of Object.values(byId(1))) expect(g).toBeLessThan(35);
    // A fresh player (about 21) is mid-table at week 1, not last.
    const place = rankClassmates(21, 1).findIndex((r) => r.player);
    expect(place).toBeGreaterThan(0);
    expect(place).toBeLessThan(9);
  });

  it('grades rise over the semester on the whole', () => {
    const avg = (w: number) => Object.values(byId(w)).reduce((a, b) => a + b, 0) / 9;
    expect(avg(4)).toBeLessThan(avg(8));
    expect(avg(8)).toBeLessThan(avg(12));
  });

  it('some classmates go down in some weeks, and each row reports its change', () => {
    let downs = 0;
    for (let w = 2; w <= 12; w++) {
      for (const r of classmates(w)) {
        expect(r.change).toBeCloseTo(r.grade - byId(w - 1)[r.id], 5);
        if ((r.change ?? 0) < 0) downs++;
      }
    }
    expect(downs).toBeGreaterThan(0);
  });

  it('is the same on every call (no randomness), stays in 0-100 with one decimal', () => {
    for (let w = 0; w <= 12; w++) {
      expect(byId(w)).toEqual(byId(w));
      for (const g of Object.values(byId(w))) {
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(100);
        expect(Math.round(g * 10) / 10).toBe(g);
      }
    }
  });

  it('the player row has no change and week 0 rows have none', () => {
    expect(rankClassmates(50, 5).find((r) => r.player)?.change).toBeNull();
    for (const r of classmates(0)) expect(r.change).toBeNull();
  });
});
