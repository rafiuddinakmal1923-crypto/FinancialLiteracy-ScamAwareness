import { beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../engine/balance';
import { useGame } from '../state/game';
import { applyPreset, DEMO_PRESETS, DEMO_SCENES } from './demo';

beforeEach(() => useGame.getState().reset());

describe('DEMO_PRESETS', () => {
  it('lists job, mule, report, kelas, kalkulator and pitch, each with a route', () => {
    expect([...DEMO_SCENES].sort()).toEqual(['job', 'kalkulator', 'kelas', 'mule', 'pitch', 'report']);
    for (const s of DEMO_SCENES) expect(DEMO_PRESETS[s].route).toMatch(/^\//);
  });

  it('mule preset sets week 3 and tekanan 70', () => {
    expect(applyPreset('mule')).toBe(true);
    const g = useGame.getState();
    expect(g.onboarded).toBe(true);
    expect(g.week).toBe(3);
    expect(g.weekIntroOpen).toBe(false);
    expect(g.budget).not.toBeNull();
    expect(g.meters).toMatchObject({ duit: 1070, simpanan: 60, tekanan: 70, akaun: 'Aktif', rekod: 'Bersih' });
    expect(g.meters.tekanan).toBeGreaterThanOrEqual(BALANCE.desperation.cueAt);
    expect(DEMO_PRESETS.mule.route).toBe('/sembang/sewa_akaun');
  });

  it('starts from a clean game: no pending chat, no results, earlier progress cleared', () => {
    useGame.getState().set({
      week: 9, results: [{ id: 'sewa_akaun', outcome: 'mule', right: false, flagsFound: 0, flagsTotal: 3, tactics: [], family: 'mule', concepts: [] }],
      lastEnded: { id: 'sewa_akaun', outcome: 'mule', transcript: [], found: [], huntDone: false },
    });
    applyPreset('mule');
    const g = useGame.getState();
    expect(g.results).toEqual([]);
    expect(g.lastEnded).toBeNull();
    expect(g.active).toBeNull();
    // The BankKu history adds up to the preset balance (RM2,000 start less weeks 1-3 costs).
    expect(BALANCE.start.duit + g.txLog.reduce((a, e) => a + e.amount, 0)).toBe(1070);
  });

  it('pitch preset is ready at week 5 with a goal and nothing bought or judged', () => {
    expect(applyPreset('pitch')).toBe(true);
    const g = useGame.getState();
    expect(g.week).toBe(5);
    expect(g.weekIntroOpen).toBe(false);
    expect(g.budget).not.toBeNull();
    expect(g.goal).not.toBeNull();
    expect(g.meters.duit).toBeGreaterThan(0);
    expect(g.purchases).toEqual([]);
    expect(g.feed).toEqual({});
    expect(g.results.map((r) => r.id).sort()).toEqual(['dompet_minggu0', 'gaji_pertama', 'kerja_sambilan', 'sewa_akaun']);
    expect(DEMO_PRESETS.pitch.route).toBe('/home');
  });

  it('pitch preset BankKu history adds up to its balance', () => {
    applyPreset('pitch');
    const g = useGame.getState();
    expect(BALANCE.start.duit + g.txLog.reduce((a, e) => a + e.amount, 0)).toBe(g.meters.duit);
  });

  it('unknown preset returns false and leaves the game alone', () => {
    useGame.getState().set({ week: 5 });
    expect(applyPreset('nope')).toBe(false);
    expect(applyPreset('toString')).toBe(false);
    expect(useGame.getState().week).toBe(5);
  });
});
