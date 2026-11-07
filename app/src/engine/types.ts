export const TACTICS = ['greed','urgency','authority','fear','secrecy','social','payfirst'] as const;
export type Tactic = typeof TACTICS[number];
/** Finance concepts (D23, SDS 4.1b); each has a Kad Ilmu in content/concepts.json. */
export const CONCEPTS = ['bajet','kecemasan','kompaun','risiko','hutang','semak'] as const;
export type Concept = typeof CONCEPTS[number];
/** Every scenario has a family (D33): `budget` and `pay` are for finance scenarios. */
export const FAMILIES = ['job','mule','investment','parcel','authority','loan','payment','bank','marketplace','budget','pay'] as const;
export type Family = typeof FAMILIES[number];
/** Scam: scammed, mule, frozen, safe. Legit: safe, curiga. Finance: safe, untung (right); rugi, hutang, curiga (wrong). */
export type Outcome = 'scammed' | 'mule' | 'frozen' | 'safe' | 'curiga' | 'untung' | 'rugi' | 'hutang';
export const OUTCOMES = ['scammed', 'mule', 'frozen', 'safe', 'curiga', 'untung', 'rugi', 'hutang'] as const satisfies readonly Outcome[];
export type ScenarioType = 'scam' | 'legit' | 'finance';
/** Outcomes each scenario type may end in (checked at build time and by applyOutcome). */
export const OUTCOMES_BY_TYPE: Record<ScenarioType, readonly Outcome[]> = {
  scam: ['scammed', 'mule', 'frozen', 'safe'],
  legit: ['safe', 'curiga'],
  finance: ['safe', 'untung', 'rugi', 'hutang', 'curiga'],
};
/** Right calls in every scenario type (SDS 5.4); every other outcome is a wrong call. */
export const RIGHT_OUTCOMES: readonly Outcome[] = ['safe', 'untung'];
/** The right outcomes a scenario type may end in, e.g. finance: safe, untung. */
export function rightOutcomes(type: ScenarioType): Outcome[] {
  return OUTCOMES_BY_TYPE[type].filter((o) => RIGHT_OUTCOMES.includes(o));
}
/** The wrong outcomes a scenario type may end in, e.g. finance: rugi, hutang, curiga. */
export function wrongOutcomes(type: ScenarioType): Outcome[] {
  return OUTCOMES_BY_TYPE[type].filter((o) => !RIGHT_OUTCOMES.includes(o));
}
/** Labur products (D22): Amanah Cempaka (fixed-price fund) and Dana Ekuiti Cempaka (unit trust). */
export const LABUR_PRODUCTS = ['amanah', 'ekuiti'] as const;
export type LaburProduct = typeof LABUR_PRODUCTS[number];
/** Finalist features (D36-D41, SDS 4.6). */
export type LocalizedText = { ms: string; en?: string | undefined };
export const FEED_KINDS = ['advice', 'hype', 'scam'] as const;
export type FeedKind = typeof FEED_KINDS[number];
export const FEED_CALLS = ['percaya', 'semak', 'lapor'] as const;
export type FeedCall = typeof FEED_CALLS[number];
/** A Suapan post. Semak opens a Kalkulator preset (`calc`, an id in calc-presets.json) or a Kad Ilmu (`kad`). */
export interface FeedPost {
  id: string; kind: FeedKind;
  author: { name: string; handle: string; followers: string };
  text: LocalizedText;
  /** Advice and hype posts name a concept. */
  concept?: Concept | undefined;
  /** Scam posts list their tactics. */
  tactics?: Tactic[] | undefined;
  semak: { calc: string } | { kad: Concept };
  /** Required on hype and scam posts (D36). */
  debrief?: LocalizedText | undefined;
}
export const SHOP_POTS = ['keperluan', 'kehendak'] as const;
export type ShopPot = typeof SHOP_POTS[number];
export const SHOP_EFFECTS = ['none', 'transport', 'instalment'] as const;
export type ShopEffect = typeof SHOP_EFFECTS[number];
/** A Kedai Kampus item; its price is in BALANCE.kedai.prices. `instalment` opens Kalkulator preset `kedai-<id>`. */
export interface ShopItem { id: string; name: LocalizedText; pot: ShopPot; effect: ShopEffect; tip: LocalizedText }
/** One bought item, the week it was bought and the pot it was logged under. */
export interface Purchase { item: string; week: number; pot?: ShopPot }
export const GOAL_IDS = ['kecemasan', 'laptop', 'raya', 'labur'] as const;
export type GoalId = typeof GOAL_IDS[number];
export const GOAL_MEASURES = ['simpanan', 'labur', 'duit'] as const;
export type GoalMeasure = typeof GOAL_MEASURES[number];
/** A Matlamat Semester goal; its target is in BALANCE.matlamat.targets. */
export interface Goal { id: GoalId; measure: GoalMeasure; name: LocalizedText }
/** A fictional classmate on Papan Markah. Entry n (k1, k2, ...) takes BALANCE.papan.grades[n - 1]. */
export interface Classmate { id: string; name: string; avatar: string }
/** A Tonton explainer: frames name files in assets/explainers/ without the .svg extension (the content scan reads a dotted name as a domain). */
export interface Explainer { id: string; concept: Concept; frames: { svg: string; caption: LocalizedText }[] }
export const CALC_TABS = ['masa', 'pulangan', 'kos'] as const;
export type CalcTab = typeof CALC_TABS[number];
export type Akaun = 'Aktif' | 'Disekat' | 'Ditutup';
export type Rekod = 'Bersih' | 'Disiasat' | 'Didakwa';
export type Effect =
  | { kind: 'duit'; delta: number } | { kind: 'tekanan'; delta: number }
  | { kind: 'akaun'; value: Akaun } | { kind: 'rekod'; value: Rekod }
  | { kind: 'labur'; product: LaburProduct; delta: number };
export interface Flag { tactic: Tactic; phrase: string }
export type UiDirective =
  | { kind: 'transfer'; amount: number; to?: string } | { kind: 'link'; url: string }
  | { kind: 'calc'; tab: CalcTab; preset: string };
export interface ScenarioMeta {
  id: string; type: ScenarioType; family: Family; tactics: Tactic[];
  /** Finance concepts this scenario teaches; [] when the scenario declares none. */
  concepts: Concept[];
  contact: string; number?: string; ui: 'chat' | 'call'; hint?: string; apaPatut: string[];
}
export interface Meters {
  duit: number; simpanan: number; tekanan: number; xp: number;
  imuniti: Record<Tactic, number>; akaun: Akaun; rekod: Rekod;
  /** Celik Kewangan per concept, 0-100 (D23). */
  celik: Record<Concept, number>;
  /** Labur pot balances in RM (D22); not spendable Duit. */
  labur: Record<LaburProduct, number>;
}
export interface ScenarioResult {
  id: string; outcome: Outcome; right: boolean; flagsFound: number; flagsTotal: number;
  tactics: Tactic[]; family: Family; concepts: Concept[];
}
export interface CompiledScenario {
  meta: ScenarioMeta; json: string; flags: Flag[];
  /** English version (content/scenarios/en/<id>.ink), same structure as this one (scenarioParityProblems). */
  en?: CompiledScenario;
}
/** One step of a chat so far: a reply chosen, or a ui pause resolved. Replaying these rebuilds the chat in any language. */
export type TrailStep = { c: number } | { u: boolean };

/** One bubble of a played scenario (kept as the transcript for the flag hunt and the read-only replay). */
export interface ChatMessage {
  id: number;
  from: 'them' | 'me' | 'system';
  speaker: string | null;
  text: string;
  flags: Flag[];
}

/**
 * The scenario whose chat just ended and whose consequence, flag hunt and debrief are still open.
 * `found` lists the tactics already found in the flag hunt (each awards a card once); `huntDone` is set by Selesai.
 */
export interface EndedScenario {
  id: string; outcome: Outcome; missed?: number; transcript: ChatMessage[];
  /** The path played; rebuilds the transcript in the current language. Missing in older saves. */
  trail?: TrailStep[];
  found: Tactic[]; huntDone: boolean;
}
