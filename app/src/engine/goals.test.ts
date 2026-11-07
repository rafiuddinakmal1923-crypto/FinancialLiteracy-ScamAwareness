import { describe, expect, it } from 'vitest';
import { goalProgress, goalReached } from './goals';
import { initialMeters } from './meters';

const meters = initialMeters();

describe('goals (contract stubs)', () => {
  it('has no progress without a goal', () => {
    expect(goalProgress({ goal: null, meters })).toBeNull();
  });

  it('reports the target from balance.ts', () => {
    expect(goalProgress({ goal: 'raya', meters })).toEqual({ goal: 'raya', value: 0, target: 250, ratio: 0 });
  });

  it('is not reached yet', () => {
    expect(goalReached({ goal: 'raya', meters })).toBe(false);
  });
});
