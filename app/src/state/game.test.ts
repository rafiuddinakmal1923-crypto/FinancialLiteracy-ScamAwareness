import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { gameData, useGame, initialGame } from './game';
import { settingsData, useSettings } from './settings';
import { initialMeters, netWorth } from '../engine/meters';
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
    useGame.getState().huntFlag('greed', scamMeta);
    useGame.getState().huntFlag('greed', scamMeta);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.flag);
    expect(useGame.getState().lastEnded!.found).toEqual(['greed']);
    useGame.getState().finishHunt();
    useGame.getState().huntFlag('urgency', scamMeta);
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

describe('milestone-2 review fixes (M2, M6)', () => {
  const transcript = [{ id: 1, from: 'them' as const, speaker: 'X', text: 'RM300 sehari', flags: [{ tactic: 'greed' as const, phrase: 'RM300 sehari' }] }];

  it('M6: huntFlag awards cards, Imuniti and XP only for scam scenarios', () => {
    for (const meta of [legitMeta, financeMeta]) {
      useGame.getState().reset();
      useGame.getState().startScenario(meta.id);
      useGame.getState().endScenario({ id: meta.id, outcome: 'safe', transcript });
      const before = useGame.getState().meters;
      useGame.getState().huntFlag('greed', meta);
      const s = useGame.getState();
      expect(s.cards, meta.type).toEqual([]);
      expect(s.meters, meta.type).toEqual(before);
    }
    useGame.getState().reset();
    useGame.getState().startScenario('s1');
    useGame.getState().endScenario({ id: 's1', outcome: 'safe', transcript });
    useGame.getState().huntFlag('greed', scamMeta);
    expect(useGame.getState().cards).toEqual(['greed-job']);
  });

  it('M2: startScenario is a no-op while another ended scenario is pending', () => {
    const g = useGame.getState();
    g.startScenario('s1');
    g.apply([{ kind: 'duit', delta: -400 }]);
    useGame.getState().endScenario({ id: 's1', outcome: 'scammed', transcript });
    const before = useGame.getState();
    useGame.getState().startScenario('s2');
    const s = useGame.getState();
    expect(s.active).toEqual(before.active);
    expect(s.meters).toEqual(before.meters);
    expect(s.meters.duit).toBe(BALANCE.start.duit - 400);
    expect(s.lastEnded?.id).toBe('s1');
    // Same id is a no-op too; after Cuba lagi (lastEnded cleared) it starts again.
    useGame.getState().startScenario('s1');
    expect(useGame.getState().meters.duit).toBe(BALANCE.start.duit - 400);
    useGame.getState().retryScenario();
    useGame.getState().startScenario('s1');
    expect(useGame.getState().meters.duit).toBe(BALANCE.start.duit);
  });
});

describe('week intro and Labur actions (Task 13)', () => {
  const week = (n: number) => ({ week: n, scenario: null, context: { ms: 'x' }, costs: [{ label: { ms: 'Makan' }, amount: 80 }] });

  it('setBudget stores the split and sets simpanan', () => {
    useGame.getState().setBudget({ needs: 50, wants: 30, savings: 20 });
    const s = useGame.getState();
    expect(s.budget).toEqual({ needs: 50, wants: 30, savings: 20 });
    expect(s.meters.simpanan).toBe(400);
    expect(() => useGame.getState().setBudget({ needs: 50, wants: 30, savings: 30 })).toThrow(RangeError);
  });

  it('beginWeek advances the week, applies the intro, opens it and tracks income', () => {
    useGame.getState().set({ week: 3 });
    const sum = useGame.getState().beginWeek(week(4));
    const s = useGame.getState();
    expect(s.week).toBe(4);
    expect(s.weekIntroOpen).toBe(true);
    expect(sum!.income).toBe(400);
    expect(s.incomeTotal).toBe(400);
    expect(s.meters.duit).toBe(2000 + 400 - 80);
  });

  it('beginWeek is a no-op returning null at week 12 or while an intro is open', () => {
    useGame.getState().set({ week: 12 });
    expect(useGame.getState().beginWeek(week(12))).toBeNull();
    expect(useGame.getState().week).toBe(12);
    useGame.getState().set({ week: 1, weekIntroOpen: true });
    expect(useGame.getState().beginWeek(week(2))).toBeNull();
  });

  it('closeWeekIntro closes it', () => {
    useGame.getState().beginWeek(week(1));
    useGame.getState().closeWeekIntro();
    expect(useGame.getState().weekIntroOpen).toBe(false);
  });

  it('moveLabur works only while the intro is open and never changes net worth', () => {
    expect(useGame.getState().moveLabur('amanah', 100)).toEqual({ error: 'not-week-intro' });
    useGame.getState().beginWeek(week(1));
    const before = netWorth(useGame.getState().meters);
    const r = useGame.getState().moveLabur('amanah', 500);
    expect('error' in r).toBe(false);
    const m = useGame.getState().meters;
    expect(m.labur.amanah).toBe(500);
    expect(netWorth(m)).toBe(before);
    expect(useGame.getState().moveLabur('amanah', 99999)).toEqual({ error: 'insufficient' });
    expect(useGame.getState().meters).toEqual(m);
  });

  it('a new game is not onboarded and starts in week 0', () => {
    expect(initialGame().onboarded).toBe(false);
    expect(initialGame().week).toBe(0);
  });

  it('hydrate of an older save without onboarded derives it from week >= 1', () => {
    const { onboarded: _o, ...old } = initialGame();
    useGame.getState().hydrate({ ...old, week: 1 } as never);
    expect(useGame.getState().onboarded).toBe(true);
    expect(useGame.getState().week).toBe(1);
    useGame.getState().hydrate({ ...old, week: 0 } as never);
    expect(useGame.getState().onboarded).toBe(false);
  });

  it('hydrate keeps a saved onboarded flag (onboarded in week 0, before the first intro)', () => {
    useGame.getState().hydrate({ ...initialGame(), onboarded: true, week: 0 });
    expect(useGame.getState().onboarded).toBe(true);
    expect(useGame.getState().week).toBe(0);
  });

  it('after onboarding and the split, the first intro is week 1 and charges its costs', () => {
    useGame.getState().set({ onboarded: true });
    useGame.getState().setBudget({ needs: 50, wants: 30, savings: 20 });
    const sum = useGame.getState().beginWeek(week(1));
    expect(useGame.getState().week).toBe(1);
    expect(sum!.costs.map((c) => c.amount)).toEqual(week(1).costs.map((c) => c.amount));
    expect(useGame.getState().meters.duit).toBe(2000 - week(1).costs.reduce((n, c) => n + c.amount, 0));
  });

  it('hydrate defaults weekIntroOpen to false for old saves', () => {
    const { weekIntroOpen: _w, ...old } = initialGame();
    useGame.getState().hydrate(old as never);
    expect(useGame.getState().weekIntroOpen).toBe(false);
  });
});

describe('BankKu transaction log (Task 15)', () => {
  const week = (n: number) => ({ week: n, scenario: null, context: { ms: 'x' }, costs: [{ label: { ms: 'Makan' }, amount: 80 }] });

  it('a fresh game has an empty txLog, and an older save hydrates to []', () => {
    expect(useGame.getState().txLog).toEqual([]);
    const { txLog: _t, ...old } = initialGame();
    useGame.getState().hydrate(old as never);
    expect(useGame.getState().txLog).toEqual([]);
  });

  it('apply appends each duit change with the scenario contact as label, and skips other effects', () => {
    useGame.getState().set({ week: 3 });
    const g = useGame.getState();
    g.startScenario('s1');
    g.apply([{ kind: 'tekanan', delta: 5 }, { kind: 'duit', delta: -100 }, { kind: 'duit', delta: 50 }], 'Abang Zul');
    expect(useGame.getState().txLog).toMatchObject([
      { id: 1, week: 3, label: 'Abang Zul', amount: -100 },
      { id: 2, week: 3, label: 'Abang Zul', amount: 50 },
    ]);
  });

  it('records the real change when Duit is clamped at 0', () => {
    const g = useGame.getState();
    g.startScenario('s1');
    g.apply([{ kind: 'duit', delta: -999999 }], 'X');
    expect(useGame.getState().txLog[0]!.amount).toBe(-initialMeters().duit);
    g.apply([{ kind: 'duit', delta: -10 }], 'X');
    expect(useGame.getState().txLog).toHaveLength(1);
  });

  it('beginWeek appends income and each cost', () => {
    useGame.getState().set({ week: 3 });
    useGame.getState().beginWeek(week(4));
    const log = useGame.getState().txLog;
    expect(log.map((t) => [t.week, t.amount])).toEqual([[4, BALANCE.income], [4, -80]]);
    expect(log[0]!.label).toBe('bankku.tx.income');
    expect(log[1]!.label).toBe('Makan');
  });

  it('keeps only the last 50 entries', () => {
    const g = useGame.getState();
    g.startScenario('s1');
    for (let i = 0; i < 60; i++) g.apply([{ kind: 'duit', delta: -1 }], `t${i}`);
    const log = useGame.getState().txLog;
    expect(log).toHaveLength(50);
    expect(log[0]!.label).toBe('t10');
    expect(log.at(-1)!.label).toBe('t59');
    expect(new Set(log.map((t) => t.id)).size).toBe(50);
  });

  it('Cuba lagi (retry) and a mid-story reload drop that chat\'s transactions with its meters', () => {
    useGame.getState().set({ week: 3 });
    useGame.getState().beginWeek(week(4));
    const before = useGame.getState().txLog;
    const g = useGame.getState();
    g.closeWeekIntro();
    g.startScenario('s1');
    g.apply([{ kind: 'duit', delta: -100 }], 'Abang Zul');
    g.retryScenario();
    expect(useGame.getState().txLog).toEqual(before);
    g.apply([{ kind: 'duit', delta: -100 }], 'Abang Zul');
    useGame.getState().hydrate(gameData(useGame.getState()));
    expect(useGame.getState().txLog).toEqual(before);
  });

  it('a finished chat keeps its transactions', () => {
    const g = useGame.getState();
    g.startScenario('s1');
    g.apply([{ kind: 'duit', delta: -100 }], 'Abang Zul');
    g.finishScenario(scamMeta, 'scammed', 0, 2);
    expect(useGame.getState().txLog).toHaveLength(1);
  });
});

describe('awardKadIlmu (Task 25)', () => {
  it('awards each concept once, +10 XP each first time only', () => {
    useGame.getState().reset();
    const xp0 = useGame.getState().meters.xp;
    expect(useGame.getState().awardKadIlmu(['bajet', 'kompaun'])).toEqual(['bajet', 'kompaun']);
    expect(useGame.getState().kadIlmu).toEqual(['bajet', 'kompaun']);
    expect(useGame.getState().meters.xp).toBe(xp0 + 2 * BALANCE.xp.kadIlmu);
    expect(useGame.getState().awardKadIlmu(['bajet', 'risiko'])).toEqual(['risiko']);
    expect(useGame.getState().kadIlmu).toEqual(['bajet', 'kompaun', 'risiko']);
    expect(useGame.getState().meters.xp).toBe(xp0 + 3 * BALANCE.xp.kadIlmu);
    expect(useGame.getState().awardKadIlmu([])).toEqual([]);
  });
  it('hydrates an old save without kadIlmu to []', () => {
    const d = { ...gameData(useGame.getState()) } as Record<string, unknown>;
    delete d.kadIlmu;
    useGame.getState().hydrate(d as never);
    expect(useGame.getState().kadIlmu).toEqual([]);
  });

  it('fills the finalist fields on an older save and keeps them across a save (A1)', () => {
    const { goal: _g, purchases: _p, feed: _f, ...old } = initialGame();
    useGame.getState().hydrate(old as never);
    expect(useGame.getState().goal).toBeNull();
    expect(useGame.getState().purchases).toEqual([]);
    expect(useGame.getState().feed).toEqual({});
    useGame.getState().setGoal('raya');
    expect(gameData(useGame.getState()).goal).toBe('raya');
  });

  it('judges a Suapan post once (A1)', () => {
    useGame.getState().reset();
    const post = { id: 'p1', kind: 'advice', author: { name: 'A', handle: '@a', followers: '1' }, text: { ms: 'x' }, concept: 'bajet', semak: { kad: 'bajet' } } as const;
    expect(useGame.getState().judgeFeed(post, 'semak')).not.toBeNull();
    expect(useGame.getState().judgeFeed(post, 'lapor')).toBeNull();
    expect(useGame.getState().feed).toEqual({ p1: 'semak' });
  });
});
