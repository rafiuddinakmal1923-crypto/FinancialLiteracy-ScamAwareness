/** Rounds money to the sen (2 decimals). The single rounding helper for all money maths. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
