import { BALANCE } from './balance';
import { applyXp, bump, bumpCelik } from './meters';
import type { FeedCall, FeedKind, FeedPost, Meters } from './types';

export type FeedVerdict = 'right' | 'wrong' | 'neutral';
export interface FeedResult { verdict: FeedVerdict }

/** SDS 5.9. */
const TABLE: Record<FeedKind, Record<FeedCall, FeedVerdict>> = {
  advice: { percaya: 'right', semak: 'right', lapor: 'wrong' },
  hype: { percaya: 'wrong', semak: 'right', lapor: 'neutral' },
  scam: { percaya: 'wrong', semak: 'right', lapor: 'right' },
};

export function judgePost(post: FeedPost, call: FeedCall): FeedResult {
  return { verdict: TABLE[post.kind][call] };
}

/** Scam posts move Imuniti for their tactics; advice and hype move Celik for their concept; a right call gives XP. */
export function applyFeedResult(m: Meters, post: FeedPost, verdict: FeedVerdict): Meters {
  if (verdict === 'neutral') return m;
  const right = verdict === 'right';
  const moved = post.kind === 'scam'
    ? bump(m, post.tactics ?? [], right ? BALANCE.imuniti.swipeRight : BALANCE.imuniti.swipeWrong)
    : bumpCelik(m, post.concept ? [post.concept] : [], right ? BALANCE.celik.cardRight : BALANCE.celik.cardWrong);
  return right ? applyXp(moved, BALANCE.suapan.xpRight) : moved;
}
