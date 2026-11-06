import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TACTICS } from './types';
import { CardsFileSchema, ContentError, TacticsFileSchema, parseContent } from './schemas';

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
