import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONCEPTS, TACTICS } from './types';
import { CONTENT_FILES, CardsFileSchema, ConceptsFileSchema, ContentError, DrillsFileSchema, PagesFileSchema, TacticsFileSchema, parseContent } from './schemas';

const loc = (ms: string) => ({ ms });
const tactic = (code: string) => ({
  code, name: loc('n'), does: loc('d'), cue: loc('c'), tip: loc('t'),
});

describe('content schemas', () => {
  it('rejects an unknown tactic code', () => {
    expect(() => parseContent(TacticsFileSchema, [tactic('lust')], 'tactics.json')).toThrow(ContentError);
    expect(() => parseContent(TacticsFileSchema, [tactic('lust')], 'tactics.json')).toThrow(/tactics\.json/);
  });

  it('rejects a legit swipe card with tactics', () => {
    const card = {
      id: 'c1', channel: 'sms', sender: 'Bank', text: loc('hi'),
      answer: 'legit', tactics: ['greed'], why: loc('ok'),
    };
    expect(() => parseContent(CardsFileSchema, [card], 'cards.json')).toThrow(ContentError);
  });

  it('rejects a missing ms string', () => {
    const card = {
      id: 'c1', channel: 'sms', sender: 'Bank', text: { en: 'x' },
      answer: 'scam', tactics: ['greed'], why: loc('ok'),
    };
    expect(() => parseContent(CardsFileSchema, [card], 'cards.json')).toThrow(/cards\.json: 0\.text\.ms/);
  });

  it('accepts the real tactics.json', () => {
    const raw = JSON.parse(readFileSync(new URL('../../../content/tactics.json', import.meta.url), 'utf8'));
    const parsed = parseContent(TacticsFileSchema, raw, 'tactics.json');
    expect(parsed).toHaveLength(7);
    expect(parsed.map((t) => t.code)).toEqual([...TACTICS]);
  });
});

describe('concepts.json (D23, D27, UI-SPEC S21)', () => {
  const concept = (code: string) => ({
    code, name: loc('n'), apa: loc('a'), contoh: loc('c'), duniaSebenar: loc('d'), caraSemak: loc('s'),
  });
  const all = () => CONCEPTS.map(concept);

  it('is registered in CONTENT_FILES', () => {
    expect(CONTENT_FILES['concepts.json']).toBe(ConceptsFileSchema);
  });

  it('accepts one entry per concept with optional figure markers', () => {
    const list = all();
    list[2] = { ...list[2], contoh: { ms: 'contoh 5% setahun', verify: 'TODO-VERIFY', year: 2026 } as never };
    expect(parseContent(ConceptsFileSchema, list, 'concepts.json')).toHaveLength(6);
  });

  it('rejects an unknown code, a missing section and a missing concept', () => {
    expect(() => parseContent(ConceptsFileSchema, [...all().slice(0, 5), concept('saham')], 'concepts.json')).toThrow(ContentError);
    const noCaraSemak = all().map(({ caraSemak: _c, ...rest }) => rest);
    expect(() => parseContent(ConceptsFileSchema, noCaraSemak, 'concepts.json')).toThrow(/caraSemak/);
    expect(() => parseContent(ConceptsFileSchema, all().slice(0, 5), 'concepts.json')).toThrow(/semak/);
    expect(() => parseContent(ConceptsFileSchema, [...all().slice(0, 5), concept('bajet')], 'concepts.json')).toThrow(/bajet/);
  });

  it('accepts the real concepts.json: 6 entries, every section in BM', () => {
    const raw = JSON.parse(readFileSync(new URL('../../../content/concepts.json', import.meta.url), 'utf8'));
    const parsed = parseContent(ConceptsFileSchema, raw, 'concepts.json');
    expect(parsed).toHaveLength(6);
    expect(parsed.map((c) => c.code)).toEqual([...CONCEPTS]);
    for (const c of parsed) {
      for (const k of ['name', 'apa', 'contoh', 'duniaSebenar', 'caraSemak'] as const) expect(c[k].ms.length, `${c.code}.${k}`).toBeGreaterThan(0);
      expect(c.contoh.ms.toLowerCase(), c.code).toContain('contoh');
      // Money voice (UI-SPEC 6): explain, never tell the player to buy.
      const all = [c.apa, c.contoh, c.duniaSebenar, c.caraSemak].map((t) => t.ms).join(' ');
      expect(all, c.code).not.toMatch(/\b(beli|membeli|belilah)\b/i);
    }
  });
});

describe('pages.json (Task 15, fake .test pages)', () => {
  const page = (asksTac: boolean) => ({
    title: loc('t'), body: loc('b'), fields: [{ label: loc('Penerima'), value: 'Pelajar UCR (contoh)' }],
    button: loc('Bayar'), asksTac,
  });

  it('is registered in CONTENT_FILES', () => {
    expect(CONTENT_FILES['pages.json']).toBe(PagesFileSchema);
  });

  it('accepts pages keyed by a .test host', () => {
    const parsed = parseContent(PagesFileSchema, { 'kurierkilat-bayar.test': page(true), 'cryptonaga.test': page(false) }, 'pages.json');
    expect(Object.keys(parsed)).toEqual(['kurierkilat-bayar.test', 'cryptonaga.test']);
  });

  it('rejects a non-.test host, a path in the key and a missing asksTac', () => {
    expect(() => parseContent(PagesFileSchema, { 'bayar.com': page(true) }, 'pages.json')).toThrow(ContentError);
    expect(() => parseContent(PagesFileSchema, { 'bayar.test/x': page(true) }, 'pages.json')).toThrow(ContentError);
    const { asksTac: _a, ...noTac } = page(true);
    expect(() => parseContent(PagesFileSchema, { 'bayar.test': noTac }, 'pages.json')).toThrow(/asksTac/);
  });

  it('accepts the real pages.json, with the two required pages', () => {
    const raw = JSON.parse(readFileSync(new URL('../../../content/pages.json', import.meta.url), 'utf8'));
    const parsed = parseContent(PagesFileSchema, raw, 'pages.json');
    expect(parsed['kurierkilat-bayar.test']?.asksTac).toBe(true);
    expect(parsed['cryptonaga.test']?.asksTac).toBe(false);
  });
});

describe('drills.json (Task 27, S16)', () => {
  const raw = JSON.parse(readFileSync(new URL('../../../content/drills.json', import.meta.url), 'utf8'));
  it('is registered and parses', () => {
    expect(CONTENT_FILES['drills.json']).toBe(DrillsFileSchema);
    const d = parseContent(DrillsFileSchema, raw, 'drills.json');
    expect(d.call997.steps.length).toBeGreaterThanOrEqual(5);
    expect(d.call997.checklist.length).toBeGreaterThanOrEqual(3);
    expect(d.actions.map((a) => a.id)).toEqual(['save-997', 'bookmark-semak', 'bank-alerts', 'savings-goal', 'check-licence', 'tell-family']);
    expect(d.actions.every((a) => a.stars === 1)).toBe(true);
  });
  it('knows the mule account (3 reports) and a clean one (0)', () => {
    const d = parseContent(DrillsFileSchema, raw, 'drills.json');
    expect(d.semak.accounts).toContainEqual({ number: '0000-0000-0638', reports: 3 });
    expect(d.semak.accounts).toContainEqual({ number: '0000-0000-0111', reports: 0 });
  });
  it('rejects a real-looking account number', () => {
    const bad = { ...raw, semak: { ...raw.semak, accounts: [{ number: '1234-5678-9012', reports: 1 }] } };
    expect(() => parseContent(DrillsFileSchema, bad, 'drills.json')).toThrow(ContentError);
  });
  it('rejects duplicate action ids', () => {
    const bad = { ...raw, actions: [raw.actions[0], raw.actions[0]] };
    expect(() => parseContent(DrillsFileSchema, bad, 'drills.json')).toThrow(/duplicate/);
  });
});
