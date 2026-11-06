// Mod Kelas (S17): a projector card battle for 2-6 teams. Pure reducer; the facilitator drives it from one laptop.
import { BALANCE } from './balance';
import { mulberry32, pickRound, shuffle } from './harian';
import type { MoneyCard, SwipeCard } from './schemas';

export type ClassCard = { kind: 'swipe'; card: SwipeCard } | { kind: 'money'; card: MoneyCard };
export type TeamAnswer = 'sahih' | 'scam' | 'betul' | 'salah' | 'a' | 'b';
export type CardSet = 'scam' | 'duit' | 'campur';
export type ClassPhase = 'lobby' | 'question' | 'reveal' | 'scores' | 'winner';
export interface ClassTeam { id: string; name: string; color: string; score: number; answer: TeamAnswer | null }
export interface ClassState {
  phase: ClassPhase;
  teams: ClassTeam[];
  /** 0-based index of the current round. */
  round: number;
  deck: ClassCard[];
  cardSet: CardSet;
  /** Points earned in the last revealed round, by team id. */
  lastGain: Record<string, number>;
}

export type ClassAction =
  | { type: 'setTeams'; count: number }
  | { type: 'renameTeam'; id: string; name: string }
  | { type: 'setCardSet'; cardSet: CardSet }
  | { type: 'start'; deck: ClassCard[] }
  | { type: 'answer'; teamId: string; answer: TeamAnswer }
  | { type: 'reveal' }
  | { type: 'next' }
  | { type: 'lobby' };

/** Distinguishable on a projector and always shown next to the team name (colour is never the only signal). */
export const TEAM_DEFAULTS: { name: string; color: string }[] = [
  { name: 'Pasukan Merah', color: '#E5484D' },
  { name: 'Pasukan Biru', color: '#2D2A6E' },
  { name: 'Pasukan Kuning', color: '#F4A340' },
  { name: 'Pasukan Hijau', color: '#30A46C' },
  { name: 'Pasukan Ungu', color: '#8E4EC6' },
  { name: 'Pasukan Jingga', color: '#C2410C' },
];

const clampTeams = (n: number) => Math.min(BALANCE.kelas.maxTeams, Math.max(BALANCE.kelas.minTeams, Math.round(n) || BALANCE.kelas.minTeams));
const newTeam = (i: number): ClassTeam => ({ id: `t${i + 1}`, ...TEAM_DEFAULTS[i], score: 0, answer: null });

export function initialClassState(): ClassState {
  return {
    phase: 'lobby',
    teams: Array.from({ length: BALANCE.kelas.minTeams }, (_, i) => newTeam(i)),
    round: 0, deck: [], cardSet: 'campur', lastGain: {},
  };
}

/** Rounds actually played: the configured number, or fewer when the deck is short. */
export const totalRounds = (s: ClassState) => Math.max(1, Math.min(BALANCE.kelas.rounds, s.deck.length || BALANCE.kelas.rounds));
export const currentCard = (s: ClassState): ClassCard | null => s.deck[s.round] ?? null;

export function validAnswers(c: ClassCard): TeamAnswer[] {
  if (c.kind === 'swipe') return ['sahih', 'scam'];
  return c.card.kind === 'truefalse' ? ['betul', 'salah'] : ['a', 'b'];
}

export function correctAnswer(c: ClassCard): TeamAnswer {
  if (c.kind === 'swipe') return c.card.answer === 'scam' ? 'scam' : 'sahih';
  if (c.card.kind === 'truefalse') return c.card.answer ? 'betul' : 'salah';
  return c.card.better === 0 ? 'a' : 'b';
}

export function classReducer(s: ClassState, a: ClassAction): ClassState {
  switch (a.type) {
    case 'setTeams': {
      if (s.phase !== 'lobby') return s;
      const n = clampTeams(a.count);
      return { ...s, teams: Array.from({ length: n }, (_, i) => s.teams[i] ?? newTeam(i)) };
    }
    case 'renameTeam':
      if (s.phase !== 'lobby') return s;
      return { ...s, teams: s.teams.map((t) => (t.id === a.id ? { ...t, name: a.name } : t)) };
    case 'setCardSet':
      return s.phase === 'lobby' ? { ...s, cardSet: a.cardSet } : s;
    case 'start':
      if (s.phase !== 'lobby' || a.deck.length === 0) return s;
      return {
        ...s, phase: 'question', round: 0, deck: a.deck, lastGain: {},
        teams: s.teams.map((t, i) => ({ ...t, name: t.name.trim() || TEAM_DEFAULTS[i].name, score: 0, answer: null })),
      };
    case 'answer': {
      const card = currentCard(s);
      if (s.phase !== 'question' || !card || !validAnswers(card).includes(a.answer)) return s;
      if (!s.teams.some((t) => t.id === a.teamId)) return s;
      return {
        ...s,
        teams: s.teams.map((t) => (t.id === a.teamId ? { ...t, answer: t.answer === a.answer ? null : a.answer } : t)),
      };
    }
    case 'reveal': {
      const card = currentCard(s);
      if (s.phase !== 'question' || !card) return s;
      const right = correctAnswer(card);
      const lastGain: Record<string, number> = {};
      const teams = s.teams.map((t) => {
        const gain = t.answer === right ? BALANCE.kelas.pointsCorrect : 0;
        lastGain[t.id] = gain;
        return { ...t, score: t.score + gain };
      });
      return { ...s, phase: 'reveal', teams, lastGain };
    }
    case 'next': {
      if (s.phase === 'reveal') return { ...s, phase: 'scores' };
      if (s.phase !== 'scores') return s;
      if (s.round >= totalRounds(s) - 1) return { ...s, phase: 'winner' };
      return { ...s, phase: 'question', round: s.round + 1, lastGain: {}, teams: s.teams.map((t) => ({ ...t, answer: null })) };
    }
    case 'lobby':
      return { ...s, phase: 'lobby', round: 0, deck: [], lastGain: {}, teams: s.teams.map((t) => ({ ...t, score: 0, answer: null })) };
  }
}

/** Every team on the top score (ties share the win). */
export function winners(s: ClassState): ClassTeam[] {
  const top = Math.max(...s.teams.map((t) => t.score));
  return s.teams.filter((t) => t.score === top);
}

/** Teams sorted by score, highest first (stable for ties). */
export const ranked = (s: ClassState): ClassTeam[] => [...s.teams].sort((x, y) => y.score - x.score);

/** Money deck: both kinds present whenever the pool has both, the rest a seeded draw. */
function pickMoney(money: MoneyCard[], n: number, rand: () => number): MoneyCard[] {
  const all = shuffle(money, rand);
  const chosen: MoneyCard[] = [];
  const tf = all.find((c) => c.kind === 'truefalse');
  const pk = all.find((c) => c.kind === 'pick');
  if (tf) chosen.push(tf);
  if (pk) chosen.push(pk);
  for (const c of all) if (chosen.length < n && !chosen.includes(c)) chosen.push(c);
  return shuffle(chosen.slice(0, n), rand);
}

/** The 10-card deck for a card set, the same for a given seed. Campur alternates swipe and money cards. */
export function deckFor(set: CardSet, seed: number, swipe: SwipeCard[], money: MoneyCard[]): ClassCard[] {
  const n = BALANCE.kelas.rounds;
  const rand = mulberry32(seed ^ 0x5bd1e995);
  const sw = (cards: SwipeCard[]): ClassCard[] => cards.map((card) => ({ kind: 'swipe', card }));
  const mo = (cards: MoneyCard[]): ClassCard[] => cards.map((card) => ({ kind: 'money', card }));
  if (set === 'scam') return sw(pickRound(swipe, n, seed));
  if (set === 'duit') return mo(pickMoney(money, n, rand));
  const half = Math.floor(n / 2);
  const s = sw(pickRound(swipe, n - half, seed));
  const m = mo(pickMoney(money, half, rand));
  const deck: ClassCard[] = [];
  for (let i = 0; i < n; i++) {
    const next = i % 2 === 0 ? s.shift() ?? m.shift() : m.shift() ?? s.shift();
    if (next) deck.push(next);
  }
  return deck;
}
