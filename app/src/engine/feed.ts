import type { FeedCall, FeedPost } from './types';

export type FeedVerdict = 'right' | 'wrong' | 'neutral';
export interface FeedResult { verdict: FeedVerdict }

/** Contract stub (A1): always neutral. A2 applies the SDS 5.9 table; the signature stays. */
export function judgePost(_post: FeedPost, _call: FeedCall): FeedResult {
  return { verdict: 'neutral' };
}
