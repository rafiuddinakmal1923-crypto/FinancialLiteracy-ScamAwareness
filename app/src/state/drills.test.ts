import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../engine/balance';
import { gameData, initialGame, useGame } from './game';

beforeEach(() => { useGame.getState().reset(); });

describe('completeDrill / tickAction (Task 27)', () => {
  it('completeDrill gives +40 XP once per drill id', () => {
    expect(useGame.getState().completeDrill('997')).toBe(true);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.drill);
    expect(useGame.getState().completeDrill('997')).toBe(false);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.drill);
    expect(useGame.getState().completeDrill('semak')).toBe(true);
    expect(useGame.getState().meters.xp).toBe(2 * BALANCE.xp.drill);
    expect(useGame.getState().drills).toEqual(['997', 'semak']);
  });

  it('tickAction gives +25 XP once; untick and re-tick pay nothing more', () => {
    expect(useGame.getState().tickAction('save-997')).toBe(true);
    expect(useGame.getState().actions).toEqual(['save-997']);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.action);
    useGame.getState().untickAction('save-997');
    expect(useGame.getState().actions).toEqual([]);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.action);
    expect(useGame.getState().tickAction('save-997')).toBe(false);
    expect(useGame.getState().actions).toEqual(['save-997']);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.action);
  });

  it('persists drills and the paid actions; an old save hydrates with empty defaults', () => {
    useGame.getState().completeDrill('997');
    useGame.getState().tickAction('bank-alerts');
    const saved = gameData(useGame.getState());
    expect(saved.drills).toEqual(['997']);
    expect(saved.actionsPaid).toEqual(['bank-alerts']);

    const old = { ...initialGame() } as Partial<ReturnType<typeof initialGame>>;
    delete old.drills;
    delete old.actionsPaid;
    old.actions = ['save-997'];
    useGame.getState().hydrate(old as ReturnType<typeof initialGame>);
    expect(useGame.getState().drills).toEqual([]);
    // An action ticked before actionsPaid existed counts as paid (no double XP).
    expect(useGame.getState().tickAction('save-997')).toBe(false);
  });
});
