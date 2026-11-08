import Dexie, { type EntityTable } from 'dexie';
import type { GameData } from '../state/game';
import type { SettingsData } from '../state/settings';

export interface SaveData { version: 1; game: GameData; settings: SettingsData }

interface SaveRow { id: 'main'; data: SaveData }
type CelikDb = Dexie & { save: EntityTable<SaveRow, 'id'> };

let db: CelikDb | null = null;
let opened: Promise<CelikDb | null> | null = null;
let mode: 'indexeddb' | 'memory' = 'indexeddb';
let memorySave: SaveData | null = null;

/** Asks the browser not to clear the save when the phone runs low on space. Best effort: ignored where unsupported. */
function keepStorage(): void {
  try { void navigator.storage?.persist?.().catch(() => undefined); } catch { /* not supported */ }
}

async function open(): Promise<CelikDb | null> {
  if (typeof indexedDB === 'undefined') { mode = 'memory'; return null; }
  try {
    const d = new Dexie('celik') as CelikDb;
    d.version(1).stores({ save: 'id' });
    await d.open();
    keepStorage();
    db = d;
    mode = 'indexeddb';
    return d;
  } catch {
    mode = 'memory';
    return null;
  }
}

function getDb(): Promise<CelikDb | null> {
  opened ??= open();
  return opened;
}

export function storageMode(): 'indexeddb' | 'memory' { return mode; }

export async function loadSave(): Promise<SaveData | null> {
  const d = await getDb();
  if (!d) return memorySave ? structuredClone(memorySave) : null;
  try {
    return (await d.save.get('main'))?.data ?? null;
  } catch {
    mode = 'memory';
    return memorySave ? structuredClone(memorySave) : null;
  }
}

export async function writeSave(data: SaveData): Promise<void> {
  const d = await getDb();
  if (d) {
    try { await d.save.put({ id: 'main', data }); return; } catch { mode = 'memory'; }
  }
  memorySave = structuredClone(data);
}

/**
 * Like writeSave, but when the database is already open the IndexedDB transaction is started
 * synchronously, so a write issued from a pagehide / visibilitychange handler is not lost on unload.
 */
export function writeSaveNow(data: SaveData): Promise<void> {
  if (!db || mode !== 'indexeddb') return writeSave(data);
  try {
    const idb = db.backendDB();
    const tx = idb.transaction('save', 'readwrite');
    tx.objectStore('save').put({ id: 'main', data } satisfies SaveRow);
    tx.commit?.();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => { void writeSave(data).then(resolve); };
    });
  } catch {
    return writeSave(data);
  }
}

export function __resetStorageForTests(): void {
  try { db?.close(); } catch { /* ignore */ }
  db = null; opened = null; mode = 'indexeddb'; memorySave = null;
  if (typeof indexedDB !== 'undefined') indexedDB.deleteDatabase('celik');
}
