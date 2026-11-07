import { describe, expect, it } from 'vitest';
import { rankClassmates } from './papan';

describe('rankClassmates (contract stub)', () => {
  it('has 9 classmates and one player', () => {
    const rows = rankClassmates(65.5);
    expect(rows).toHaveLength(10);
    expect(rows.filter((r) => r.player)).toEqual([{ id: 'player', grade: 65.5, player: true }]);
  });
});
