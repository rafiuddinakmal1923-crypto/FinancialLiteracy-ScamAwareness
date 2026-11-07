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
