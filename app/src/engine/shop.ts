import { BALANCE } from './balance';
import type { Meters, Purchase } from './types';

export interface ShopState { meters: Meters; week: number; purchases: Purchase[] }
export type BuyResult = { state: ShopState } | { error: 'unknown-item' | 'insufficient' };

/** The item's price in RM, or null when balance.ts has none. */
export function itemPrice(itemId: string): number | null {
  return (BALANCE.kedai.prices as Record<string, number>)[itemId] ?? null;
}

/** Contract stub (A1): checks the item exists and changes nothing. A3 pays from Duit and records the purchase. */
export function buyItem(state: ShopState, itemId: string): BuyResult {
  return itemPrice(itemId) === null ? { error: 'unknown-item' } : { state };
}
