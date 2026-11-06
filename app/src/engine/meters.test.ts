import { describe, it, expect } from 'vitest';
import { BALANCE } from './balance';
import { CONCEPTS, TACTICS, type Outcome, type ScenarioMeta, type Tactic } from './types';
import { initialMeters, applyEffect, applyOutcome, applyFlagFound, applyXp, isRight } from './meters';

const scam: ScenarioMeta = { id: 's', type: 'scam', family: 'job', tactics: ['greed', 'urgency'], concepts: [], contact: 'x', ui: 'chat', apaPatut: [] };
const legit: ScenarioMeta = { ...scam, id: 'l', type: 'legit', tactics: [] };
const finance: ScenarioMeta = { ...scam, id: 'f', type: 'finance', family: 'budget', tactics: [], concepts: ['bajet', 'kecemasan'] };
const crypto: ScenarioMeta = { ...scam, id: 'crypto_naga', family: 'investment', tactics: ['greed', 'social', 'urgency'], concepts: ['risiko', 'semak'] };

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('meters', () => {
  it('initialMeters uses BALANCE.start', () => {
    const m = initialMeters();
    expect(m.duit).toBe(2000);
    expect(m.akaun).toBe('Aktif');
    expect(m.rekod).toBe('Bersih');
    for (const t of TACTICS) expect(m.imuniti[t]).toBe(30);
  });
  it('Duit floors at 0', () => {
    expect(applyEffect({ ...initialMeters(), duit: 50 }, { kind: 'duit', delta: -100 }).duit).toBe(0);
  });
  it('Simpanan never exceeds Duit', () => {
    const m = applyEffect({ ...initialMeters(), duit: 1000, simpanan: 400 }, { kind: 'duit', delta: -800 });
    expect(m.duit).toBe(200);
    expect(m.simpanan).toBe(200);
  });
  it('tekanan clamps 0-100', () => {
    const m = initialMeters();
    expect(applyEffect(m, { kind: 'tekanan', delta: 500 }).tekanan).toBe(100);
    expect(applyEffect(m, { kind: 'tekanan', delta: -500 }).tekanan).toBe(0);
  });
  it('akaun and rekod effects set the value', () => {
    const m = applyEffect(applyEffect(initialMeters(), { kind: 'akaun', value: 'Disekat' }), { kind: 'rekod', value: 'Disiasat' });
    expect(m.akaun).toBe('Disekat');
    expect(m.rekod).toBe('Disiasat');
  });
  it('does not mutate input', () => {
    const m = initialMeters();
    const snap = JSON.parse(JSON.stringify(m));
    applyEffect(m, { kind: 'duit', delta: -10 });
    applyOutcome(m, scam, 'safe');
    applyFlagFound(m, 'greed');
    applyXp(m, 10);
    expect(m).toEqual(snap);
  });
  it('scam safe raises each tactic and XP; fell lowers', () => {
    const s = applyOutcome(initialMeters(), scam, 'safe');
    expect(s.imuniti.greed).toBe(40);
    expect(s.imuniti.urgency).toBe(40);
    expect(s.imuniti.fear).toBe(30);
    expect(s.xp).toBe(50);
    for (const o of ['scammed', 'mule', 'frozen'] as Outcome[]) {
      const f = applyOutcome(initialMeters(), scam, o);
      expect(f.imuniti.greed).toBe(15);
      expect(f.xp).toBe(20);
    }
  });
  it('scam + curiga throws; legit rules', () => {
    expect(() => applyOutcome(initialMeters(), scam, 'curiga')).toThrow();
    expect(() => applyOutcome(initialMeters(), legit, 'scammed')).toThrow();
    const a = applyOutcome(initialMeters(), legit, 'safe');
    expect(a.xp).toBe(50);
    expect(a.imuniti).toEqual(initialMeters().imuniti);
    expect(applyOutcome(initialMeters(), legit, 'curiga').xp).toBe(0);
  });
  it('applyFlagFound adds Imuniti and XP', () => {
    const m = applyFlagFound(initialMeters(), 'fear');
    expect(m.imuniti.fear).toBe(35);
    expect(m.xp).toBe(10);
  });
  it('XP never below 0', () => {
    expect(applyXp({ ...initialMeters(), xp: 5 }, BALANCE.xp.hint).xp).toBe(0);
  });
  it('isRight: safe and untung are right, everything else wrong (SDS 5.4)', () => {
    expect(isRight('safe')).toBe(true);
    expect(isRight('untung')).toBe(true);
    for (const o of ['scammed', 'mule', 'frozen', 'curiga', 'rugi', 'hutang'] as Outcome[]) expect(isRight(o), o).toBe(false);
  });
  it('Imuniti stays within 0-100 after any sequence', () => {
    const rnd = mulberry32(42);
    let m = initialMeters();
    const outcomes: Outcome[] = ['safe', 'scammed', 'mule', 'frozen'];
    for (let i = 0; i < 50; i++) {
      const tactics: Tactic[] = [TACTICS[Math.floor(rnd() * 7)], TACTICS[Math.floor(rnd() * 7)]];
      if (rnd() < 0.3) m = applyFlagFound(m, tactics[0]);
      else m = applyOutcome(m, { ...scam, tactics }, outcomes[Math.floor(rnd() * 4)]);
      for (const t of TACTICS) {
        expect(m.imuniti[t]).toBeGreaterThanOrEqual(0);
        expect(m.imuniti[t]).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('meters: finance, Celik and Labur (D22-D24, D29, D30)', () => {
  it('initialMeters starts every concept at 30 and both Labur pots at 0', () => {
    const m = initialMeters();
    for (const c of CONCEPTS) expect(m.celik[c]).toBe(BALANCE.start.celik);
    expect(BALANCE.start.celik).toBe(30);
    expect(m.labur).toEqual({ amanah: 0, ekuiti: 0 });
  });
  it('finance untung: +10 Celik per declared concept and +50 XP', () => {
    const m = applyOutcome(initialMeters(), finance, 'untung');
    expect(m.celik.bajet).toBe(40);
    expect(m.celik.kecemasan).toBe(40);
    expect(m.celik.kompaun).toBe(30);
    expect(m.xp).toBe(BALANCE.xp.financeRight);
    expect(m.xp).toBe(50);
    expect(m.imuniti).toEqual(initialMeters().imuniti);
  });
  it('finance safe counts as right too', () => {
    const m = applyOutcome(initialMeters(), finance, 'safe');
    expect(m.celik.bajet).toBe(40);
    expect(m.xp).toBe(50);
  });
  it('finance rugi, hutang and curiga: -10 Celik per declared concept and +20 XP', () => {
    for (const o of ['rugi', 'hutang', 'curiga'] as Outcome[]) {
      const m = applyOutcome(initialMeters(), finance, o);
      expect(m.celik.bajet, o).toBe(20);
      expect(m.celik.kecemasan, o).toBe(20);
      expect(m.celik.hutang, o).toBe(30);
      expect(m.xp, o).toBe(BALANCE.xp.financeWrong);
      expect(m.xp, o).toBe(20);
    }
  });
  it('finance with a scam outcome throws', () => {
    expect(() => applyOutcome(initialMeters(), finance, 'scammed')).toThrow();
  });
  it('untung, rugi and hutang are invalid for scam and legit scenarios', () => {
    for (const o of ['untung', 'rugi', 'hutang'] as Outcome[]) {
      expect(() => applyOutcome(initialMeters(), scam, o), o).toThrow();
      expect(() => applyOutcome(initialMeters(), legit, o), o).toThrow();
    }
  });
  it('a crypto-style scam with concepts moves Imuniti and Celik, XP once (D30)', () => {
    const safe = applyOutcome(initialMeters(), crypto, 'safe');
    expect(safe.imuniti.greed).toBe(40);
    expect(safe.imuniti.social).toBe(40);
    expect(safe.celik.risiko).toBe(40);
    expect(safe.celik.semak).toBe(40);
    expect(safe.celik.bajet).toBe(30);
    expect(safe.xp).toBe(BALANCE.xp.safe);
    const fell = applyOutcome(initialMeters(), crypto, 'scammed');
    expect(fell.imuniti.greed).toBe(15);
    expect(fell.celik.risiko).toBe(20);
    expect(fell.celik.semak).toBe(20);
    expect(fell.xp).toBe(BALANCE.xp.fell);
  });
  it('a scam without concepts leaves Celik alone', () => {
    expect(applyOutcome(initialMeters(), scam, 'safe').celik).toEqual(initialMeters().celik);
  });
  it('a legit scenario with concepts moves Celik; XP stays the legit XP', () => {
    const withC: ScenarioMeta = { ...legit, concepts: ['semak'] };
    const s = applyOutcome(initialMeters(), withC, 'safe');
    expect(s.celik.semak).toBe(40);
    expect(s.xp).toBe(BALANCE.xp.safe);
    const c = applyOutcome(initialMeters(), withC, 'curiga');
    expect(c.celik.semak).toBe(20);
    expect(c.xp).toBe(0);
  });
  it('labur effect changes only its product and floors at 0', () => {
    const m = applyEffect(initialMeters(), { kind: 'labur', product: 'amanah', delta: 200 });
    expect(m.labur).toEqual({ amanah: 200, ekuiti: 0 });
    expect(m.duit).toBe(initialMeters().duit);
    expect(applyEffect(m, { kind: 'labur', product: 'amanah', delta: -500 }).labur.amanah).toBe(0);
    expect(applyEffect(m, { kind: 'labur', product: 'ekuiti', delta: -1 }).labur).toEqual({ amanah: 200, ekuiti: 0 });
  });
  it('Celik stays within 0-100 after any sequence', () => {
    const rnd = mulberry32(7);
    let m = initialMeters();
    const outcomes: Outcome[] = ['untung', 'safe', 'rugi', 'hutang', 'curiga'];
    for (let i = 0; i < 60; i++) {
      const concepts = [CONCEPTS[Math.floor(rnd() * 6)], CONCEPTS[Math.floor(rnd() * 6)]];
      m = applyOutcome(m, { ...finance, concepts }, outcomes[Math.floor(rnd() * outcomes.length)]);
      for (const c of CONCEPTS) {
        expect(m.celik[c]).toBeGreaterThanOrEqual(0);
        expect(m.celik[c]).toBeLessThanOrEqual(100);
      }
    }
    let hi = initialMeters();
    for (let i = 0; i < 12; i++) hi = applyOutcome(hi, finance, 'untung');
    expect(hi.celik.bajet).toBe(100);
    let lo = initialMeters();
    for (let i = 0; i < 12; i++) lo = applyOutcome(lo, finance, 'rugi');
    expect(lo.celik.bajet).toBe(0);
  });
});

describe('netWorth (S03 home, Task 13 Dompet)', () => {
  it('is Duit plus both Labur pots', async () => {
    const { netWorth } = await import('./meters');
    expect(netWorth(initialMeters())).toBe(BALANCE.start.duit);
    expect(netWorth({ ...initialMeters(), duit: 1500, labur: { amanah: 300, ekuiti: 120.5 } })).toBe(1920.5);
  });
});

describe('right and wrong outcomes come from one place (types.ts)', () => {
  it('rightOutcomes / wrongOutcomes split OUTCOMES_BY_TYPE and agree with isRight', async () => {
    const { OUTCOMES_BY_TYPE, rightOutcomes, wrongOutcomes } = await import('./types');
    expect(rightOutcomes('finance')).toEqual(['safe', 'untung']);
    expect(wrongOutcomes('finance')).toEqual(['rugi', 'hutang', 'curiga']);
    expect(rightOutcomes('scam')).toEqual(['safe']);
    expect(wrongOutcomes('legit')).toEqual(['curiga']);
    for (const type of ['scam', 'legit', 'finance'] as const) {
      for (const o of OUTCOMES_BY_TYPE[type]) expect(isRight(o), o).toBe(rightOutcomes(type).includes(o));
    }
  });
});
