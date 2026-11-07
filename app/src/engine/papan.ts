import { BALANCE } from './balance';

/** `id` is a classmate id (k1, k2, ...) or "player". */
export interface PapanRow { id: string; grade: number; player: boolean }

/** Contract stub (A1): classmates in balance.ts order, player last. A5 sorts them; ties place the player above. */
export function rankClassmates(playerGrade: number): PapanRow[] {
  return [
    ...BALANCE.papan.grades.map((grade, i) => ({ id: `k${i + 1}`, grade, player: false })),
    { id: 'player', grade: playerGrade, player: true },
  ];
}
