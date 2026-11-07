// The instalment hand-off: Beli opens Kos Sebenar first, and the confirm sheet waits for the player's return.
import type { ShopItem } from '../../engine/types';

export const KEDAI_PATH = '/kedai';

/** Kalkulator preset for an instalment item (content/calc-presets.json, D37). */
export function instalmentPresetPath(itemId: string): string {
  return `/kalkulator?preset=kedai-${encodeURIComponent(itemId)}&back=${KEDAI_PATH}`;
}

let pending: string | null = null;
/** Remembers the item whose Kos Sebenar is open, so coming back opens its confirm sheet. Not saved: a reload forgets it. */
export function setPendingInstalment(id: string | null): void { pending = id; }
/** Takes (and clears) the pending instalment item. */
export function takePendingInstalment(items: ShopItem[]): ShopItem | null {
  const item = items.find((i) => i.id === pending) ?? null;
  pending = null;
  return item;
}
