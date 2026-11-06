import { dayDiff, isoWeek } from './dates';
import type { MoneyCard, SwipeCard } from './schemas';

export type DeckCard = { kind: 'swipe'; card: SwipeCard } | { kind: 'money'; card: MoneyCard };

/** Deterministic PRNG: the same seed always gives the same sequence (no Math.random anywhere in the engine). */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hash of a string, for seeding from a date. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Fisher-Yates on a copy. */
export function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Card-kind orders for the daily five: kinds always interleave (never 3 swipe then 2 money, or the reverse). */
const PATTERNS: ('s' | 'm')[][] = [
  ['s', 'm', 's', 'm', 's'], ['s', 's', 'm', 's', 'm'], ['m', 's', 's', 'm', 's'],
  ['s', 'm', 's', 's', 'm'], ['m', 's', 'm', 's', 's'], ['s', 's', 'm', 'm', 's'],
];

/**
 * Cek Harian deck: 3 swipe cards (at least one scam and one legit) + 2 money cards, the same for a given date.
 * A seeded shuffle keeps it stable all day and across devices.
 */
export function dailyDeck(date: string, swipe: SwipeCard[], money: MoneyCard[]): DeckCard[] {
  const rand = mulberry32(hashString(date));
  const sw = shuffle(swipe, rand);
  const scam = sw.find((c) => c.answer === 'scam');
  const legit = sw.find((c) => c.answer === 'legit');
  const chosen: SwipeCard[] = [scam, legit].filter((c): c is SwipeCard => !!c);
  for (const c of sw) if (chosen.length < 3 && !chosen.includes(c)) chosen.push(c);
  const swipes = shuffle(chosen, rand);
  const moneys = shuffle(money, rand).slice(0, 2);
  const pattern = PATTERNS[Math.floor(rand() * PATTERNS.length)];
  let si = 0;
  let mi = 0;
  const deck: DeckCard[] = [];
  for (const k of pattern) {
    if (k === 's' && si < swipes.length) deck.push({ kind: 'swipe', card: swipes[si++] });
    else if (k === 'm' && mi < moneys.length) deck.push({ kind: 'money', card: moneys[mi++] });
  }
  return deck;
}

export type HarianStreak = { streak: number; lastPlayed: string | null; freezeWeek: string | null; best: number };

/**
 * Streak after playing Cek Harian on `today` (YYYY-MM-DD, local). Same day or a clock moved back: unchanged.
 * Next day: +1. Exactly one missed day: bridged (+1) by the weekly freeze if it is unused this ISO week.
 * Anything else restarts at 1.
 */
export function updateHarianStreak(s: HarianStreak, today: string): HarianStreak {
  const bump = (streak: number, freezeWeek: string | null): HarianStreak => ({
    streak, lastPlayed: today, freezeWeek, best: Math.max(s.best, streak),
  });
  if (s.lastPlayed === null) return bump(1, s.freezeWeek);
  const gap = dayDiff(s.lastPlayed, today);
  if (gap <= 0) return s;
  if (gap === 1) return bump(s.streak + 1, s.freezeWeek);
  const week = isoWeek(today);
  if (gap === 2 && s.freezeWeek !== week) return bump(s.streak + 1, week);
  return bump(1, s.freezeWeek);
}

/** Cards for the 60-second Sahih atau Scam round: `n` cards, at least 3 scam and 3 legit when available. */
export function pickRound(cards: SwipeCard[], n: number, seed: number): SwipeCard[] {
  const rand = mulberry32(seed);
  const all = shuffle(cards, rand);
  const minEach = Math.min(3, Math.floor(n / 2));
  const chosen: SwipeCard[] = [
    ...all.filter((c) => c.answer === 'scam').slice(0, minEach),
    ...all.filter((c) => c.answer === 'legit').slice(0, minEach),
  ];
  for (const c of all) if (chosen.length < n && !chosen.includes(c)) chosen.push(c);
  return shuffle(chosen.slice(0, n), rand);
}
