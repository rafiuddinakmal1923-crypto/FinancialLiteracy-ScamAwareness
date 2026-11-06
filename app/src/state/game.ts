import { create } from 'zustand';
import { BALANCE } from '../engine/balance';
import { cardId } from '../engine/cards';
import { applyEffect, applyFlagFound, applyOutcome, applyXp, initialMeters, isRight } from '../engine/meters';
import type { Effect, Family, Meters, Outcome, ScenarioMeta, ScenarioResult, Tactic } from '../engine/types';

export interface GameData {
  character: 'aina' | 'amir'; name: string; week: number; meters: Meters;
  budget: { needs: number; wants: number; savings: number } | null;
  results: ScenarioResult[]; cards: string[]; badges: Tactic[];
  swipe: { best: number; streak: number; lastPlayed: string | null };
  actions: string[]; incomeTotal: number;
  active: { id: string; snapshot: Meters; hintUsed: boolean } | null;
}

export interface GameActions {
  startScenario(id: string): void;
  apply(effects: Effect[]): void;
  useHint(): boolean;
  finishScenario(meta: ScenarioMeta, outcome: Outcome, flagsFound: number, flagsTotal: number): void;
  retryScenario(): void;
  foundFlag(tactic: Tactic, family: Family): void;
  hydrate(d: GameData | null): void;
  reset(): void;
  set(p: Partial<GameData>): void;
}

export function initialGame(): GameData {
  return {
    character: 'aina', name: 'Aina', week: 0, meters: initialMeters(), budget: null,
    results: [], cards: [], badges: [], swipe: { best: 0, streak: 0, lastPlayed: null },
    actions: [], incomeTotal: 0, active: null,
  };
}

const DATA_KEYS: (keyof GameData)[] = [
  'character', 'name', 'week', 'meters', 'budget', 'results', 'cards', 'badges',
  'swipe', 'actions', 'incomeTotal', 'active',
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
    const { active, meters } = get();
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
    const { meters, results } = get();
    const result: ScenarioResult = {
      id: meta.id, outcome, right: isRight(meta.type, outcome), flagsFound, flagsTotal,
      tactics: meta.tactics, family: meta.family,
    };
    set({ meters: applyOutcome(meters, meta, outcome), results: [...results, result], active: null });
  },

  retryScenario: () => {
    const { active } = get();
    if (!active) return;
    set({ meters: active.snapshot, active: { ...active, hintUsed: false } });
  },

  foundFlag: (tactic, family) => {
    const { meters, cards } = get();
    const id = cardId(tactic, family);
    set({ meters: applyFlagFound(meters, tactic), cards: cards.includes(id) ? cards : [...cards, id] });
  },

  hydrate: (d) => {
    if (!d) { set(initialGame()); return; }
    set({ ...initialGame(), ...d, meters: d.active ? d.active.snapshot : d.meters, active: null });
  },

  reset: () => set(initialGame()),
  set: (p) => set(p),
}));
