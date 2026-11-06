const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date as YYYY-MM-DD in the device's LOCAL time (never UTC): use it wherever the game needs "today". */
export function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parts(date: string): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
}

/** Whole calendar days from `a` to `b` (both YYYY-MM-DD); negative when `b` is earlier. DST-proof (UTC maths). */
export function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = parts(a);
  const [by, bm, bd] = parts(b);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** ISO 8601 week key "YYYY-Www" (weeks start on Monday; the week-year can differ from the calendar year). */
export function isoWeek(date: string): string {
  const [y, m, d] = parts(date);
  const t = new Date(Date.UTC(y, m - 1, d));
  const dow = t.getUTCDay() || 7; // Mon=1 .. Sun=7
  t.setUTCDate(t.getUTCDate() + 4 - dow); // the Thursday of this week decides the week-year
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
}
