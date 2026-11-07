import { BALANCE } from './balance';
import { applyEffect } from './meters';
import type { Meters, Purchase } from './types';

export interface ShopState { meters: Meters; week: number; purchases: Purchase[] }
export type BuyResult = { state: ShopState } | { error: 'unknown-item' | 'owned' | 'insufficient' };

/** The item's price in RM, or null when balance.ts has none. */
export function itemPrice(itemId: string): number | null {
  return (BALANCE.kedai.prices as Record<string, number>)[itemId] ?? null;
}

/** True when the item is paid in instalments at week intros, with nothing up front. */
export function isInstalment(itemId: string): boolean {
  return itemId in BALANCE.kedai.instalment;
}

/** Pays from Duit (never below RM0) and records the item and week. Each item is bought once. */
export function buyItem(state: ShopState, itemId: string): BuyResult {
  const price = itemPrice(itemId);
  if (price === null) return { error: 'unknown-item' };
  if (state.purchases.some((p) => p.item === itemId)) return { error: 'owned' };
  const purchases = [...state.purchases, { item: itemId, week: state.week }];
  if (isInstalment(itemId)) return { state: { ...state, purchases } };
  if (state.meters.duit < price) return { error: 'insufficient' };
  return { state: { ...state, purchases, meters: applyEffect(state.meters, { kind: 'duit', delta: -price }) } };
}
