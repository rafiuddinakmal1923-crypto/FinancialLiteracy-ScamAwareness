import { loadSave, writeSave } from '../storage/db';
import { gameData, useGame } from './game';
import { settingsData, useSettings } from './settings';

export const SAVE_DEBOUNCE_MS = 300;

export async function loadAll(): Promise<void> {
  const save = await loadSave();
  useGame.getState().hydrate(save?.game ?? null);
  useSettings.getState().hydrate(save?.settings ?? null);
}

export function startAutoSave(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    timer = undefined;
    void writeSave({
      version: 1,
      game: gameData(useGame.getState()),
      settings: settingsData(useSettings.getState()),
    });
  };
  const schedule = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(flush, SAVE_DEBOUNCE_MS);
  };
  const u1 = useGame.subscribe(schedule);
  const u2 = useSettings.subscribe(schedule);
  return () => {
    u1(); u2();
    if (timer !== undefined) clearTimeout(timer);
  };
}
