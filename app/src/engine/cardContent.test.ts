import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CardsFileSchema, CONTENT_FILES, MoneyCardSchema, MoneyCardsFileSchema, parseContent } from './schemas';
import { CONCEPTS } from './types';

const load = (f: string) => JSON.parse(readFileSync(new URL(`../../../content/${f}`, import.meta.url), 'utf8')) as unknown;

describe('MoneyCardSchema', () => {
  const base = { id: 'm1', concept: 'bajet', text: { ms: 'a' }, why: { ms: 'b' } };
  it('accepts truefalse and pick', () => {
    expect(MoneyCardSchema.safeParse({ ...base, kind: 'truefalse', answer: false }).success).toBe(true);
    expect(MoneyCardSchema.safeParse({ ...base, kind: 'pick', options: [{ ms: 'x' }, { ms: 'y' }], better: 1 }).success).toBe(true);
  });
  it('rejects bad pick/truefalse shapes', () => {
    expect(MoneyCardSchema.safeParse({ ...base, kind: 'pick', options: [{ ms: 'x' }], better: 0 }).success).toBe(false);
    expect(MoneyCardSchema.safeParse({ ...base, kind: 'pick', options: [{ ms: 'x' }, { ms: 'y' }, { ms: 'z' }], better: 0 }).success).toBe(false);
    expect(MoneyCardSchema.safeParse({ ...base, kind: 'pick', options: [{ ms: 'x' }, { ms: 'y' }], better: 2 }).success).toBe(false);
    expect(MoneyCardSchema.safeParse({ ...base, kind: 'truefalse', answer: 'true' }).success).toBe(false);
    expect(MoneyCardSchema.safeParse({ ...base, kind: 'truefalse' }).success).toBe(false);
  });
  it('rejects an unknown concept and a missing ms', () => {
    expect(MoneyCardSchema.safeParse({ ...base, concept: 'bola', kind: 'truefalse', answer: true }).success).toBe(false);
    expect(MoneyCardSchema.safeParse({ ...base, text: { en: 'a' }, kind: 'truefalse', answer: true }).success).toBe(false);
  });
  it('is registered', () => {
    expect(CONTENT_FILES['money-cards.json']).toBe(MoneyCardsFileSchema);
  });
});

describe('cards.json', () => {
  const cards = parseContent(CardsFileSchema, load('cards.json'), 'cards.json');
  it('has 18 scam and 12 legit, unique ids, mixed channels, includes c014', () => {
    expect(cards).toHaveLength(30);
    expect(cards.filter((c) => c.answer === 'scam')).toHaveLength(18);
    expect(cards.filter((c) => c.answer === 'legit')).toHaveLength(12);
    expect(new Set(cards.map((c) => c.id)).size).toBe(30);
    expect(new Set(cards.map((c) => c.channel)).size).toBe(3);
    expect(cards.find((c) => c.id === 'c014')?.answer).toBe('legit');
  });
  it('uses all seven tactics and fills en', () => {
    expect(new Set(cards.flatMap((c) => c.tactics)).size).toBe(7);
    for (const c of cards) {
      expect(c.text.en, c.id).toBeTruthy();
      expect(c.why.en, c.id).toBeTruthy();
    }
  });
  it('legit cards never ask for OTP/TAC or push a link', () => {
    for (const c of cards.filter((x) => x.answer === 'legit')) {
      expect(c.text.ms, c.id).not.toMatch(/\.test|http|klik|click/i);
      expect(c.text.ms, c.id).not.toMatch(/(beri|bagi|hantar|kongsi|share|send).{0,20}\b(otp|tac)\b/i);
    }
  });
});

describe('money-cards.json', () => {
  const cards = parseContent(MoneyCardsFileSchema, load('money-cards.json'), 'money-cards.json');
  it('has 20 cards, every concept >= 3, both kinds, unique ids', () => {
    expect(cards).toHaveLength(20);
    for (const c of CONCEPTS) expect(cards.filter((m) => m.concept === c).length, c).toBeGreaterThanOrEqual(3);
    expect(cards.some((c) => c.kind === 'truefalse')).toBe(true);
    expect(cards.some((c) => c.kind === 'pick')).toBe(true);
    expect(new Set(cards.map((c) => c.id)).size).toBe(20);
  });
  it('labels every rate as contoh', () => {
    for (const c of cards) {
      const all = JSON.stringify(c);
      if (/\d\s?%/.test(all)) expect(all.toLowerCase(), c.id).toContain('contoh');
    }
  });
});
