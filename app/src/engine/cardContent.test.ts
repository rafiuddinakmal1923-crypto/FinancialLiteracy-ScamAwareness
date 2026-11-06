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

describe('cards.json hygiene', () => {
  const cards = parseContent(CardsFileSchema, load('cards.json'), 'cards.json');
  const PHONE = /(?<![\d+])(?:\+?6)?0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4}(?!\d)/g;
  const texts = (c: (typeof cards)[number]) => [c.text.ms, c.text.en ?? '', c.why.ms, c.why.en ?? ''];
  it('every URL-like token ends in .test', () => {
    for (const c of cards) {
      for (const t of texts(c)) {
        for (const m of t.matchAll(/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?/gi)) {
          expect(m[0].split('/')[0], `${c.id}: ${m[0]}`).toMatch(/\.test$/);
        }
      }
    }
  });
  it('every phone number is 01X-0000 0NNN, and legit cards have none', () => {
    for (const c of cards) {
      for (const t of texts(c)) {
        for (const m of t.matchAll(PHONE)) expect(m[0], c.id).toMatch(/^01\d-0000 0\d{3}$/);
        if (c.answer === 'legit') expect(t.match(PHONE), `${c.id} legit has a number`).toBeNull();
      }
    }
  });
});

describe('money-cards.json', () => {
  const cards = parseContent(MoneyCardsFileSchema, load('money-cards.json'), 'money-cards.json');
  it('has en on text, why and options', () => {
    for (const c of cards) {
      expect(c.text.en, c.id).toBeTruthy();
      expect(c.why.en, c.id).toBeTruthy();
      if (c.kind === 'pick') for (const o of c.options) expect(o.en, c.id).toBeTruthy();
    }
  });
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
