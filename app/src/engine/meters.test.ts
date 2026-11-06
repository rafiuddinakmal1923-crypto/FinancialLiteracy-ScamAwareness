import { describe, it, expect } from 'vitest';
import { BALANCE } from './balance';
import { TACTICS, type Outcome, type ScenarioMeta, type Tactic } from './types';
import { initialMeters, applyEffect, applyOutcome, applyFlagFound, applyXp, isRight } from './meters';

const scam: ScenarioMeta = { id: 's', type: 'scam', family: 'job', tactics: ['greed', 'urgency'], contact: 'x', ui: 'chat', apaPatut: [] };
const legit: ScenarioMeta = { ...scam, id: 'l', type: 'legit', tactics: [] };

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
  it('legit curiga is not right; scam safe is right', () => {
    expect(isRight('legit', 'curiga')).toBe(false);
    expect(isRight('scam', 'safe')).toBe(true);
    expect(isRight('legit', 'safe')).toBe(true);
    expect(isRight('scam', 'scammed')).toBe(false);
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
