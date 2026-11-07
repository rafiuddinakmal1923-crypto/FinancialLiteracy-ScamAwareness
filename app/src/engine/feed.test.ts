import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { applyFeedResult, judgePost } from './feed';
import { initialMeters } from './meters';
import type { FeedCall, FeedKind, FeedPost } from './types';

const post = (kind: FeedKind): FeedPost => ({
  id: 'p1', kind, author: { name: 'A', handle: '@a', followers: '1' }, text: { ms: 'x' }, semak: { kad: 'risiko' },
  ...(kind === 'scam' ? { tactics: ['greed', 'urgency'] as const satisfies FeedPost['tactics'] } : { concept: 'risiko' as const }),
});

describe('judgePost (SDS 5.9)', () => {
  const table: [FeedKind, FeedCall, 'right' | 'wrong' | 'neutral'][] = [
    ['advice', 'percaya', 'right'], ['advice', 'semak', 'right'], ['advice', 'lapor', 'wrong'],
    ['hype', 'percaya', 'wrong'], ['hype', 'semak', 'right'], ['hype', 'lapor', 'neutral'],
    ['scam', 'percaya', 'wrong'], ['scam', 'semak', 'right'], ['scam', 'lapor', 'right'],
  ];
  it.each(table)('%s + %s is %s', (kind, call, verdict) => {
    expect(judgePost(post(kind), call)).toEqual({ verdict });
  });
});

describe('applyFeedResult', () => {
  const m = initialMeters();

  it('a right call on a scam adds Imuniti to each tactic, and XP', () => {
    const r = applyFeedResult(m, post('scam'), 'right');
    expect(r.imuniti.greed).toBe(m.imuniti.greed + BALANCE.imuniti.swipeRight);
    expect(r.imuniti.urgency).toBe(m.imuniti.urgency + BALANCE.imuniti.swipeRight);
    expect(r.imuniti.fear).toBe(m.imuniti.fear);
    expect(r.xp).toBe(BALANCE.suapan.xpRight);
  });

  it('a wrong call on a scam takes Imuniti and gives no XP', () => {
    const r = applyFeedResult(m, post('scam'), 'wrong');
    expect(r.imuniti.greed).toBe(m.imuniti.greed + BALANCE.imuniti.swipeWrong);
    expect(r.xp).toBe(0);
  });

  it('a right call on advice or hype adds Celik for its concept, and XP', () => {
    for (const kind of ['advice', 'hype'] as const) {
      const r = applyFeedResult(m, post(kind), 'right');
      expect(r.celik.risiko).toBe(m.celik.risiko + BALANCE.celik.cardRight);
      expect(r.xp).toBe(BALANCE.suapan.xpRight);
    }
  });

  it('a wrong call on advice or hype takes Celik for its concept', () => {
    const r = applyFeedResult(m, post('hype'), 'wrong');
    expect(r.celik.risiko).toBe(m.celik.risiko + BALANCE.celik.cardWrong);
    expect(r.xp).toBe(0);
  });

  it('a neutral call changes nothing', () => {
    expect(applyFeedResult(m, post('hype'), 'neutral')).toEqual(m);
  });
});
