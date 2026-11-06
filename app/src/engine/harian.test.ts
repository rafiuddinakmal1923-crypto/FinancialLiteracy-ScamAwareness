import { describe, expect, it } from 'vitest';
import { dailyDeck, pickRound, updateHarianStreak, type HarianStreak } from './harian';
import type { MoneyCard, SwipeCard } from './schemas';
import { CONCEPTS } from './types';

const swipe: SwipeCard[] = Array.from({ length: 30 }, (_, i) => ({
  id: `c${i}`, channel: 'sms', sender: 'X', text: { ms: `t${i}` }, answer: i < 18 ? 'scam' : 'legit',
  tactics: i < 18 ? ['urgency'] : [], why: { ms: 'w' },
}));
const money: MoneyCard[] = Array.from({ length: 20 }, (_, i) => ({
  id: `m${i}`, kind: 'truefalse', concept: CONCEPTS[i % CONCEPTS.length], text: { ms: `m${i}` }, answer: true, why: { ms: 'w' },
}));

const ids = (d: ReturnType<typeof dailyDeck>) => d.map((c) => c.card.id).join(',');

describe('dailyDeck', () => {
  it('is the same for the same date and has 3 swipe + 2 money', () => {
    const a = dailyDeck('2026-11-07', swipe, money);
    expect(ids(a)).toBe(ids(dailyDeck('2026-11-07', swipe, money)));
    expect(a).toHaveLength(5);
    expect(a.filter((c) => c.kind === 'swipe')).toHaveLength(3);
    expect(a.filter((c) => c.kind === 'money')).toHaveLength(2);
    expect(new Set(a.map((c) => c.card.id)).size).toBe(5);
  });
  it('differs across dates', () => {
    const decks = new Set(Array.from({ length: 10 }, (_, i) => ids(dailyDeck(`2026-11-${String(i + 1).padStart(2, '0')}`, swipe, money))));
    expect(decks.size).toBeGreaterThan(1);
  });
  it('always has at least one scam and one legit swipe card, and mixes kinds', () => {
    for (let i = 1; i <= 60; i++) {
      const d = dailyDeck(`2026-10-${String(i).padStart(2, '0')}`, swipe, money);
      const sw = d.filter((c) => c.kind === 'swipe').map((c) => c.card as SwipeCard);
      expect(sw.some((c) => c.answer === 'scam')).toBe(true);
      expect(sw.some((c) => c.answer === 'legit')).toBe(true);
      const kinds = d.map((c) => c.kind).join(',');
      expect(kinds).not.toBe('swipe,swipe,swipe,money,money');
      expect(kinds).not.toBe('money,money,swipe,swipe,swipe');
    }
  });
});

const S = (p: Partial<HarianStreak>): HarianStreak => ({ streak: 0, lastPlayed: null, freezeWeek: null, best: 0, ...p });

describe('updateHarianStreak (Review Focus 4)', () => {
  it('first play starts at 1', () => {
    expect(updateHarianStreak(S({}), '2026-11-02')).toEqual(S({ streak: 1, lastPlayed: '2026-11-02', best: 1 }));
  });
  it('same day is unchanged', () => {
    const s = S({ streak: 3, lastPlayed: '2026-11-04', best: 5 });
    expect(updateHarianStreak(s, '2026-11-04')).toEqual(s);
  });
  it('next day adds 1 and updates best', () => {
    expect(updateHarianStreak(S({ streak: 3, lastPlayed: '2026-11-04', best: 3 }), '2026-11-05')).toMatchObject({ streak: 4, best: 4, lastPlayed: '2026-11-05' });
    expect(updateHarianStreak(S({ streak: 3, lastPlayed: '2026-11-04', best: 9 }), '2026-11-05').best).toBe(9);
  });
  it('next day across month and year boundary', () => {
    expect(updateHarianStreak(S({ streak: 2, lastPlayed: '2026-12-31', best: 2 }), '2027-01-01').streak).toBe(3);
  });
  it('one missed day is bridged by the weekly freeze', () => {
    const r = updateHarianStreak(S({ streak: 4, lastPlayed: '2026-11-02', best: 4 }), '2026-11-04'); // Mon -> Wed
    expect(r).toMatchObject({ streak: 5, freezeWeek: '2026-W45', lastPlayed: '2026-11-04', best: 5 });
  });
  it('a second missed-day gap in the same ISO week resets', () => {
    const r = updateHarianStreak(S({ streak: 5, lastPlayed: '2026-11-04', freezeWeek: '2026-W45', best: 5 }), '2026-11-06'); // Wed -> Fri
    expect(r).toMatchObject({ streak: 1, freezeWeek: '2026-W45', best: 5 });
  });
  it('the freeze comes back on a new ISO week', () => {
    const r = updateHarianStreak(S({ streak: 5, lastPlayed: '2026-11-08', freezeWeek: '2026-W45', best: 5 }), '2026-11-10'); // Sun -> Tue, new week
    expect(r).toMatchObject({ streak: 6, freezeWeek: '2026-W46' });
  });
  it('two or more missed days reset even with the freeze free', () => {
    expect(updateHarianStreak(S({ streak: 6, lastPlayed: '2026-11-02', best: 6 }), '2026-11-05')).toMatchObject({ streak: 1, best: 6 });
  });
  it('a clock moved back leaves everything unchanged', () => {
    const s = S({ streak: 6, lastPlayed: '2026-11-05', freezeWeek: '2026-W45', best: 6 });
    expect(updateHarianStreak(s, '2026-11-01')).toEqual(s);
  });
});

describe('pickRound', () => {
  it('returns n cards with at least 3 scam and 3 legit, deterministic by seed', () => {
    const a = pickRound(swipe, 10, 42);
    expect(a).toHaveLength(10);
    expect(new Set(a.map((c) => c.id)).size).toBe(10);
    expect(a.filter((c) => c.answer === 'scam').length).toBeGreaterThanOrEqual(3);
    expect(a.filter((c) => c.answer === 'legit').length).toBeGreaterThanOrEqual(3);
    expect(pickRound(swipe, 10, 42).map((c) => c.id)).toEqual(a.map((c) => c.id));
    const others = new Set(Array.from({ length: 8 }, (_, s) => pickRound(swipe, 10, s).map((c) => c.id).join()));
    expect(others.size).toBeGreaterThan(1);
  });
  it('copes with fewer cards than n', () => {
    expect(pickRound(swipe.slice(0, 4), 10, 1)).toHaveLength(4);
  });
});
