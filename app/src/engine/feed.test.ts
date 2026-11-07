import { describe, expect, it } from 'vitest';
import { judgePost } from './feed';
import type { FeedPost } from './types';

const post: FeedPost = {
  id: 'p1', kind: 'advice', author: { name: 'A', handle: '@a', followers: '1' }, text: { ms: 'x' }, concept: 'bajet', semak: { kad: 'bajet' },
};

describe('judgePost (contract stub)', () => {
  it('returns a verdict', () => {
    expect(judgePost(post, 'semak')).toEqual({ verdict: 'neutral' });
  });
});
