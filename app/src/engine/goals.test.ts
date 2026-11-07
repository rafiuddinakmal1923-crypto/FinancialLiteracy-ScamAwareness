import { describe, expect, it } from 'vitest';
import { goalProgress, goalReached } from './goals';
import { initialMeters } from './meters';

const meters = { ...initialMeters(), duit: 900, simpanan: 150, labur: { amanah: 60, ekuiti: 40 } };

describe('goalProgress', () => {
  it('is null without a goal', () => {
    expect(goalProgress({ goal: null, meters })).toBeNull();
  });

  it('emergency fund measures Simpanan', () => {
    expect(goalProgress({ goal: 'kecemasan', meters })).toEqual({ goal: 'kecemasan', value: 150, target: 300, ratio: 0.5 });
  });

  it('laptop measures Simpanan', () => {
    expect(goalProgress({ goal: 'laptop', meters })).toEqual({ goal: 'laptop', value: 150, target: 500, ratio: 0.3 });
  });

  it('Raya ticket measures Duit, capped at 100%', () => {
    expect(goalProgress({ goal: 'raya', meters })).toEqual({ goal: 'raya', value: 900, target: 250, ratio: 1 });
  });

  it('invest measures both Labur pots', () => {
    expect(goalProgress({ goal: 'labur', meters })).toEqual({ goal: 'labur', value: 100, target: 200, ratio: 0.5 });
  });
});

describe('goalReached', () => {
  it('needs a goal', () => {
    expect(goalReached({ goal: null, meters })).toBe(false);
  });

  it('is false below the target', () => {
    expect(goalReached({ goal: 'kecemasan', meters })).toBe(false);
  });

  it('is true at the target', () => {
    expect(goalReached({ goal: 'kecemasan', meters: { ...meters, simpanan: 300 } })).toBe(true);
  });
});
