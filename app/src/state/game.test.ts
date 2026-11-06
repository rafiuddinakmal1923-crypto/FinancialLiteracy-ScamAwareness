import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame, initialGame } from './game';
import { settingsData, useSettings } from './settings';
import { initialMeters } from '../engine/meters';
import { BALANCE } from '../engine/balance';
import type { ScenarioMeta } from '../engine/types';

const scamMeta: ScenarioMeta = {
  id: 's1', type: 'scam', family: 'job', tactics: ['greed', 'urgency'],
  contact: 'X', ui: 'chat', apaPatut: [],
};
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
      tactics: legitMeta.tactics, family: 'job',
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

  it('foundFlag raises imuniti and adds the card once', () => {
    const g = useGame.getState();
    g.foundFlag('greed', 'job');
    g.foundFlag('greed', 'job');
    const s = useGame.getState();
    expect(s.cards).toEqual(['greed-job']);
    expect(s.meters.imuniti.greed).toBe(initialMeters().imuniti.greed + 2 * BALANCE.imuniti.flag);
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
