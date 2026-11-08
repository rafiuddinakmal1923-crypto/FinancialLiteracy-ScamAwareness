import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetStorageForTests, loadSave, storageMode, writeSave, type SaveData } from './db';
import { initialGame } from '../state/game';
import { defaultSettings } from '../state/settings';

const sample = (): SaveData => ({
  version: 1,
  game: { ...initialGame(), week: 3, cards: ['greed-job'] },
  settings: { ...defaultSettings(), lang: 'en' },
});

describe('storage', () => {
  beforeEach(() => __resetStorageForTests());

  it('save round-trips', async () => {
    expect(await loadSave()).toBeNull();
    const s = sample();
    await writeSave(s);
    expect(await loadSave()).toEqual(s);
    expect(storageMode()).toBe('indexeddb');
  });

  it('falls back to memory when IndexedDB is missing', async () => {
    const saved = globalThis.indexedDB;
    // @ts-expect-error simulate a browser without IndexedDB
    delete globalThis.indexedDB;
    try {
      __resetStorageForTests();
      expect(await loadSave()).toBeNull();
      expect(storageMode()).toBe('memory');
      const s = sample();
      await writeSave(s);
      expect(await loadSave()).toEqual(s);
    } finally {
      globalThis.indexedDB = saved;
      __resetStorageForTests();
    }
  });
});

describe('writeSaveNow', () => {
  it('writes through the open database and can be read back', async () => {
    const { writeSaveNow } = await import('./db');
    __resetStorageForTests();
    await loadSave(); // opens the database
    const data: SaveData = { version: 1, game: { ...initialGame(), week: 5 }, settings: defaultSettings() };
    await writeSaveNow(data);
    expect((await loadSave())?.game.week).toBe(5);
    expect(storageMode()).toBe('indexeddb');
  });
});

describe('asks the browser to keep the save (lost-progress report, 8 Nov)', () => {
  it('requests persistent storage once when the database opens, and copes without the API', async () => {
    const { __resetStorageForTests, loadSave } = await import('./db');
    const persist = vi.fn(() => Promise.resolve(true));
    const nav = globalThis.navigator as unknown as { storage?: unknown };
    const before = nav.storage;
    Object.defineProperty(globalThis.navigator, 'storage', { value: { persist, persisted: () => Promise.resolve(false) }, configurable: true });
    __resetStorageForTests();
    await loadSave();
    await loadSave();
    expect(persist).toHaveBeenCalledTimes(1);
    Object.defineProperty(globalThis.navigator, 'storage', { value: undefined, configurable: true });
    __resetStorageForTests();
    await expect(loadSave()).resolves.toBeDefined();
    Object.defineProperty(globalThis.navigator, 'storage', { value: before, configurable: true });
  });
});
