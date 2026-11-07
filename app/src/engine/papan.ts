import { BALANCE } from './balance';

/** `id` is a classmate id (k1, k2, ...) or "player". */
export interface PapanRow { id: string; grade: number; player: boolean }

/** Highest grade first; on a tie the player sits above the classmate (SDS 5.9). */
export function rankClassmates(playerGrade: number): PapanRow[] {
  const rows: PapanRow[] = BALANCE.papan.grades.map((grade, i) => ({ id: `k${i + 1}`, grade, player: false }));
  rows.push({ id: 'player', grade: playerGrade, player: true });
  return rows.sort((a, b) => b.grade - a.grade || Number(b.player) - Number(a.player));
}
