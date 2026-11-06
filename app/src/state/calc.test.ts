import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../engine/balance';
import { cardId } from '../engine/cards';
import { gameData, initialGame, useGame } from './game';

const trail = [{ c: 0 }, { c: 1 }];

beforeEach(() => {
  useGame.getState().reset();
  useGame.getState().startScenario('s1');
});

describe('Kalkulator store (Task 18)', () => {
  it('calcUsed starts empty and is persisted data', () => {
    expect(initialGame().calcUsed).toEqual([]);
    useGame.getState().calcUse('s1');
    expect(gameData(useGame.getState()).calcUsed).toEqual(['s1']);
  });

  it('hydrate fills calcUsed for an older save', () => {
    const old = { ...initialGame() } as Partial<ReturnType<typeof initialGame>>;
    delete old.calcUsed;
    useGame.getState().hydrate(old as ReturnType<typeof initialGame>);
    expect(useGame.getState().calcUsed).toEqual([]);
  });

  it('calcUse awards +10 XP once per scenario and says so', () => {
    const g = useGame.getState();
    const before = g.meters.xp;
    expect(g.calcUse('s1')).toBe(true);
    expect(useGame.getState().meters.xp).toBe(before + BALANCE.xp.calc);
    expect(useGame.getState().calcUse('s1')).toBe(false);
    expect(useGame.getState().meters.xp).toBe(before + BALANCE.xp.calc);
    expect(useGame.getState().calcUsed).toEqual(['s1']);
  });

  it('the XP survives the chat restarting from its snapshot', () => {
    useGame.getState().calcUse('s1');
    const xp = useGame.getState().meters.xp;
    useGame.getState().startScenario('s1');
    expect(useGame.getState().meters.xp).toBe(xp);
  });

  it('calcOpen keeps the trail, calcReturn marks the return, both persisted', () => {
    useGame.getState().calcOpen({ id: 's1', family: 'investment', trail });
    expect(gameData(useGame.getState()).calcResume).toEqual({ id: 's1', family: 'investment', trail, returned: false });
    useGame.getState().calcReturn();
    expect(useGame.getState().calcResume?.returned).toBe(true);
  });

  it('calcFlag counts one found greed flag per scenario', () => {
    useGame.getState().calcOpen({ id: 's1', family: 'investment', trail });
    const before = useGame.getState().meters;
    useGame.getState().calcFlag('greed');
    const after = useGame.getState();
    expect(after.meters.imuniti.greed).toBe(before.imuniti.greed + BALANCE.imuniti.flag);
    expect(after.meters.xp).toBe(before.xp + BALANCE.xp.flag);
    expect(after.cards).toContain(cardId('greed', 'investment'));
    after.calcFlag('greed');
    expect(useGame.getState().meters.imuniti.greed).toBe(before.imuniti.greed + BALANCE.imuniti.flag);
    expect(useGame.getState().meters.xp).toBe(before.xp + BALANCE.xp.flag);
  });

  it('calcFlag outside a scenario does nothing', () => {
    const before = useGame.getState().meters.imuniti.greed;
    useGame.getState().calcFlag('greed');
    expect(useGame.getState().meters.imuniti.greed).toBe(before);
    expect(useGame.getState().cards).toEqual([]);
  });

  it('starting another chat drops the stale resume point', () => {
    useGame.getState().calcOpen({ id: 's1', family: 'job', trail });
    useGame.getState().startScenario('s2');
    expect(useGame.getState().calcResume).toBeNull();
  });
});

describe('calcFlag and the flag hunt do not double-award (fix round 1)', () => {
  const meta = { type: 'scam', family: 'investment' } as const;
  const endChat = () => {
    useGame.getState().endScenario({ id: 's1', outcome: 'safe', transcript: [] });
  };

  it('calcFlag then huntFlag(greed): one Imuniti/XP increment, greed still counted as found once', () => {
    const g0 = useGame.getState().meters;
    useGame.getState().calcOpen({ id: 's1', family: 'investment', trail });
    useGame.getState().calcFlag('greed');
    endChat();
    useGame.getState().huntFlag('greed', meta);
    useGame.getState().huntFlag('greed', meta);
    const s = useGame.getState();
    expect(s.meters.imuniti.greed).toBe(g0.imuniti.greed + BALANCE.imuniti.flag);
    expect(s.meters.xp).toBe(g0.xp + BALANCE.xp.flag);
    expect(s.lastEnded?.found).toEqual(['greed']);
  });

  it('huntFlag alone still awards once', () => {
    const g0 = useGame.getState().meters;
    endChat();
    useGame.getState().huntFlag('greed', meta);
    useGame.getState().huntFlag('greed', meta);
    expect(useGame.getState().meters.imuniti.greed).toBe(g0.imuniti.greed + BALANCE.imuniti.flag);
    expect(useGame.getState().meters.xp).toBe(g0.xp + BALANCE.xp.flag);
  });

  it('finishing the scenario clears its calc flags; a retry keeps the earned gain (it is in the snapshot)', () => {
    useGame.getState().calcOpen({ id: 's1', family: 'investment', trail });
    useGame.getState().calcFlag('greed');
    const xp = useGame.getState().meters.xp;
    endChat();
    useGame.getState().retryScenario();
    expect(useGame.getState().meters.xp).toBe(xp);
    expect(useGame.getState().calcFlagged).toEqual(['s1:greed']);
    endChat();
    useGame.getState().huntFlag('greed', meta);
    expect(useGame.getState().meters.xp).toBe(xp);
    useGame.getState().finishScenario({ id: 's1', type: 'scam', family: 'investment', tactics: ['greed'], concepts: [], contact: 'X', ui: 'chat', apaPatut: [] }, 'safe', 1, 1);
    expect(useGame.getState().calcFlagged).toEqual([]);
  });
});
