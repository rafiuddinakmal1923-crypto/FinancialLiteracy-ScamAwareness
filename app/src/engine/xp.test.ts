import { describe, it, expect } from 'vitest';
import { levelForXp } from './xp';

describe('levelForXp', () => {
  it('maps thresholds', () => {
    expect(levelForXp(0).name).toBe('Mangsa');
    expect(levelForXp(199).name).toBe('Mangsa');
    expect(levelForXp(200).name).toBe('Waspada');
    expect(levelForXp(899).name).toBe('Bijak');
    expect(levelForXp(900).name).toBe('Penjaga');
    expect(levelForXp(1400).name).toBe('Wira Anti-Scam');
  });
  it('returns min and next', () => {
    expect(levelForXp(199)).toEqual({ name: 'Mangsa', min: 0, next: 200 });
    expect(levelForXp(5000)).toEqual({ name: 'Wira Anti-Scam', min: 1400, next: null });
  });
});
