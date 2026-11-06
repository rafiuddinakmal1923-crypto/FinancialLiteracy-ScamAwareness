/** 2000 -> "RM2,000"; -50 -> "-RM50". */
export function formatRM(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString('en-MY');
  return `${n < 0 ? '-' : ''}RM${abs}`;
}
