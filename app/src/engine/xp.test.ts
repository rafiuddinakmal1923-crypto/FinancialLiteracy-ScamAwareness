import { describe, it, expect } from 'vitest';
import { levelForXp } from './xp';

describe('levelForXp', () => {
  it('maps thresholds (D24)', () => {
    expect(levelForXp(0).name).toBe('Pemula');
    expect(levelForXp(199).name).toBe('Pemula');
    expect(levelForXp(200).name).toBe('Berjimat');
    expect(levelForXp(500).name).toBe('Bijak');
    expect(levelForXp(899).name).toBe('Bijak');
    expect(levelForXp(900).name).toBe('Pelabur');
    expect(levelForXp(1399).name).toBe('Pelabur');
    expect(levelForXp(1400).name).toBe('Celik');
  });
  it('returns min and next', () => {
    expect(levelForXp(199)).toEqual({ name: 'Pemula', min: 0, next: 200 });
    expect(levelForXp(5000)).toEqual({ name: 'Celik', min: 1400, next: null });
  });
});
