import { describe, expect, it } from 'vitest';
import { DEFAULT_SPLIT, rebalance, SUGGESTED_SPLIT } from './split';

const sum = (s: { needs: number; wants: number; savings: number }) => s.needs + s.wants + s.savings;
const fives = (s: { needs: number; wants: number; savings: number }) =>
  [s.needs, s.wants, s.savings].every((v) => v % 5 === 0 && v >= 0 && v <= 100);

describe('budget split rebalancing', () => {
  it('starts and suggests valid splits', () => {
    expect(sum(DEFAULT_SPLIT)).toBe(100);
    expect(SUGGESTED_SPLIT).toEqual({ needs: 50, wants: 30, savings: 20 });
  });

  it('moves the other two in proportion to their current share', () => {
    // 50/30/20 -> savings 40: the 60 left is shared 50:30 -> 37.5/22.5 -> snapped to fives, still 100.
    const s = rebalance({ needs: 50, wants: 30, savings: 20 }, 'savings', 40);
    expect(s.savings).toBe(40);
    expect(sum(s)).toBe(100);
    expect(fives(s)).toBe(true);
    expect(s.needs).toBeGreaterThan(s.wants);
    expect([s.needs, s.wants]).toEqual([40, 20]);
  });

  it('keeps an exact proportion when it lands on fives', () => {
    expect(rebalance({ needs: 60, wants: 20, savings: 20 }, 'needs', 40)).toEqual({ needs: 40, wants: 30, savings: 30 });
  });

  it('splits evenly when the other two are both zero', () => {
    expect(rebalance({ needs: 100, wants: 0, savings: 0 }, 'needs', 50)).toEqual({ needs: 50, wants: 25, savings: 25 });
    const odd = rebalance({ needs: 100, wants: 0, savings: 0 }, 'needs', 95);
    expect(sum(odd)).toBe(100);
    expect(fives(odd)).toBe(true);
  });

  it('snaps to steps of 5 and clamps to 0..100', () => {
    const a = rebalance({ needs: 50, wants: 30, savings: 20 }, 'wants', 33);
    expect(a.wants).toBe(35);
    expect(sum(a)).toBe(100);
    expect(rebalance({ needs: 50, wants: 30, savings: 20 }, 'needs', 140)).toEqual({ needs: 100, wants: 0, savings: 0 });
    const b = rebalance({ needs: 50, wants: 30, savings: 20 }, 'needs', -10);
    expect(b.needs).toBe(0);
    expect(sum(b)).toBe(100);
  });

  it('every slider value from every split keeps the sum at 100 in fives', () => {
    const keys = ['needs', 'wants', 'savings'] as const;
    let s = { ...DEFAULT_SPLIT };
    for (let i = 0; i < 200; i++) {
      const k = keys[i % 3];
      s = rebalance(s, k, (i * 35) % 105);
      expect(sum(s)).toBe(100);
      expect(fives(s)).toBe(true);
    }
  });
});
