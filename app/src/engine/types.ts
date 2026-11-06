export const TACTICS = ['greed','urgency','authority','fear','secrecy','social','payfirst'] as const;
export type Tactic = typeof TACTICS[number];
export const FAMILIES = ['job','mule','investment','parcel','authority','loan','payment','bank','marketplace'] as const;
export type Family = typeof FAMILIES[number];
export type Outcome = 'scammed' | 'mule' | 'frozen' | 'safe' | 'curiga';
export type Akaun = 'Aktif' | 'Disekat' | 'Ditutup';
export type Rekod = 'Bersih' | 'Disiasat' | 'Didakwa';
export type Effect =
  | { kind: 'duit'; delta: number } | { kind: 'tekanan'; delta: number }
  | { kind: 'akaun'; value: Akaun } | { kind: 'rekod'; value: Rekod };
export interface Flag { tactic: Tactic; phrase: string }
export type UiDirective = { kind: 'transfer'; amount: number } | { kind: 'link'; url: string };
export interface ScenarioMeta {
  id: string; type: 'scam' | 'legit'; family: Family; tactics: Tactic[];
  contact: string; number?: string; ui: 'chat' | 'call'; hint?: string; apaPatut: string[];
}
export interface Meters {
  duit: number; simpanan: number; tekanan: number; xp: number;
  imuniti: Record<Tactic, number>; akaun: Akaun; rekod: Rekod;
}
export interface ScenarioResult { id: string; outcome: Outcome; right: boolean; flagsFound: number; flagsTotal: number; tactics: Tactic[]; family: Family }
export interface CompiledScenario { meta: ScenarioMeta; json: string; flags: Flag[] }

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
  found: Tactic[]; huntDone: boolean;
}
