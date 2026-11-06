import { describe, expect, it } from 'vitest';
import { round2 } from './money';

describe('round2', () => {
  it('rounds to the sen', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(3.0769230769)).toBe(3.08);
    expect(round2(10)).toBe(10);
  });
});
