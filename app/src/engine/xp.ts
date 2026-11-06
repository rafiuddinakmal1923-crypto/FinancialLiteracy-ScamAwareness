import { BALANCE } from './balance';

export function levelForXp(xp: number): { name: string; min: number; next: number | null } {
  const levels = BALANCE.levels;
  let idx = 0;
  for (let i = 0; i < levels.length; i++) if (xp >= levels[i][1]) idx = i;
  const next = idx + 1 < levels.length ? levels[idx + 1][1] : null;
  return { name: levels[idx][0], min: levels[idx][1], next };
}
