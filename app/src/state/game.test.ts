import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame, initialGame } from './game';
import { settingsData, useSettings } from './settings';
import { initialMeters } from '../engine/meters';
import { BALANCE } from '../engine/balance';
import { CONCEPTS, type ScenarioMeta } from '../engine/types';

const scamMeta: ScenarioMeta = {
  id: 's1', type: 'scam', family: 'job', tactics: ['greed', 'urgency'], concepts: [],
  contact: 'X', ui: 'chat', apaPatut: [],
};
const financeMeta: ScenarioMeta = { ...scamMeta, id: 'f1', type: 'finance', family: 'budget', tactics: [], concepts: ['bajet', 'kecemasan'] };
const legitMeta: ScenarioMeta = { ...scamMeta, id: 'l1', type: 'legit' };

beforeEach(() => { useGame.getState().reset(); useSettings.getState().hydrate(null); });

describe('game store', () => {
  it('startScenario stores a snapshot', () => {
    useGame.getState().startScenario('s1');
    const a = useGame.getState().active!;
    expect(a.id).toBe('s1');
    expect(a.snapshot).toEqual(initialMeters());
    expect(a.hintUsed).toBe(false);
  });

  it('startScenario while active restores first', () => {
    const g = useGame.getState();
    g.startScenario('s1');
    g.apply([{ kind: 'duit', delta: -100 }]);
    g.startScenario('s2');
    const s = useGame.getState();
    expect(s.active!.id).toBe('s2');
    expect(s.active!.snapshot).toEqual(initialMeters());
    expect(s.meters).toEqual(initialMeters());
  });

  it('apply is a no-op without an active scenario', () => {
    useGame.getState().apply([{ kind: 'duit', delta: -100 }]);
    expect(useGame.getState().meters).toEqual(initialMeters());
  });

  it('retryScenario restores the snapshot', () => {
    const g = useGame.getState();
    g.startScenario('s1');
    g.useHint();
    g.apply([{ kind: 'duit', delta: -100 }, { kind: 'tekanan', delta: 20 }]);
    expect(useGame.getState().meters.duit).not.toBe(initialMeters().duit);
    useGame.getState().retryScenario();
    const s = useGame.getState();
    expect(s.meters).toEqual(initialMeters());
    expect(s.active).toEqual({ id: 's1', snapshot: initialMeters(), hintUsed: false });
  });

  it('hydrate with an active scenario restores the snapshot and clears active', () => {
    const snap = initialMeters();
    const dirty = { ...snap, duit: 1, tekanan: 90 };
    useGame.getState().hydrate({
      ...initialGame(), meters: dirty, active: { id: 's1', snapshot: snap, hintUsed: true },
    });
    const s = useGame.getState();
    expect(s.meters).toEqual(snap);
    expect(s.active).toBeNull();
  });

  it('hydrate(null) resets to initial', () => {
    useGame.getState().set({ week: 5 });
    useGame.getState().hydrate(null);
    expect(useGame.getState().week).toBe(0);
  });

  it('useHint works once per scenario and costs 10 XP', () => {
    const g = useGame.getState();
    expect(g.useHint()).toBe(false);
    g.set({ meters: { ...initialMeters(), xp: 50 } });
    g.startScenario('s1');
    expect(useGame.getState().useHint()).toBe(true);
    expect(useGame.getState().meters.xp).toBe(50 + BALANCE.xp.hint);
    expect(useGame.getState().meters.xp).toBe(40);
    expect(useGame.getState().useHint()).toBe(false);
    expect(useGame.getState().meters.xp).toBe(40);
  });

  it('finishScenario appends a ScenarioResult with right=false for curiga', () => {
    useGame.getState().startScenario('l1');
    useGame.getState().finishScenario(legitMeta, 'curiga', 0, 0);
    const s = useGame.getState();
    expect(s.results).toEqual([{
      id: 'l1', outcome: 'curiga', right: false, flagsFound: 0, flagsTotal: 0,
      tactics: legitMeta.tactics, family: 'job', concepts: [],
    }]);
    expect(s.active).toBeNull();
  });

  it('finishScenario applies the outcome and marks safe as right', () => {
    useGame.getState().startScenario('s1');
    useGame.getState().finishScenario(scamMeta, 'safe', 2, 3);
    const s = useGame.getState();
    expect(s.results[0].right).toBe(true);
    expect(s.meters.xp).toBe(initialMeters().xp + BALANCE.xp.safe);
  });

  it('finishScenario for finance records concepts, marks untung right and moves Celik', () => {
    useGame.getState().startScenario('f1');
    useGame.getState().finishScenario(financeMeta, 'untung', 0, 0);
    const s = useGame.getState();
    expect(s.results[0]).toMatchObject({ id: 'f1', outcome: 'untung', right: true, family: 'budget', concepts: ['bajet', 'kecemasan'] });
    expect(s.meters.celik.bajet).toBe(BALANCE.start.celik + BALANCE.celik.right);
    expect(s.meters.xp).toBe(BALANCE.xp.financeRight);
  });

  it('foundFlag raises imuniti and adds the card once', () => {
    const g = useGame.getState();
    g.foundFlag('greed', 'job');
    g.foundFlag('greed', 'job');
    const s = useGame.getState();
    expect(s.cards).toEqual(['greed-job']);
    expect(s.meters.imuniti.greed).toBe(initialMeters().imuniti.greed + 2 * BALANCE.imuniti.flag);
  });
});

describe('ended scenario (consequence, flag hunt, debrief)', () => {
  const transcript = [{ id: 1, from: 'them' as const, speaker: 'X', text: 'RM300 sehari', flags: [{ tactic: 'greed' as const, phrase: 'RM300 sehari' }] }];

  it('endScenario keeps the outcome and transcript for the active scenario only', () => {
    useGame.getState().endScenario({ id: 's1', outcome: 'scammed', transcript });
    expect(useGame.getState().lastEnded).toBeNull();
    useGame.getState().startScenario('s1');
    useGame.getState().endScenario({ id: 's1', outcome: 'scammed', transcript });
    expect(useGame.getState().lastEnded).toEqual({ id: 's1', outcome: 'scammed', transcript, found: [], huntDone: false });
  });

  it('huntFlag awards each tactic once and stops after finishHunt', () => {
    const g = useGame.getState();
    g.startScenario('s1');
    g.endScenario({ id: 's1', outcome: 'scammed', transcript });
    useGame.getState().huntFlag('greed', 'job');
    useGame.getState().huntFlag('greed', 'job');
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.flag);
    expect(useGame.getState().lastEnded!.found).toEqual(['greed']);
    useGame.getState().finishHunt();
    useGame.getState().huntFlag('urgency', 'job');
    expect(useGame.getState().cards).toEqual(['greed-job']);
    expect(useGame.getState().lastEnded!.huntDone).toBe(true);
  });

  it('finishScenario clears lastEnded and keeps the transcript; retry clears it too', () => {
    const g = useGame.getState();
    g.startScenario('s1');
    g.endScenario({ id: 's1', outcome: 'scammed', transcript });
    useGame.getState().retryScenario();
    expect(useGame.getState().lastEnded).toBeNull();
    useGame.getState().endScenario({ id: 's1', outcome: 'scammed', transcript });
    useGame.getState().finishScenario(scamMeta, 'scammed', 1, 3);
    const s = useGame.getState();
    expect(s.lastEnded).toBeNull();
    expect(s.transcripts).toEqual({ s1: transcript });
  });

  it('hydrate keeps an ended scenario (with its effects) but rolls back a cut-off chat', () => {
    const snap = initialMeters();
    const dirty = { ...snap, duit: 1600 };
    const ended = { id: 's1', outcome: 'scammed' as const, transcript, found: [], huntDone: false };
    useGame.getState().hydrate({ ...initialGame(), meters: dirty, active: { id: 's1', snapshot: snap, hintUsed: false }, lastEnded: ended });
    expect(useGame.getState().meters.duit).toBe(1600);
    expect(useGame.getState().lastEnded).toEqual(ended);
    expect(useGame.getState().active?.id).toBe('s1');
    useGame.getState().hydrate({ ...initialGame(), meters: dirty, active: null, lastEnded: ended });
    expect(useGame.getState().lastEnded).toBeNull();
  });
});

describe('hydrate an older save (Review Focus 5)', () => {
  // A literal milestone-2 save: meters without celik/labur, results without concepts.
  const m2Meters = {
    duit: 1600, simpanan: 0, tekanan: 35, xp: 70,
    imuniti: { greed: 15, urgency: 15, authority: 30, fear: 30, secrecy: 30, social: 30, payfirst: 15 },
    akaun: 'Aktif', rekod: 'Bersih',
  };
  const m2Save = {
    character: 'amir', name: 'Amir', week: 1, meters: m2Meters, budget: null,
    results: [{ id: 'kerja_sambilan', outcome: 'scammed', right: false, flagsFound: 2, flagsTotal: 5, tactics: ['greed', 'urgency', 'payfirst'], family: 'job' }],
    cards: ['greed-job'], badges: [], swipe: { best: 0, streak: 0, lastPlayed: null },
    actions: [], incomeTotal: 0, active: null, lastEnded: null, transcripts: {},
  };

  it('hydrate of a milestone-2 save fills celik and labur defaults', () => {
    useGame.getState().hydrate(structuredClone(m2Save) as never);
    const s = useGame.getState();
    for (const c of CONCEPTS) expect(s.meters.celik[c], c).toBe(BALANCE.start.celik);
    expect(s.meters.labur).toEqual({ amanah: 0, ekuiti: 0 });
    expect(s.meters.duit).toBe(1600);
    expect(s.meters.imuniti.greed).toBe(15);
    expect(s.meters.xp).toBe(70);
    expect(s.results[0].concepts).toEqual([]);
    expect(s.results[0].outcome).toBe('scammed');
    expect(s.cards).toEqual(['greed-job']);
    expect(s.name).toBe('Amir');
  });

  it('fills the snapshot of an older save cut off mid-chat', () => {
    const save = { ...structuredClone(m2Save), meters: { ...m2Meters, duit: 1 }, active: { id: 's1', snapshot: m2Meters, hintUsed: false } };
    useGame.getState().hydrate(save as never);
    const s = useGame.getState();
    expect(s.meters.duit).toBe(1600);
    expect(s.meters.celik.bajet).toBe(BALANCE.start.celik);
    expect(s.meters.labur).toEqual({ amanah: 0, ekuiti: 0 });
    expect(s.active).toBeNull();
  });

  it('fills an older active snapshot kept with its ended chat', () => {
    const ended = { id: 's1', outcome: 'scammed', transcript: [], found: [], huntDone: false };
    const save = { ...structuredClone(m2Save), active: { id: 's1', snapshot: m2Meters, hintUsed: false }, lastEnded: ended };
    useGame.getState().hydrate(save as never);
    const s = useGame.getState();
    expect(s.meters.celik.semak).toBe(BALANCE.start.celik);
    expect(s.active!.snapshot.celik.semak).toBe(BALANCE.start.celik);
    expect(s.active!.snapshot.labur).toEqual({ amanah: 0, ekuiti: 0 });
  });

  it('keeps saved celik and labur values', () => {
    const meters = { ...initialMeters(), celik: { ...initialMeters().celik, kompaun: 80 }, labur: { amanah: 120, ekuiti: 40 } };
    useGame.getState().hydrate({ ...initialGame(), meters });
    expect(useGame.getState().meters.celik.kompaun).toBe(80);
    expect(useGame.getState().meters.labur).toEqual({ amanah: 120, ekuiti: 40 });
  });
});

describe('settings store', () => {
  it('has defaults and toggles', () => {
    const s = useSettings.getState();
    expect(s.lang).toBe('ms');
    expect(s.sound).toBe(true);
    expect(s.demo).toBe(true);
    expect(s.reducedMotion).toBe(false);
    s.toggle('sound');
    s.setLang('en');
    expect(useSettings.getState().sound).toBe(false);
    expect(useSettings.getState().lang).toBe('en');
  });
});

describe('persistence wiring', () => {
  it('autosaves debounced and loadAll hydrates both stores', async () => {
    const { vi } = await import('vitest');
    const { startAutoSave, loadAll } = await import('./persist');
    const { __resetStorageForTests, loadSave } = await import('../storage/db');
    __resetStorageForTests();
    vi.useFakeTimers();
    const stop = startAutoSave();
    useGame.getState().set({ week: 2 });
    useGame.getState().set({ week: 4 });
    useSettings.getState().setLang('en');
    await vi.advanceTimersByTimeAsync(350);
    vi.useRealTimers();
    stop();
    const saved = await loadSave();
    expect(saved?.game.week).toBe(4);
    expect(saved?.settings.lang).toBe('en');
    useGame.getState().reset(); useSettings.getState().hydrate(null);
    await loadAll();
    expect(useGame.getState().week).toBe(4);
    expect(useSettings.getState().lang).toBe('en');
  });
});

describe('flushNow', () => {
  it('writes immediately and cancels the pending debounce', async () => {
    const { startAutoSave, flushNow, SAVE_DEBOUNCE_MS } = await import('./persist');
    const db = await import('../storage/db');
    db.__resetStorageForTests();
    const stop = startAutoSave();
    useGame.getState().set({ week: 7 });
    await flushNow();
    expect((await db.loadSave())?.game.week).toBe(7);
    // The debounced write was cancelled: a later change to storage is not overwritten by it.
    await db.writeSave({ version: 1, game: { ...initialGame(), week: 9 }, settings: settingsData(useSettings.getState()) });
    await new Promise((r) => setTimeout(r, SAVE_DEBOUNCE_MS + 100));
    stop();
    expect((await db.loadSave())?.game.week).toBe(9);
  });
});
