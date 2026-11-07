import { loadSave, writeSaveNow } from '../storage/db';
import { gameData, useGame } from './game';
import { settingsData, useSettings } from './settings';

export const SAVE_DEBOUNCE_MS = 300;

let timer: ReturnType<typeof setTimeout> | undefined;

export async function loadAll(): Promise<void> {
  const save = await loadSave();
  useGame.getState().hydrate(save?.game ?? null);
  useSettings.getState().hydrate(save?.settings ?? null);
}

/** Writes both stores now and cancels any pending debounced write. */
export function flushNow(): Promise<void> {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
  return writeSaveNow({
    version: 1,
    game: gameData(useGame.getState()),
    settings: settingsData(useSettings.getState()),
  });
}

/** Saves after every store change, debounced. Call only after loadAll() has resolved. */
export function startAutoSave(): () => void {
  const schedule = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => { void flushNow(); }, SAVE_DEBOUNCE_MS);
  };
  const u1 = useGame.subscribe(schedule);
  const u2 = useSettings.subscribe(schedule);
  return () => {
    u1(); u2();
    if (timer !== undefined) void flushNow();
  };
}
