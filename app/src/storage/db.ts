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

async function open(): Promise<CelikDb | null> {
  if (typeof indexedDB === 'undefined') { mode = 'memory'; return null; }
  try {
    const d = new Dexie('celik') as CelikDb;
    d.version(1).stores({ save: 'id' });
    await d.open();
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

export function __resetStorageForTests(): void {
  try { db?.close(); } catch { /* ignore */ }
  db = null; opened = null; mode = 'indexeddb'; memorySave = null;
  if (typeof indexedDB !== 'undefined') indexedDB.deleteDatabase('celik');
}
