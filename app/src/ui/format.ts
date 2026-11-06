/** 2000 -> "RM2,000"; -50 -> "-RM50". */
export function formatRM(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString('en-MY');
  return `${n < 0 ? '-' : ''}RM${abs}`;
}

/** Money to the sen: 2140 -> "RM2,140", 1234.5 -> "RM1,234.50", 0.15 -> "RM0.15", -6 -> "-RM6". */
export function formatMoney(n: number): string {
  const sen = Math.round(Math.abs(n) * 100);
  const whole = sen % 100 === 0;
  const abs = (sen / 100).toLocaleString('en-MY', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
  return `${n < 0 && sen > 0 ? '-' : ''}RM${abs}`;
}

/** Like formatMoney, with "+" before gains: 400 -> "+RM400", -6 -> "-RM6". */
export function formatSignedMoney(n: number): string {
  return `${n > 0 ? '+' : ''}${formatMoney(n)}`;
}
