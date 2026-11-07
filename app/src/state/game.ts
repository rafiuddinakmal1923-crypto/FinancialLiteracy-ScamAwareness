import { create } from 'zustand';
import { BALANCE } from '../engine/balance';
import { cardId } from '../engine/cards';
import { applyBudget, applyWeekIntro, moveLabur as engineMoveLabur, type BudgetSplit, type IntroSummary, type MoveResult, type WeekDef } from '../engine/week';
import { round2 } from '../engine/money';
import { applyEffect, applyFlagFound, applyMoneyAnswer, applyOutcome, applySwipeAnswer, applyXp, initialMeters, isRight } from '../engine/meters';
import { updateHarianStreak } from '../engine/harian';
import { dayDiff } from '../engine/dates';
import { applyFeedResult, judgePost, type FeedResult } from '../engine/feed';
import { goalReached } from '../engine/goals';
import { buyItem as engineBuyItem, type BuyResult } from '../engine/shop';
import type { ChatMessage, TrailStep, Concept, Effect, EndedScenario, Family, FeedCall, FeedPost, GoalId, LaburProduct, Meters, Outcome, Purchase, ScenarioMeta, ShopPot, ScenarioResult, Tactic } from '../engine/types';

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
    harian: { ...initialHarian(), ...d.harian },
    active: d.active ? { ...d.active, snapshot: fillMeters(d.active.snapshot) } : null,
    kadIlmu: d.kadIlmu ?? [],
    drills: d.drills ?? [],
    // A save from before actionsPaid existed: every action it had ticked was already paid.
    actionsPaid: d.actionsPaid ?? d.actions ?? [],
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

/** One step of a chat so far, for replaying it after the Kalkulator: a reply chosen, or a ui pause resolved. */
export type { TrailStep };

/**
 * Where a chat paused to open the Kalkulator ("Kira dulu"): the player's path so far, so the chat can be rebuilt
 * at the same point (also after a reload), and whether they pressed Kembali ke perbualan. Persisted.
 */
export interface CalcResume { id: string; family: Family; trail: TrailStep[]; returned: boolean }

export interface HarianData {
  streak: number; lastPlayed: string | null; freezeWeek: string | null; best: number;
  lastScore: number | null; lastDeckDate: string | null;
}

/** Cek Harian round in progress (survives a reload): the local date, and the right/wrong flag of each card answered so far. */
export interface HarianProgress { date: string; answers: boolean[] }

export function initialHarian(): HarianData {
  return { streak: 0, lastPlayed: null, freezeWeek: null, best: 0, lastScore: null, lastDeckDate: null };
}

export interface GameData {
  character: 'aina' | 'amir'; name: string;
  /** True once onboarding is finished (a game exists). Week stays 0 until the first week intro opens week 1. */
  onboarded: boolean;
  /** 0 before the first week intro, then 1..12. Labels show at least "Minggu 1". */
  week: number; meters: Meters;
  budget: BudgetSplit | null;
  results: ScenarioResult[]; cards: string[]; badges: Tactic[];
  /** The 60-second Sahih atau Scam round: best score and its own play streak. */
  swipe: { best: number; streak: number; lastPlayed: string | null };
  /** Cek Harian (Task 20): streak with one free freeze a week (`freezeWeek` = ISO week it was used), last result. */
  harian: HarianData;
  /** Cek Harian round in progress, or null (cleared when the round ends or the date changes). */
  harianProgress: HarianProgress | null;
  /** Local date on which the 60-second round already gave its XP (XP once a day, no farming). */
  swipeXpDate: string | null;
  /** Latihan Tindakan checklist ids currently ticked (self-reported). */
  actions: string[];
  /** Action ids whose +25 XP was already paid (ticking again after an untick pays nothing). */
  actionsPaid: string[];
  /** Latihan drills completed ('997', 'semak'), +40 XP each once. */
  drills: string[];
  incomeTotal: number;
  active: { id: string; snapshot: Meters; hintUsed: boolean } | null;
  /** The chat that just ended, until its debrief is closed (or Cuba lagi). */
  lastEnded: EndedScenario | null;
  /** Read-only transcripts of finished scenarios, by id (ruling R8: no replays from Sembang). */
  transcripts: Record<string, ChatMessage[]>;
  /** The path played in each finished scenario, so its read-only chat shows in the current language. */
  trails: Record<string, TrailStep[]>;
  /** True while the week intro is showing; Labur moves are allowed only then (D22). */
  weekIntroOpen: boolean;
  /** BankKu transactions, oldest first (last TX_LOG_MAX). */
  txLog: TxEntry[];
  /** Scenario ids whose Kalkulator +10 XP was already awarded (once per scenario). */
  calcUsed: string[];
  /** The chat that is waiting while the Kalkulator is open, or null. */
  calcResume: CalcResume | null;
  /** "<scenario>:<tactic>" flags already counted from an unrealistic Semak Pulangan result. */
  calcFlagged: string[];
  /** Kad Ilmu earned (one per finance concept), in the order earned. */
  kadIlmu: Concept[];
  /** Matlamat Semester goal picked after the week-0 split, or null (D38). */
  goal: GoalId | null;
  /** True once the goal XP bonus was paid. */
  goalPaid: boolean;
  /** Kedai Kampus items bought, oldest first (D37). */
  purchases: Purchase[];
  /** Suapan calls by post id; a post is judged once (D36). */
  feed: Record<string, FeedCall>;
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
  endScenario(e: { id: string; outcome: Outcome; missed?: number; transcript: ChatMessage[]; trail?: TrailStep[] }): void;
  /**
   * Flag hunt progress on lastEnded: marks a newly found tactic. Only a scam scenario awards its card, Imuniti
   * and XP (via foundFlag); legit and finance hunts just count (M6).
   */
  huntFlag(tactic: Tactic, meta: Pick<ScenarioMeta, 'type' | 'family'>): void;
  finishHunt(): void;
  /** Week 0: stores the budget split and sets Simpanan. Throws RangeError on a bad split. */
  setBudget(split: BudgetSplit): void;
  /** Advances to the next week, applies its intro and opens it. Returns null (no-op) at week 12, or while an intro, a chat or an aftermath is open. `def` is that week's content. */
  beginWeek(def: WeekDef): IntroSummary | null;
  closeWeekIntro(): void;
  moveLabur(product: LaburProduct, delta: number): MoveResult;
  /** The chat opens the Kalkulator: remember where it was. */
  calcOpen(r: { id: string; family: Family; trail: TrailStep[] }): void;
  /** Kembali ke perbualan: the chat resumes past its Kalkulator pause. */
  calcReturn(): void;
  /** The chat consumed the resume point. */
  calcDone(): void;
  /** +10 XP the first time the Kalkulator is used in scenario `id`. Returns true when it was just awarded. */
  calcUse(id: string): boolean;
  /** An unrealistic Semak Pulangan result inside the open scenario counts as a found flag, once per scenario. */
  calcFlag(tactic: Tactic): void;
  /** Cek Harian finished with `score` (cards right) on local date `today`: streak and result; a no-op if already played today. */
  playHarian(score: number, today: string): void;
  /** One card answered: swipe cards move Imuniti per tactic, money cards move Celik for `concept`; XP when right. */
  answerCard(kind: 'swipe' | 'money', right: boolean, tactics: Tactic[], concept?: Concept): void;
  /** Saves (or clears) the Cek Harian round in progress. */
  setHarianProgress(p: HarianProgress | null): void;
  /** True the first time it is called on local date `today` (the 60-second round then gives XP); false after that. */
  claimSwipeXp(today: string): boolean;
  /** A 60-second round answer: Imuniti always, XP only when `withXp`. */
  answerRound(right: boolean, tactics: Tactic[], withXp: boolean): void;
  /** A 60-second round ended with `score`: best score and the day streak of the round. */
  recordSwipe(score: number, today: string): void;
  /** Awards each concept's Kad Ilmu the first time (+BALANCE.xp.kadIlmu XP each). Returns the newly awarded ones. */
  awardKadIlmu(concepts: Concept[]): Concept[];
  /** Drill `id` finished: +BALANCE.xp.drill XP the first time only. Returns true when XP was just awarded. */
  completeDrill(id: string): boolean;
  /** Ticks a real-action checklist item: +BALANCE.xp.action XP the first time only. Returns true when XP was just awarded. */
  tickAction(id: string): boolean;
  /** Unticks an item. The XP already paid stays paid. */
  untickAction(id: string): void;
  /** Picks the semester goal (or clears it with null). */
  setGoal(goal: GoalId | null): void;
  /** Buys a Kedai Kampus item and logs it in BankKu under its pot. On an error nothing changes. */
  buyItem(itemId: string, pot?: ShopPot): BuyResult;
  /** Pays the goal XP bonus once, at week 12, if the goal was reached. Returns true when it was just paid. */
  claimGoalXp(): boolean;
  /** Judges one Suapan call and saves it. Returns null, changing nothing, if the post was already judged. */
  judgeFeed(post: FeedPost, call: FeedCall): FeedResult | null;
  hydrate(d: GameData | null): void;
  reset(): void;
  set(p: Partial<GameData>): void;
}

export function initialGame(): GameData {
  return {
    character: 'aina', name: 'Aina', onboarded: false, week: 0, meters: initialMeters(), budget: null,
    results: [], cards: [], badges: [], swipe: { best: 0, streak: 0, lastPlayed: null }, harian: initialHarian(), harianProgress: null, swipeXpDate: null,
    actions: [], actionsPaid: [], drills: [], incomeTotal: 0, active: null, lastEnded: null, transcripts: {}, trails: {}, weekIntroOpen: false,
    txLog: [], calcUsed: [], calcResume: null, calcFlagged: [], kadIlmu: [], goal: null, goalPaid: false, purchases: [], feed: {},
  };
}

const DATA_KEYS: (keyof GameData)[] = [
  'character', 'name', 'onboarded', 'week', 'meters', 'budget', 'results', 'cards', 'badges',
  'swipe', 'harian', 'harianProgress', 'swipeXpDate', 'actions', 'actionsPaid', 'drills', 'incomeTotal', 'active', 'lastEnded', 'transcripts', 'trails', 'weekIntroOpen', 'txLog',
  'calcUsed', 'calcResume', 'calcFlagged', 'kadIlmu', 'goal', 'goalPaid', 'purchases', 'feed',
];

/** Picks only the persisted data fields (no actions) from the store state. */
export function gameData(s: GameData): GameData {
  const out: Record<string, unknown> = {};
  for (const k of DATA_KEYS) out[k] = s[k];
  return out as unknown as GameData;
}

/**
 * Applies a meter change to the live meters and to the open chat's snapshot, so rewinding the chat (it restarts
 * from the snapshot when it reopens after the Kalkulator) does not lose what was earned there.
 */
function bumpMeters(s: GameData, fn: (m: Meters) => Meters): Pick<GameData, 'meters' | 'active'> {
  return { meters: fn(s.meters), active: s.active ? { ...s.active, snapshot: fn(s.active.snapshot) } : null };
}
const bumpXp = (s: GameData, delta: number) => bumpMeters(s, (m) => applyXp(m, delta));

export const useGame = create<GameData & GameActions>()((set, get) => ({
  ...initialGame(),

  startScenario: (id) => {
    const { active, meters, lastEnded, txLog } = get();
    // Starting any chat now would roll the meters back to the snapshot and lose the ended chat's effects.
    if (lastEnded) return;
    const base = active ? active.snapshot : meters;
    const { calcResume } = get();
    set({
      meters: base, active: { id, snapshot: base, hintUsed: false }, txLog: active ? dropTx(txLog, active.id) : txLog,
      calcResume: calcResume && calcResume.id !== id ? null : calcResume,
    });
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
    const { meters, results, lastEnded, transcripts, trails } = get();
    const result: ScenarioResult = {
      id: meta.id, outcome, right: isRight(outcome), flagsFound, flagsTotal,
      tactics: meta.tactics, family: meta.family, concepts: meta.concepts,
    };
    const transcript = lastEnded?.id === meta.id ? lastEnded.transcript : null;
    const trail = lastEnded?.id === meta.id ? lastEnded.trail : undefined;
    set({
      meters: applyOutcome(meters, meta, outcome), results: [...results, result], active: null, lastEnded: null, calcResume: null,
      calcFlagged: get().calcFlagged.filter((k) => !k.startsWith(`${meta.id}:`)),
      transcripts: transcript ? { ...transcripts, [meta.id]: transcript } : transcripts,
      trails: trail ? { ...trails, [meta.id]: trail } : trails,
    });
  },

  retryScenario: () => {
    const { active, txLog } = get();
    if (!active) return;
    set({ meters: active.snapshot, active: { ...active, hintUsed: false }, lastEnded: null, calcResume: null, txLog: dropTx(txLog, active.id) });
  },

  endScenario: ({ id, outcome, missed, transcript, trail }) => {
    const { active } = get();
    if (active?.id !== id) return;
    const e: EndedScenario = { id, outcome, transcript, found: [], huntDone: false };
    if (missed !== undefined) e.missed = missed;
    if (trail) e.trail = trail;
    set({ lastEnded: e, calcResume: null });
  },

  huntFlag: (tactic, meta) => {
    const { lastEnded, calcFlagged } = get();
    if (!lastEnded || lastEnded.huntDone || lastEnded.found.includes(tactic)) return;
    // A flag already counted by the Kalkulator (calcFlag) is not awarded twice; it still counts as found here.
    const viaCalc = calcFlagged.includes(`${lastEnded.id}:${tactic}`);
    if (meta.type === 'scam' && !viaCalc) get().foundFlag(tactic, meta.family);
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

  calcOpen: ({ id, family, trail }) => set({ calcResume: { id, family, trail: [...trail], returned: false } }),

  calcReturn: () => {
    const { calcResume } = get();
    if (calcResume) set({ calcResume: { ...calcResume, returned: true } });
  },

  calcDone: () => set({ calcResume: null }),

  calcUse: (id) => {
    const { calcUsed } = get();
    if (calcUsed.includes(id)) return false;
    set({ ...bumpXp(get(), BALANCE.xp.calc), calcUsed: [...calcUsed, id] });
    return true;
  },

  calcFlag: (tactic) => {
    const { calcResume, calcFlagged, cards } = get();
    if (!calcResume) return;
    const key = `${calcResume.id}:${tactic}`;
    if (calcFlagged.includes(key)) return;
    const card = cardId(tactic, calcResume.family);
    set({
      ...bumpMeters(get(), (m) => applyFlagFound(m, tactic)),
      calcFlagged: [...calcFlagged, key], cards: cards.includes(card) ? cards : [...cards, card],
    });
  },

  setBudget: (split) => {
    set({ meters: applyBudget(get().meters, split), budget: { ...split } });
  },

  beginWeek: (def) => {
    const { week, weekIntroOpen, meters, incomeTotal, txLog, active, lastEnded, purchases } = get();
    // The rest of canBeginWeek (every earlier scenario finished) needs the content, so WeekIntro checks it.
    if (week >= BALANCE.semesterWeeks || weekIntroOpen || active || lastEnded) return null;
    if (def.week !== week + 1) throw new Error(`beginWeek: expected week ${week + 1}, got ${def.week}`);
    const summary = applyWeekIntro(meters, def, BALANCE, purchases);
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

  playHarian: (score, today) => {
    const { harian } = get();
    // Same day (already played) or a clock moved back: nothing changes, not even the last result.
    if (harian.lastPlayed !== null && today <= harian.lastPlayed) return;
    set({ harian: { ...harian, ...updateHarianStreak(harian, today), lastScore: score, lastDeckDate: today } });
  },

  answerCard: (kind, right, tactics, concept) => {
    if (kind === 'swipe') set(bumpMeters(get(), (m) => applySwipeAnswer(m, right, tactics)));
    else if (concept) set(bumpMeters(get(), (m) => applyMoneyAnswer(m, right, concept)));
  },

  setHarianProgress: (p) => set({ harianProgress: p }),

  claimSwipeXp: (today) => {
    if (get().swipeXpDate === today) return false;
    set({ swipeXpDate: today });
    return true;
  },

  answerRound: (right, tactics, withXp) => {
    if (withXp) { get().answerCard('swipe', right, tactics); return; }
    // Imuniti moves the same; take back the XP the shared rule adds.
    set(bumpMeters(get(), (m) => applyXp(applySwipeAnswer(m, right, tactics), right ? -BALANCE.xp.swipeRight : -BALANCE.xp.swipeWrong)));
  },

  recordSwipe: (score, today) => {
    const { swipe } = get();
    const gap = swipe.lastPlayed === null ? null : dayDiff(swipe.lastPlayed, today);
    const streak = gap === null ? 1 : gap <= 0 ? Math.max(1, swipe.streak) : gap === 1 ? swipe.streak + 1 : 1;
    set({ swipe: { best: Math.max(swipe.best, score), streak, lastPlayed: gap !== null && gap < 0 ? swipe.lastPlayed : today } });
  },

  awardKadIlmu: (concepts) => {
    const { kadIlmu } = get();
    const fresh = concepts.filter((c, i) => !kadIlmu.includes(c) && concepts.indexOf(c) === i);
    if (fresh.length) set({ ...bumpXp(get(), fresh.length * BALANCE.xp.kadIlmu), kadIlmu: [...kadIlmu, ...fresh] });
    return fresh;
  },

  completeDrill: (id) => {
    const { drills } = get();
    if (drills.includes(id)) return false;
    set({ ...bumpXp(get(), BALANCE.xp.drill), drills: [...drills, id] });
    return true;
  },

  tickAction: (id) => {
    const { actions, actionsPaid } = get();
    const next = actions.includes(id) ? actions : [...actions, id];
    if (actionsPaid.includes(id)) { set({ actions: next }); return false; }
    set({ ...bumpXp(get(), BALANCE.xp.action), actions: next, actionsPaid: [...actionsPaid, id] });
    return true;
  },

  untickAction: (id) => set({ actions: get().actions.filter((a) => a !== id) }),

  setGoal: (goal) => set({ goal }),

  buyItem: (itemId, pot) => {
    const { meters, week, purchases, txLog } = get();
    const r = engineBuyItem({ meters, week, purchases }, itemId);
    if ('error' in r) return r;
    const amount = round2(r.state.meters.duit - meters.duit);
    const bought = r.state.purchases.map((p) => (p.item === itemId && pot ? { ...p, pot } : p));
    set({
      // Also on the open chat's snapshot, so rewinding a chat does not refund the purchase.
      ...bumpMeters(get(), (m) => applyEffect(m, { kind: 'duit', delta: amount })),
      purchases: bought,
      txLog: appendTx(txLog, week, [{ label: pot ? `bankku.tx.kedai.${pot}` : 'bankku.tx.kedai', amount }]),
    });
    return r;
  },

  claimGoalXp: () => {
    const { goal, goalPaid, meters, week } = get();
    if (goalPaid || week < BALANCE.semesterWeeks || !goalReached({ goal, meters })) return false;
    set({ ...bumpXp(get(), BALANCE.matlamat.xpReached), goalPaid: true });
    return true;
  },

  judgeFeed: (post, call) => {
    const { feed } = get();
    if (feed[post.id]) return null;
    const result = judgePost(post, call);
    set({ ...bumpMeters(get(), (m) => applyFeedResult(m, post, result.verdict)), feed: { ...feed, [post.id]: call } });
    return result;
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
