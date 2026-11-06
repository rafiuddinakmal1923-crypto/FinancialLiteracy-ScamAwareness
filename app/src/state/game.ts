import { create } from 'zustand';
import { BALANCE } from '../engine/balance';
import { cardId } from '../engine/cards';
import { applyEffect, applyFlagFound, applyOutcome, applyXp, initialMeters, isRight } from '../engine/meters';
import type { ChatMessage, Effect, EndedScenario, Family, Meters, Outcome, ScenarioMeta, ScenarioResult, Tactic } from '../engine/types';

/**
 * Fills meter fields an older save does not have (milestone 2 saves have no `celik` or `labur`) from the
 * defaults, keeping every saved value.
 */
export function fillMeters(m: Partial<Meters> | undefined): Meters {
  const d = initialMeters();
  if (!m) return d;
  return {
    ...d, ...m,
    imuniti: { ...d.imuniti, ...m.imuniti },
    celik: { ...d.celik, ...m.celik },
    labur: { ...d.labur, ...m.labur },
  };
}

/** Fills an older save's data: meters, the active snapshot and `results[].concepts`. */
function fillGame(d: GameData): GameData {
  return {
    ...initialGame(), ...d,
    meters: fillMeters(d.meters),
    active: d.active ? { ...d.active, snapshot: fillMeters(d.active.snapshot) } : null,
    results: (d.results ?? []).map((r) => ({ ...r, concepts: r.concepts ?? [] })),
  };
}

export interface GameData {
  character: 'aina' | 'amir'; name: string; week: number; meters: Meters;
  budget: { needs: number; wants: number; savings: number } | null;
  results: ScenarioResult[]; cards: string[]; badges: Tactic[];
  swipe: { best: number; streak: number; lastPlayed: string | null };
  actions: string[]; incomeTotal: number;
  active: { id: string; snapshot: Meters; hintUsed: boolean } | null;
  /** The chat that just ended, until its debrief is closed (or Cuba lagi). */
  lastEnded: EndedScenario | null;
  /** Read-only transcripts of finished scenarios, by id (ruling R8: no replays from Sembang). */
  transcripts: Record<string, ChatMessage[]>;
}

export interface GameActions {
  /** Starts (or restarts) a chat from a snapshot. A no-op while an ended chat's aftermath is pending (M2). */
  startScenario(id: string): void;
  apply(effects: Effect[]): void;
  useHint(): boolean;
  finishScenario(meta: ScenarioMeta, outcome: Outcome, flagsFound: number, flagsTotal: number): void;
  retryScenario(): void;
  foundFlag(tactic: Tactic, family: Family): void;
  /** Called when the active scenario's story ends: keeps the outcome and transcript for the post-chat screens. */
  endScenario(e: { id: string; outcome: Outcome; missed?: number; transcript: ChatMessage[] }): void;
  /**
   * Flag hunt progress on lastEnded: marks a newly found tactic. Only a scam scenario awards its card, Imuniti
   * and XP (via foundFlag); legit and finance hunts just count (M6).
   */
  huntFlag(tactic: Tactic, meta: Pick<ScenarioMeta, 'type' | 'family'>): void;
  finishHunt(): void;
  hydrate(d: GameData | null): void;
  reset(): void;
  set(p: Partial<GameData>): void;
}

export function initialGame(): GameData {
  return {
    character: 'aina', name: 'Aina', week: 0, meters: initialMeters(), budget: null,
    results: [], cards: [], badges: [], swipe: { best: 0, streak: 0, lastPlayed: null },
    actions: [], incomeTotal: 0, active: null, lastEnded: null, transcripts: {},
  };
}

const DATA_KEYS: (keyof GameData)[] = [
  'character', 'name', 'week', 'meters', 'budget', 'results', 'cards', 'badges',
  'swipe', 'actions', 'incomeTotal', 'active', 'lastEnded', 'transcripts',
];

/** Picks only the persisted data fields (no actions) from the store state. */
export function gameData(s: GameData): GameData {
  const out: Record<string, unknown> = {};
  for (const k of DATA_KEYS) out[k] = s[k];
  return out as unknown as GameData;
}

export const useGame = create<GameData & GameActions>()((set, get) => ({
  ...initialGame(),

  startScenario: (id) => {
    const { active, meters, lastEnded } = get();
    // Starting any chat now would roll the meters back to the snapshot and lose the ended chat's effects.
    if (lastEnded) return;
    const base = active ? active.snapshot : meters;
    set({ meters: base, active: { id, snapshot: base, hintUsed: false } });
  },

  apply: (effects) => {
    const { active, meters } = get();
    if (!active) return;
    set({ meters: effects.reduce(applyEffect, meters) });
  },

  useHint: () => {
    const { active, meters } = get();
    if (!active || active.hintUsed) return false;
    set({ meters: applyXp(meters, BALANCE.xp.hint), active: { ...active, hintUsed: true } });
    return true;
  },

  finishScenario: (meta, outcome, flagsFound, flagsTotal) => {
    const { meters, results, lastEnded, transcripts } = get();
    const result: ScenarioResult = {
      id: meta.id, outcome, right: isRight(outcome), flagsFound, flagsTotal,
      tactics: meta.tactics, family: meta.family, concepts: meta.concepts,
    };
    const transcript = lastEnded?.id === meta.id ? lastEnded.transcript : null;
    set({
      meters: applyOutcome(meters, meta, outcome), results: [...results, result], active: null, lastEnded: null,
      transcripts: transcript ? { ...transcripts, [meta.id]: transcript } : transcripts,
    });
  },

  retryScenario: () => {
    const { active } = get();
    if (!active) return;
    set({ meters: active.snapshot, active: { ...active, hintUsed: false }, lastEnded: null });
  },

  endScenario: ({ id, outcome, missed, transcript }) => {
    const { active } = get();
    if (active?.id !== id) return;
    const e: EndedScenario = { id, outcome, transcript, found: [], huntDone: false };
    if (missed !== undefined) e.missed = missed;
    set({ lastEnded: e });
  },

  huntFlag: (tactic, meta) => {
    const { lastEnded } = get();
    if (!lastEnded || lastEnded.huntDone || lastEnded.found.includes(tactic)) return;
    if (meta.type === 'scam') get().foundFlag(tactic, meta.family);
    set({ lastEnded: { ...lastEnded, found: [...lastEnded.found, tactic] } });
  },

  finishHunt: () => {
    const { lastEnded } = get();
    if (!lastEnded || lastEnded.huntDone) return;
    set({ lastEnded: { ...lastEnded, huntDone: true } });
  },

  foundFlag: (tactic, family) => {
    const { meters, cards } = get();
    const id = cardId(tactic, family);
    set({ meters: applyFlagFound(meters, tactic), cards: cards.includes(id) ? cards : [...cards, id] });
  },

  hydrate: (saved) => {
    if (!saved) { set(initialGame()); return; }
    const d = fillGame(saved);
    // A chat cut off mid-story is rolled back. One that had already ended keeps its effects, so its
    // consequence, flag hunt and debrief can still be finished (or retried) after a reload.
    if (d.active && d.lastEnded?.id === d.active.id) { set(d); return; }
    set({ ...d, meters: d.active ? d.active.snapshot : d.meters, active: null, lastEnded: null });
  },

  reset: () => set(initialGame()),
  set: (p) => set(p),
}));
