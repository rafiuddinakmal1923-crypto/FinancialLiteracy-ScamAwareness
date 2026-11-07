import { describe, expect, it } from 'vitest';
import { initialMeters } from './meters';
import { buyItem, itemPrice } from './shop';

const state = { meters: initialMeters(), week: 1, purchases: [] };

describe('shop (contract stubs)', () => {
  it('prices come from balance.ts', () => {
    expect(itemPrice('basikal')).toBe(150);
    expect(itemPrice('tiada')).toBeNull();
  });

  it('keeps the cash items under one part-time pay (D37)', () => {
    const cash = ['snek', 'konsert', 'earfon', 'basikal', 'buku'].map((id) => itemPrice(id) ?? 0);
    expect(cash.reduce((a, b) => a + b, 0)).toBe(383);
  });

  it('rejects an unknown item', () => {
    expect(buyItem(state, 'tiada')).toEqual({ error: 'unknown-item' });
  });

  it('returns a state for a known item', () => {
    expect(buyItem(state, 'basikal')).toEqual({ state });
  });
});
