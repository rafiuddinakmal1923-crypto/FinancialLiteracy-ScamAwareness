// Task 24: the finished semester content. Compiles the REAL scenarios and checks the set as a whole (counts, concept
// coverage, the plan, the Red Flag cards) and each scenario's paths (right and wrong calls).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadCelikContent } from '../../vite-plugins/ink';
import { deriveCards } from './cards';
import { enumeratePaths } from './compile';
import { BALANCE } from './balance';
import { scamShare, semesterPlan } from './scheduler';
import { SemesterFileSchema, parseContent } from './schemas';
import { CONCEPTS, type CompiledScenario, type Outcome } from './types';

const contentDir = fileURLToPath(new URL('../../../content', import.meta.url));
const { data, problems } = loadCelikContent(contentDir);
const all = data.scenarios;
const list = Object.values(all);
const IDS = [
  'kerja_sambilan', 'dompet_minggu0', 'sewa_akaun', 'gaji_pertama', 'kawan_labur',
  'alert_bankku', 'crypto_naga', 'bayar_nanti', 'buku_terpakai', 'panggilan_mahkamah',
];
const sem = parseContent(
  SemesterFileSchema, JSON.parse(readFileSync(`${contentDir}/semester.json`, 'utf8')), 'semester.json',
);
const outcomesOf = (s: CompiledScenario): Set<Outcome> =>
  new Set(enumeratePaths(s.json).map((p) => p.outcome as Outcome));

describe('the ten semester scenarios', () => {
  it('all compile with no content problems', () => {
    expect(problems).toEqual([]);
    expect(Object.keys(all).sort()).toEqual([...IDS].sort());
  });

  it('are 4 scam, 2 legit and 4 finance', () => {
    const count = (type: string) => list.filter((s) => s.meta.type === type).length;
    expect([count('scam'), count('legit'), count('finance')]).toEqual([4, 2, 4]);
  });

  it('teach every finance concept at least once', () => {
    const taught = new Set(list.flatMap((s) => s.meta.concepts ?? []));
    for (const c of CONCEPTS) expect(taught.has(c), `concept ${c}`).toBe(true);
  });

  it('are exactly the scenarios semester.json references', () => {
    const ids = sem.weeks.map((w) => w.scenario).filter((x): x is string => x !== null);
    expect(ids.sort()).toEqual([...IDS].sort());
    for (const id of ids) expect(all[id], id).toBeDefined();
  });

  it('never repeat a family back to back across the real plan, with the 40% scam share', () => {
    const plan = semesterPlan(sem, Object.fromEntries(list.map((s) => [s.meta.id, s.meta])));
    const families = plan.filter((p) => p.scenario).map((p) => p.scenario!.family);
    families.forEach((f, i) => { if (i > 0) expect(f, `week order ${i}`).not.toBe(families[i - 1]); });
    expect(scamShare(plan)).toBeCloseTo(0.4, 5);
    expect(scamShare(plan)).toBeGreaterThanOrEqual(BALANCE.adaptive.scamShareMin);
    expect(scamShare(plan)).toBeLessThanOrEqual(BALANCE.adaptive.scamShareMax);
  });

  it('give one Red Flag card per distinct (tactic, family) pair flagged in the scam scenarios', () => {
    // job: greed, urgency, payfirst (3) + mule: greed, secrecy, social (3) + investment: greed, social, urgency (3)
    // + authority: authority, fear, secrecy (3) = 12 pairs.
    const expected = 12;
    const pairs = new Set<string>();
    for (const s of list) if (s.meta.type === 'scam') for (const f of s.flags) pairs.add(`${f.tactic}-${s.meta.family}`);
    expect(pairs.size).toBe(expected);
    expect(deriveCards(list)).toHaveLength(expected);
  });

  it('give every scenario its teaching lines', () => {
    for (const s of list) {
      const min = s.meta.type === 'legit' ? 1 : 2;
      expect(s.meta.apaPatut.length, `${s.meta.id} apa_patut`).toBeGreaterThanOrEqual(min);
    }
  });
});

describe('paths in each scenario', () => {
  it('scam scenarios have a safe path and a wrong path', () => {
    for (const s of list.filter((x) => x.meta.type === 'scam')) {
      const o = outcomesOf(s);
      expect(o.has('safe'), `${s.meta.id} safe`).toBe(true);
      expect([...o].some((x) => x !== 'safe'), `${s.meta.id} wrong`).toBe(true);
    }
  });

  it('legit scenarios have a safe and a curiga path', () => {
    for (const id of ['alert_bankku', 'buku_terpakai']) {
      const o = outcomesOf(all[id]);
      expect(all[id].meta.type).toBe('legit');
      expect(all[id].meta.tactics).toEqual([]);
      expect(o.has('safe') && o.has('curiga'), id).toBe(true);
    }
  });

  it('finance scenarios have a right (untung or safe) and a wrong (rugi, hutang or curiga) path', () => {
    for (const s of list.filter((x) => x.meta.type === 'finance')) {
      const o = outcomesOf(s);
      expect(o.has('untung') || o.has('safe'), `${s.meta.id} right`).toBe(true);
      expect(o.has('rugi') || o.has('hutang') || o.has('curiga'), `${s.meta.id} wrong`).toBe(true);
    }
  });

  it('panggilan_mahkamah is a call, flags authority, fear and secrecy, and never ends as mule', () => {
    const s = all.panggilan_mahkamah;
    expect(s.meta.ui).toBe('call');
    expect(s.meta.family).toBe('authority');
    expect([...new Set(s.flags.map((f) => f.tactic))].sort()).toEqual(['authority', 'fear', 'secrecy']);
    const o = outcomesOf(s);
    expect(o.has('scammed') && o.has('safe') && !o.has('mule')).toBe(true);
  });

  it('gaji_pertama moves RM50 to Amanah Cempaka and opens the Mesin Masa preset labur50', () => {
    const s = all.gaji_pertama;
    expect(s.json).toContain('effect:labur:amanah:+50');
    expect(s.json).toContain('ui:calc:masa:labur50');
  });
});
