import { beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../engine/balance';
import { initialGame, useGame } from './game';

beforeEach(() => useGame.getState().reset());

describe('harian store', () => {
  it('starts empty', () => {
    expect(useGame.getState().harian).toEqual({ streak: 0, lastPlayed: null, freezeWeek: null, best: 0, lastScore: null, lastDeckDate: null });
  });
  it('playHarian records the score and streak once per day', () => {
    useGame.getState().playHarian(4, '2026-11-07');
    expect(useGame.getState().harian).toMatchObject({ streak: 1, lastPlayed: '2026-11-07', lastScore: 4, lastDeckDate: '2026-11-07', best: 1 });
    useGame.getState().playHarian(1, '2026-11-07');
    expect(useGame.getState().harian).toMatchObject({ streak: 1, lastScore: 4 });
    useGame.getState().playHarian(5, '2026-11-08');
    expect(useGame.getState().harian).toMatchObject({ streak: 2, lastScore: 5, lastDeckDate: '2026-11-08' });
  });
  it('playHarian changes nothing when the clock moved back', () => {
    useGame.getState().playHarian(4, '2026-11-07');
    const before = useGame.getState().harian;
    useGame.getState().playHarian(2, '2026-11-03');
    expect(useGame.getState().harian).toEqual(before);
  });
  it('does not touch the 60-second round stand-in fields', () => {
    useGame.getState().playHarian(3, '2026-11-07');
    expect(useGame.getState().swipe).toEqual({ best: 0, streak: 0, lastPlayed: null });
  });
  it('answerCard applies Imuniti, Celik and XP and clamps', () => {
    const m0 = useGame.getState().meters;
    useGame.getState().answerCard('swipe', true, ['greed']);
    let m = useGame.getState().meters;
    expect(m.imuniti.greed).toBe(m0.imuniti.greed + BALANCE.imuniti.swipeRight);
    expect(m.xp).toBe(BALANCE.xp.swipeRight);
    useGame.getState().answerCard('money', false, [], 'kompaun');
    m = useGame.getState().meters;
    expect(m.celik.kompaun).toBe(m0.celik.kompaun + BALANCE.celik.cardWrong);
    for (let i = 0; i < 40; i++) useGame.getState().answerCard('swipe', false, ['greed']);
    expect(useGame.getState().meters.imuniti.greed).toBe(0);
    for (let i = 0; i < 40; i++) useGame.getState().answerCard('money', true, [], 'bajet');
    expect(useGame.getState().meters.celik.bajet).toBe(100);
  });
  it('hydrate fills harian for an old save', () => {
    const old = { ...initialGame() } as Record<string, unknown>;
    delete old.harian;
    useGame.getState().hydrate(old as never);
    expect(useGame.getState().harian.streak).toBe(0);
    expect(useGame.getState().harian.lastDeckDate).toBeNull();
  });
});

describe('60-second round store', () => {
  it('claimSwipeXp is true once per local day', () => {
    expect(useGame.getState().claimSwipeXp('2026-11-07')).toBe(true);
    expect(useGame.getState().claimSwipeXp('2026-11-07')).toBe(false);
    expect(useGame.getState().claimSwipeXp('2026-11-08')).toBe(true);
  });
  it('answerRound moves Imuniti but only gives XP when asked', () => {
    useGame.getState().answerRound(true, ['greed'], false);
    expect(useGame.getState().meters.xp).toBe(0);
    expect(useGame.getState().meters.imuniti.greed).toBeGreaterThan(initialGame().meters.imuniti.greed);
    useGame.getState().answerRound(true, ['greed'], true);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.swipeRight);
  });
  it('recordSwipe keeps the best score and a day streak', () => {
    useGame.getState().recordSwipe(6, '2026-11-07');
    expect(useGame.getState().swipe).toEqual({ best: 6, streak: 1, lastPlayed: '2026-11-07' });
    useGame.getState().recordSwipe(4, '2026-11-07');
    expect(useGame.getState().swipe).toEqual({ best: 6, streak: 1, lastPlayed: '2026-11-07' });
    useGame.getState().recordSwipe(8, '2026-11-08');
    expect(useGame.getState().swipe).toEqual({ best: 8, streak: 2, lastPlayed: '2026-11-08' });
    useGame.getState().recordSwipe(1, '2026-11-12');
    expect(useGame.getState().swipe.streak).toBe(1);
  });
  it('harianProgress starts empty and is persisted', async () => {
    const { gameData } = await import('./game');
    expect(useGame.getState().harianProgress).toBeNull();
    useGame.getState().setHarianProgress({ date: '2026-11-07', answers: [true] });
    expect(gameData(useGame.getState()).harianProgress).toEqual({ date: '2026-11-07', answers: [true] });
  });
});
