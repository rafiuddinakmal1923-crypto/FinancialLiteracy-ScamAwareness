import { BALANCE } from '../../engine/balance';

export interface InstalmentTerms { monthly: number; months: number; total: number }

/** Example instalment terms for an item from balance.ts, or null for a cash item. */
export function instalmentTerms(itemId: string): InstalmentTerms | null {
  const terms = (BALANCE.kedai.instalment as Record<string, { monthly: number; months: number }>)[itemId];
  return terms ? { ...terms, total: terms.monthly * terms.months } : null;
}
