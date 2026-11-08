import { BALANCE } from './balance';

/** `id` is a classmate id (k1, k2, ...) or "player". `change` is a classmate's move since last week (null for the player and week 0). */
export interface PapanRow { id: string; grade: number; player: boolean; change: number | null }

const round1 = (n: number) => Math.round(n * 10) / 10;

/** A fixed pseudo-random number in [-1, 1] for classmate i in week w, so every replay shows the same ups and downs. */
function wiggle(i: number, w: number): number {
  const x = Math.sin((i + 1) * 12.9898 + w * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Classmate i's grade in a week: from startGrade toward the final grade, plus a wobble that fades out by the last week. */
export function classmateGrade(i: number, week: number): number {
  const { grades, startGrade, wobble } = BALANCE.papan;
  const weeks = BALANCE.semesterWeeks;
  const w = Math.max(0, Math.min(weeks, week));
  if (w >= weeks) return grades[i];
  const trend = startGrade + (grades[i] - startGrade) * (w / weeks);
  return round1(Math.max(0, Math.min(100, trend + wobble * wiggle(i, w))));
}

/** Highest grade first; on a tie the player sits above the classmate (SDS 5.9). Without a week, classmates show final grades. */
export function rankClassmates(playerGrade: number, week: number = BALANCE.semesterWeeks): PapanRow[] {
  const rows: PapanRow[] = BALANCE.papan.grades.map((_, i) => {
    const grade = classmateGrade(i, week);
    const change = week <= 0 ? null : round1(grade - classmateGrade(i, week - 1));
    return { id: `k${i + 1}`, grade, player: false, change };
  });
  rows.push({ id: 'player', grade: playerGrade, player: true, change: null });
  return rows.sort((a, b) => b.grade - a.grade || Number(b.player) - Number(a.player));
}
