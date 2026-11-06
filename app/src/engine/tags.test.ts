import { describe, it, expect } from 'vitest';
import { parseLineTags, parseMeta, TagError } from './tags';

describe('parseLineTags', () => {
  it('parses flags with spaces', () => {
    expect(parseLineTags(['flag:greed:RM300 sehari']).flags).toEqual([
      { tactic: 'greed', phrase: 'RM300 sehari' },
    ]);
  });
  it('keeps colons inside flag phrases', () => {
    expect(parseLineTags(['flag:urgency:Jam 5: tamat']).flags[0].phrase).toBe('Jam 5: tamat');
  });
  it('parses effects', () => {
    const r = parseLineTags(['effect:duit:-100', 'effect:tekanan:+15', 'effect:akaun:Disekat', 'effect:rekod:Disiasat']);
    expect(r.effects).toEqual([
      { kind: 'duit', delta: -100 },
      { kind: 'tekanan', delta: 15 },
      { kind: 'akaun', value: 'Disekat' },
      { kind: 'rekod', value: 'Disiasat' },
    ]);
  });
  it('accepts unsigned deltas and rejects bad effects', () => {
    expect(parseLineTags(['effect:duit:15']).effects).toEqual([{ kind: 'duit', delta: 15 }]);
    expect(() => parseLineTags(['effect:duit:1.5'])).toThrow(TagError);
    expect(() => parseLineTags(['effect:akaun:Rosak'])).toThrow(TagError);
    expect(() => parseLineTags(['effect:rekod:Rosak'])).toThrow(TagError);
  });
  it('rejects effect:imuniti', () => {
    expect(() => parseLineTags(['effect:imuniti:+5'])).toThrow(TagError);
    expect(() => parseLineTags(['effect:imuniti:+5'])).toThrow(/effect:imuniti:\+5/);
  });
  it('parses outcome and missed', () => {
    const r = parseLineTags(['outcome:curiga', 'missed:400']);
    expect(r.outcome).toBe('curiga');
    expect(r.missed).toBe(400);
    expect(() => parseLineTags(['outcome:menang'])).toThrow(TagError);
    expect(() => parseLineTags(['missed:-1'])).toThrow(TagError);
  });
  it('parses ui directives', () => {
    expect(parseLineTags(['ui:transfer:1500']).ui).toEqual({ kind: 'transfer', amount: 1500 });
    expect(parseLineTags(['ui:link:kurierkilat-bayar.test/alamat']).ui).toEqual({
      kind: 'link',
      url: 'kurierkilat-bayar.test/alamat',
    });
    expect(() => parseLineTags(['ui:transfer:0'])).toThrow(TagError);
  });
  it('rejects ui:link without .test', () => {
    expect(() => parseLineTags(['ui:link:example.com/x'])).toThrow(TagError);
    expect(() => parseLineTags(['ui:link:https://a.test/x'])).toThrow(TagError);
  });
  it('ignores global meta keys', () => {
    const r = parseLineTags(['id:x', 'type:scam', 'tactics:greed', 'ui:call', 'hint:h', 'apa_patut:a', 'number:011-0000 0123', 'contact:K', 'family:job']);
    expect(r).toEqual({ flags: [], effects: [] });
  });
  it('rejects unknown tag key and unknown tactic', () => {
    expect(() => parseLineTags(['bogus:1'])).toThrow(TagError);
    expect(() => parseLineTags(['flag:magic:abc'])).toThrow(TagError);
  });
  it('parses the finance outcomes (D23)', () => {
    for (const o of ['untung', 'rugi', 'hutang'] as const) expect(parseLineTags([`outcome:${o}`]).outcome).toBe(o);
  });
  it('parses effect:labur with a product (D29)', () => {
    expect(parseLineTags(['effect:labur:amanah:+200']).effects).toEqual([{ kind: 'labur', product: 'amanah', delta: 200 }]);
    expect(parseLineTags(['effect:labur:ekuiti:-50']).effects).toEqual([{ kind: 'labur', product: 'ekuiti', delta: -50 }]);
  });
  it('rejects effect:labur without a product or with a bad amount', () => {
    expect(() => parseLineTags(['effect:labur:+200'])).toThrow(TagError);
    expect(() => parseLineTags(['effect:labur:+200'])).toThrow(/amanah\|ekuiti/);
    expect(() => parseLineTags(['effect:labur:saham:+200'])).toThrow(TagError);
    expect(() => parseLineTags(['effect:labur:amanah:1.5'])).toThrow(TagError);
  });
  it('parses ui:calc with a tab and preset (D21)', () => {
    expect(parseLineTags(['ui:calc:pulangan:naga30w']).ui).toEqual({ kind: 'calc', tab: 'pulangan', preset: 'naga30w' });
    expect(parseLineTags(['ui:calc:masa:simpan-50']).ui).toEqual({ kind: 'calc', tab: 'masa', preset: 'simpan-50' });
    expect(parseLineTags(['ui:calc:kos:bnpl_1000']).ui).toEqual({ kind: 'calc', tab: 'kos', preset: 'bnpl_1000' });
  });
  it('rejects ui:calc with a bad tab or preset', () => {
    expect(() => parseLineTags(['ui:calc:untung:naga30w'])).toThrow(TagError);
    expect(() => parseLineTags(['ui:calc:pulangan'])).toThrow(TagError);
    expect(() => parseLineTags(['ui:calc:pulangan:Naga 30'])).toThrow(TagError);
  });
  it('ignores the concepts global key on lines', () => {
    expect(parseLineTags(['concepts:bajet', 'type:finance'])).toEqual({ flags: [], effects: [] });
  });
});

describe('parseMeta', () => {
  const sample = [
    'id:kerja_sambilan', 'type:scam', 'family:job', 'tactics:greed,urgency,payfirst',
    'contact:Kak Mira (HR)', 'number:011-0000 0123',
    'hint:Syarikat sebenar tak minta bayaran untuk mula kerja.',
    'apa_patut:Semak syarikat dengan SSM sebelum setuju.',
  ];
  it('parses meta', () => {
    expect(parseMeta(sample)).toEqual({
      id: 'kerja_sambilan', type: 'scam', family: 'job',
      tactics: ['greed', 'urgency', 'payfirst'],
      contact: 'Kak Mira (HR)', number: '011-0000 0123', ui: 'chat',
      hint: 'Syarikat sebenar tak minta bayaran untuk mula kerja.',
      apaPatut: ['Semak syarikat dengan SSM sebelum setuju.'],
      concepts: [],
    });
  });
  it('handles ui:call, repeated apa_patut, optional fields', () => {
    const m = parseMeta(['id:a', 'type:legit', 'family:bank', 'tactics:', 'contact:Bank', 'ui:call', 'apa_patut:satu', 'apa_patut:dua']);
    expect(m.ui).toBe('call');
    expect(m.apaPatut).toEqual(['satu', 'dua']);
    expect(m.tactics).toEqual([]);
    expect(m.number).toBeUndefined();
    expect(m.hint).toBeUndefined();
  });
  it('rejects unknown tactic and unknown tag key', () => {
    expect(() => parseMeta([...sample, 'tactics:greed,magic'])).toThrow(TagError);
    expect(() => parseMeta([...sample, 'bogus:1'])).toThrow(/bogus:1/);
  });
  it('rejects bad number, family, type and missing required', () => {
    expect(() => parseMeta(sample.map((t) => (t.startsWith('number') ? 'number:012-3456 7890' : t)))).toThrow(TagError);
    expect(() => parseMeta(sample.map((t) => (t.startsWith('family') ? 'family:zzz' : t)))).toThrow(TagError);
    expect(() => parseMeta(sample.map((t) => (t.startsWith('type') ? 'type:maybe' : t)))).toThrow(TagError);
    expect(() => parseMeta(sample.filter((t) => !t.startsWith('id:')))).toThrow(TagError);
  });
  it('rejects a scam scenario with no tactics', () => {
    expect(() => parseMeta(sample.map((t) => (t.startsWith('tactics') ? 'tactics:' : t)))).toThrow(/tactic/);
  });
});

describe('parseMeta: finance and concepts (D23)', () => {
  const finance = ['id:dompet_minggu0', 'type:finance', 'family:budget', 'concepts:bajet,kecemasan', 'contact:Kak Long'];
  it('parses type:finance and concepts without tactics', () => {
    const m = parseMeta(finance);
    expect(m.type).toBe('finance');
    expect(m.family).toBe('budget');
    expect(m.concepts).toEqual(['bajet', 'kecemasan']);
    expect(m.tactics).toEqual([]);
  });
  it('accepts the new families budget and pay (D33)', () => {
    expect(parseMeta(finance.map((t) => (t.startsWith('family') ? 'family:pay' : t))).family).toBe('pay');
  });
  it('a finance scenario must declare at least one concept', () => {
    expect(() => parseMeta(finance.filter((t) => !t.startsWith('concepts')))).toThrow(/concept/);
    expect(() => parseMeta(finance.map((t) => (t.startsWith('concepts') ? 'concepts:' : t)))).toThrow(/concept/);
  });
  it('rejects an unknown concept', () => {
    expect(() => parseMeta(finance.map((t) => (t.startsWith('concepts') ? 'concepts:bajet,saham' : t)))).toThrow(/saham/);
  });
  it('accepts concepts on a scam scenario (D30)', () => {
    const m = parseMeta(['id:crypto_naga', 'type:scam', 'family:investment', 'tactics:greed,social,urgency', 'concepts:risiko,semak', 'contact:Abang Rizal']);
    expect(m.tactics).toEqual(['greed', 'social', 'urgency']);
    expect(m.concepts).toEqual(['risiko', 'semak']);
  });
  it('scam and legit still require the tactics tag', () => {
    expect(() => parseMeta(['id:a', 'type:legit', 'family:bank', 'contact:Bank'])).toThrow(/tactics/);
  });
});

describe('duplicate codes in list tags (Task 11 review)', () => {
  const base = ['id:x', 'type:scam', 'family:job', 'contact:X'];
  it('rejects a duplicate tactic in "# tactics:"', () => {
    expect(() => parseMeta([...base, 'tactics:greed, urgency, greed'])).toThrow(TagError);
    expect(() => parseMeta([...base, 'tactics:greed, urgency, greed'])).toThrow(/greed/);
  });
  it('rejects a duplicate concept in "# concepts:"', () => {
    expect(() => parseMeta([...base, 'tactics:greed', 'concepts:risiko,risiko'])).toThrow(TagError);
    expect(() => parseMeta([...base, 'tactics:greed', 'concepts:risiko,risiko'])).toThrow(/risiko/);
  });
});
