import { create } from 'zustand';
import { BALANCE } from '../engine/balance';
import { cardId } from '../engine/cards';
import { applyBudget, applyWeekIntro, moveLabur as engineMoveLabur, type BudgetSplit, type IntroSummary, type MoveResult, type WeekDef } from '../engine/week';
import { round2 } from '../engine/money';
import { applyEffect, applyFlagFound, applyOutcome, applyXp, initialMeters, isRight } from '../engine/meters';
import type { ChatMessage, Effect, EndedScenario, Family, LaburProduct, Meters, Outcome, ScenarioMeta, ScenarioResult, Tactic } from '../engine/types';

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
    // Saves from before `onboarded` existed: onboarding then set week to 1, so week >= 1 meant a game existed.
    onboarded: d.onboarded ?? (d.week ?? 0) >= 1,
    meters: fillMeters(d.meters),
    active: d.active ? { ...d.active, snapshot: fillMeters(d.active.snapshot) } : null,
    results: (d.results ?? []).map((r) => ({ ...r, concepts: r.concepts ?? [] })),
  };
}

/**
 * One BankKu transaction (S08): a change to Duit. `label` is a contact name, a week-cost label, or an i18n key
 * starting with "bankku." (income, Labur moves). `scenario` tags a chat's entries so a rollback can drop them.
 */
export interface TxEntry { id: number; week: number; label: string; amount: number; scenario?: string }

/** BankKu keeps this many transactions (it shows the last 5). */
export const TX_LOG_MAX = 50;

/** Appends one entry per non-zero amount and keeps the last TX_LOG_MAX. */
function appendTx(log: TxEntry[], week: number, items: { label: string; amount: number; scenario?: string }[]): TxEntry[] {
  let id = log.at(-1)?.id ?? 0;
  const added: TxEntry[] = [];
  for (const it of items) {
    if (it.amount === 0) continue;
    const e: TxEntry = { id: ++id, week, label: it.label, amount: it.amount };
    if (it.scenario !== undefined) e.scenario = it.scenario;
    added.push(e);
  }
  return added.length ? [...log, ...added].slice(-TX_LOG_MAX) : log;
}

/** The log without a rolled-back chat's entries. */
function dropTx(log: TxEntry[], scenario: string): TxEntry[] {
  return log.some((e) => e.scenario === scenario) ? log.filter((e) => e.scenario !== scenario) : log;
}

export interface GameData {
  character: 'aina' | 'amir'; name: string;
  /** True once onboarding is finished (a game exists). Week stays 0 until the first week intro opens week 1. */
  onboarded: boolean;
  /** 0 before the first week intro, then 1..12. Labels show at least "Minggu 1". */
  week: number; meters: Meters;
  budget: BudgetSplit | null;
  results: ScenarioResult[]; cards: string[]; badges: Tactic[];
  swipe: { best: number; streak: number; lastPlayed: string | null };
  actions: string[]; incomeTotal: number;
  active: { id: string; snapshot: Meters; hintUsed: boolean } | null;
  /** The chat that just ended, until its debrief is closed (or Cuba lagi). */
  lastEnded: EndedScenario | null;
  /** Read-only transcripts of finished scenarios, by id (ruling R8: no replays from Sembang). */
  transcripts: Record<string, ChatMessage[]>;
  /** True while the week intro is showing; Labur moves are allowed only then (D22). */
  weekIntroOpen: boolean;
  /** BankKu transactions, oldest first (last TX_LOG_MAX). */
  txLog: TxEntry[];
}

export interface GameActions {
  /** Starts (or restarts) a chat from a snapshot. A no-op while an ended chat's aftermath is pending (M2). */
  startScenario(id: string): void;
  /** Applies a scenario's effects; each Duit change is logged in BankKu under `label` (the scenario contact). */
  apply(effects: Effect[], label?: string): void;
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
  /** Week 0: stores the budget split and sets Simpanan. Throws RangeError on a bad split. */
  setBudget(split: BudgetSplit): void;
  /** Advances to the next week, applies its intro and opens it. Returns null (no-op) at week 12 or while an intro is open. `def` is that week's content. */
  beginWeek(def: WeekDef): IntroSummary | null;
  closeWeekIntro(): void;
  moveLabur(product: LaburProduct, delta: number): MoveResult;
  hydrate(d: GameData | null): void;
  reset(): void;
  set(p: Partial<GameData>): void;
}

export function initialGame(): GameData {
  return {
    character: 'aina', name: 'Aina', onboarded: false, week: 0, meters: initialMeters(), budget: null,
    results: [], cards: [], badges: [], swipe: { best: 0, streak: 0, lastPlayed: null },
    actions: [], incomeTotal: 0, active: null, lastEnded: null, transcripts: {}, weekIntroOpen: false,
    txLog: [],
  };
}

const DATA_KEYS: (keyof GameData)[] = [
  'character', 'name', 'onboarded', 'week', 'meters', 'budget', 'results', 'cards', 'badges',
  'swipe', 'actions', 'incomeTotal', 'active', 'lastEnded', 'transcripts', 'weekIntroOpen', 'txLog',
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
    const { active, meters, lastEnded, txLog } = get();
    // Starting any chat now would roll the meters back to the snapshot and lose the ended chat's effects.
    if (lastEnded) return;
    const base = active ? active.snapshot : meters;
    set({ meters: base, active: { id, snapshot: base, hintUsed: false }, txLog: active ? dropTx(txLog, active.id) : txLog });
  },

  apply: (effects, label) => {
    const { active, meters, txLog, week } = get();
    if (!active) return;
    let m = meters;
    const tx: { label: string; amount: number; scenario: string }[] = [];
    for (const e of effects) {
      const next = applyEffect(m, e);
      if (next.duit !== m.duit) tx.push({ label: label ?? 'bankku.tx.transfer', amount: round2(next.duit - m.duit), scenario: active.id });
      m = next;
    }
    set({ meters: m, txLog: appendTx(txLog, week, tx) });
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
    const { active, txLog } = get();
    if (!active) return;
    set({ meters: active.snapshot, active: { ...active, hintUsed: false }, lastEnded: null, txLog: dropTx(txLog, active.id) });
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

  setBudget: (split) => {
    set({ meters: applyBudget(get().meters, split), budget: { ...split } });
  },

  beginWeek: (def) => {
    const { week, weekIntroOpen, meters, incomeTotal, txLog } = get();
    if (week >= BALANCE.semesterWeeks || weekIntroOpen) return null;
    if (def.week !== week + 1) throw new Error(`beginWeek: expected week ${week + 1}, got ${def.week}`);
    const summary = applyWeekIntro(meters, def);
    const tx = [
      { label: 'bankku.tx.income', amount: summary.income },
      ...summary.costs.map((c) => ({ label: c.label, amount: -c.amount })),
    ];
    set({
      week: week + 1, meters: summary.meters, incomeTotal: incomeTotal + summary.income, weekIntroOpen: true,
      txLog: appendTx(txLog, week + 1, tx),
    });
    return summary;
  },

  closeWeekIntro: () => set({ weekIntroOpen: false }),

  moveLabur: (product, delta) => {
    const { meters, weekIntroOpen, txLog, week } = get();
    const r = engineMoveLabur(meters, product, delta, weekIntroOpen);
    if ('meters' in r) {
      const amount = round2(r.meters.duit - meters.duit);
      set({ meters: r.meters, txLog: appendTx(txLog, week, [{ label: `bankku.tx.labur.${product}`, amount }]) });
    }
    return r;
  },

  hydrate: (saved) => {
    if (!saved) { set(initialGame()); return; }
    const d = fillGame(saved);
    // A chat cut off mid-story is rolled back. One that had already ended keeps its effects, so its
    // consequence, flag hunt and debrief can still be finished (or retried) after a reload.
    if (d.active && d.lastEnded?.id === d.active.id) { set(d); return; }
    set({
      ...d, meters: d.active ? d.active.snapshot : d.meters, active: null, lastEnded: null,
      txLog: d.active ? dropTx(d.txLog, d.active.id) : d.txLog,
    });
  },

  reset: () => set(initialGame()),
  set: (p) => set(p),
}));
