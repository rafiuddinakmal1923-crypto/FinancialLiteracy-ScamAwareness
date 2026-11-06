import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { pickAdaptive, scamShare, semesterPlan, tacticWeight, type ScenarioInfo } from './scheduler';
import { ContentError, SemesterFileSchema, parseContent } from './schemas';
import { CONCEPTS, TACTICS, type Concept, type Family, type ScenarioType, type Tactic } from './types';

const sem = parseContent(SemesterFileSchema, JSON.parse(readFileSync(new URL('../../../content/semester.json', import.meta.url), 'utf8')), 'semester.json');

const TABLE: [string, ScenarioType, Family][] = [
  ['kerja_sambilan', 'scam', 'job'], ['dompet_minggu0', 'finance', 'budget'], ['sewa_akaun', 'scam', 'mule'],
  ['gaji_pertama', 'finance', 'pay'], ['kawan_labur', 'finance', 'investment'], ['alert_bankku', 'legit', 'bank'],
  ['crypto_naga', 'scam', 'investment'], ['bayar_nanti', 'finance', 'loan'], ['buku_terpakai', 'legit', 'marketplace'],
  ['panggilan_mahkamah', 'scam', 'authority'],
];
const infos: Record<string, ScenarioInfo> = Object.fromEntries(
  TABLE.map(([id, type, family]) => [id, { id, type, family, tactics: [], concepts: [] }]),
);

const info = (id: string, family: Family, tactics: Tactic[] = [], concepts: Concept[] = [], type: ScenarioType = 'scam'): ScenarioInfo =>
  ({ id, type, family, tactics, concepts });
const flat = (n: number) => ({
  imuniti: Object.fromEntries(TACTICS.map((t) => [t, n])) as Record<Tactic, number>,
  celik: Object.fromEntries(CONCEPTS.map((c) => [c, n])) as Record<Concept, number>,
});

describe('tacticWeight', () => {
  it('is base - score + bonus', () => {
    expect(tacticWeight(30)).toBe(80);
    expect(tacticWeight(100)).toBe(BALANCE.adaptive.bonus);
    expect(tacticWeight(0)).toBe(BALANCE.adaptive.base + BALANCE.adaptive.bonus);
  });
});

describe('semesterPlan on the real semester.json', () => {
  const plan = semesterPlan(sem, infos);
  it('has 12 entries with null scenarios in weeks 7 and 12', () => {
    expect(plan.map((p) => p.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(plan[6]!.scenario).toBeNull();
    expect(plan[11]!.scenario).toBeNull();
  });
  it('never repeats a family back to back (non-null sequence)', () => {
    const fams = plan.filter((p) => p.scenario).map((p) => p.scenario!.family);
    for (let i = 1; i < fams.length; i++) expect(fams[i]).not.toBe(fams[i - 1]);
  });
  it('scam share is 0.4 and inside the band', () => {
    expect(scamShare(plan)).toBeCloseTo(0.4, 10);
    expect(scamShare(plan)).toBeGreaterThanOrEqual(BALANCE.adaptive.scamShareMin);
    expect(scamShare(plan)).toBeLessThanOrEqual(BALANCE.adaptive.scamShareMax);
  });
  it('plays kawan_labur before crypto_naga', () => {
    const wk = (id: string) => plan.find((p) => p.scenario?.id === id)!.week;
    expect(wk('kawan_labur')).toBe(5);
    expect(wk('kawan_labur')).toBeLessThan(wk('crypto_naga'));
  });
  it('throws naming a missing id when strict, nulls it when not', () => {
    const partial = { kerja_sambilan: infos.kerja_sambilan! };
    expect(() => semesterPlan(sem, partial)).toThrow(ContentError);
    expect(() => semesterPlan(sem, partial)).toThrow(/dompet_minggu0/);
    const p = semesterPlan(sem, partial, { strict: false });
    expect(p[0]!.scenario?.id).toBe('kerja_sambilan');
    expect(p[1]!.scenario).toBeNull();
  });
  it('scamShare of an empty plan is 0', () => {
    expect(scamShare([{ week: 1, scenario: null }])).toBe(0);
  });
});

describe('pickAdaptive', () => {
  it('prefers the weakest tactic', () => {
    const state = flat(80);
    state.imuniti.fear = 10;
    const pick = pickAdaptive([info('a', 'job', ['greed']), info('b', 'loan', ['fear'])], state, null);
    expect(pick.id).toBe('b');
  });
  it('prefers the weakest concept', () => {
    const state = flat(80);
    state.celik.kompaun = 5;
    const pick = pickAdaptive([info('a', 'job', [], ['bajet'], 'finance'), info('b', 'pay', [], ['kompaun'], 'finance')], state, null);
    expect(pick.id).toBe('b');
  });
  it('sums weights over tactics and concepts', () => {
    const state = flat(50);
    const pick = pickAdaptive([info('a', 'job', ['greed']), info('b', 'loan', ['fear', 'urgency'])], state, null);
    expect(pick.id).toBe('b');
  });
  it('skips lastFamily when another candidate exists, else allows it', () => {
    const state = flat(50);
    state.imuniti.fear = 0;
    const cands = [info('a', 'job', ['fear']), info('b', 'loan', ['greed'])];
    expect(pickAdaptive(cands, state, 'job').id).toBe('b');
    expect(pickAdaptive([cands[0]!], state, 'job').id).toBe('a');
  });
  it('honours the before-constraint', () => {
    const state = flat(50);
    state.imuniti.greed = 0;
    const cands = [info('crypto_naga', 'investment', ['greed']), info('kawan_labur', 'budget', [], [], 'finance')];
    expect(pickAdaptive(cands, state, null).id).toBe('crypto_naga');
    expect(pickAdaptive(cands, state, null, BALANCE, { before: [['kawan_labur', 'crypto_naga']] }).id).toBe('kawan_labur');
    // once kawan_labur is no longer a candidate, crypto_naga is free
    expect(pickAdaptive([cands[0]!], state, null, BALANCE, { before: [['kawan_labur', 'crypto_naga']] }).id).toBe('crypto_naga');
  });
  it('breaks ties by id deterministically', () => {
    const state = flat(50);
    const a = info('zeta', 'job', ['greed']);
    const b = info('alpha', 'loan', ['greed']);
    expect(pickAdaptive([a, b], state, null).id).toBe('alpha');
    expect(pickAdaptive([b, a], state, null).id).toBe('alpha');
  });
  it('throws on an empty list', () => {
    expect(() => pickAdaptive([], flat(50), null)).toThrow();
  });
});
