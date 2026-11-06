import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import {
  classReducer, correctAnswer, currentCard, deckFor, initialClassState, validAnswers, winners,
  type ClassCard, type ClassState,
} from './classmode';
import type { MoneyCard, SwipeCard } from './schemas';

const SWIPES: SwipeCard[] = Array.from({ length: 14 }, (_, i) => ({
  id: `s${i}`, channel: (['sms', 'chat', 'email'] as const)[i % 3], sender: `P${i}`, text: { ms: `Mesej ${i}` },
  answer: i % 2 === 0 ? 'scam' : 'legit', tactics: i % 2 === 0 ? ['greed'] : [], why: { ms: `Sebab ${i}` },
} as SwipeCard));
const MONEY: MoneyCard[] = Array.from({ length: 14 }, (_, i) => (i % 3 === 0
  ? { id: `m${i}`, kind: 'pick', concept: 'bajet', better: (i % 2) as 0 | 1, options: [{ ms: 'a' }, { ms: 'b' }], text: { ms: `Pilih ${i}` }, why: { ms: 'w' } }
  : { id: `m${i}`, kind: 'truefalse', concept: 'bajet', answer: i % 2 === 0, text: { ms: `Betul ${i}` }, why: { ms: 'w' } }) as MoneyCard);

const sw = (answer: 'scam' | 'legit'): ClassCard => ({
  kind: 'swipe',
  card: { id: 'x', channel: 'sms', sender: 'S', text: { ms: 't' }, answer, tactics: answer === 'scam' ? ['greed'] : [], why: { ms: 'w' } } as SwipeCard,
});
const deckOf = (n: number, card: ClassCard = sw('scam')): ClassCard[] => Array.from({ length: n }, () => card);

function started(deck: ClassCard[] = deckOf(10), teams = 2): ClassState {
  let s = classReducer(initialClassState(), { type: 'setTeams', count: teams });
  s = classReducer(s, { type: 'start', deck });
  return s;
}

describe('class reducer', () => {
  it('team count clamps to 2-6 and keeps names', () => {
    let s = initialClassState();
    expect(s.teams).toHaveLength(2);
    s = classReducer(s, { type: 'setTeams', count: 1 });
    expect(s.teams).toHaveLength(BALANCE.kelas.minTeams);
    s = classReducer(s, { type: 'setTeams', count: 9 });
    expect(s.teams).toHaveLength(BALANCE.kelas.maxTeams);
    s = classReducer(s, { type: 'renameTeam', id: s.teams[0].id, name: 'Harimau' });
    s = classReducer(s, { type: 'setTeams', count: 3 });
    expect(s.teams[0].name).toBe('Harimau');
    expect(new Set(s.teams.map((t) => t.color)).size).toBe(3);
  });

  it('correct answers score 100 on reveal', () => {
    let s = started();
    s = classReducer(s, { type: 'answer', teamId: 't1', answer: 'scam' });
    s = classReducer(s, { type: 'answer', teamId: 't2', answer: 'sahih' });
    s = classReducer(s, { type: 'reveal' });
    expect(s.phase).toBe('reveal');
    expect(s.teams[0].score).toBe(100);
    expect(s.teams[1].score).toBe(0);
    expect(s.lastGain).toEqual({ t1: 100, t2: 0 });
  });

  it('unanswered team scores 0', () => {
    let s = started();
    s = classReducer(s, { type: 'answer', teamId: 't1', answer: 'scam' });
    s = classReducer(s, { type: 'reveal' });
    expect(s.teams[1].score).toBe(0);
  });

  it('answers are locked after reveal', () => {
    let s = started();
    s = classReducer(s, { type: 'reveal' });
    const after = classReducer(s, { type: 'answer', teamId: 't1', answer: 'scam' });
    expect(after.teams[0].answer).toBeNull();
  });

  it('invalid answers for the card kind are ignored', () => {
    const s = started();
    expect(classReducer(s, { type: 'answer', teamId: 't1', answer: 'betul' }).teams[0].answer).toBeNull();
    expect(classReducer(s, { type: 'answer', teamId: 't1', answer: 'a' }).teams[0].answer).toBeNull();
    const tf = started([{ kind: 'money', card: MONEY[1] }]);
    expect(classReducer(tf, { type: 'answer', teamId: 't1', answer: 'scam' }).teams[0].answer).toBeNull();
    expect(classReducer(tf, { type: 'answer', teamId: 't1', answer: 'betul' }).teams[0].answer).toBe('betul');
    const pick = started([{ kind: 'money', card: MONEY[0] }]);
    expect(validAnswers(currentCard(pick)!)).toEqual(['a', 'b']);
    expect(classReducer(pick, { type: 'answer', teamId: 't1', answer: 'b' }).teams[0].answer).toBe('b');
    expect(classReducer(pick, { type: 'answer', teamId: 'nope', answer: 'b' })).toEqual(pick);
  });

  it('tapping the same answer again toggles it off; another answer replaces it', () => {
    let s = started();
    s = classReducer(s, { type: 'answer', teamId: 't1', answer: 'scam' });
    s = classReducer(s, { type: 'answer', teamId: 't1', answer: 'sahih' });
    expect(s.teams[0].answer).toBe('sahih');
    s = classReducer(s, { type: 'answer', teamId: 't1', answer: 'sahih' });
    expect(s.teams[0].answer).toBeNull();
  });

  it('scores money cards by their own answers', () => {
    let s = started([{ kind: 'money', card: MONEY[0] }]);
    const right = correctAnswer(currentCard(s)!);
    expect(['a', 'b']).toContain(right);
    s = classReducer(s, { type: 'answer', teamId: 't2', answer: right });
    s = classReducer(s, { type: 'reveal' });
    expect(s.lastGain).toEqual({ t1: 0, t2: 100 });
  });

  it('next goes reveal -> scores -> next question, and after round 10 to winner', () => {
    let s = started();
    for (let r = 0; r < BALANCE.kelas.rounds; r++) {
      expect(s.phase).toBe('question');
      expect(s.round).toBe(r);
      s = classReducer(s, { type: 'answer', teamId: 't1', answer: 'scam' });
      s = classReducer(s, { type: 'reveal' });
      s = classReducer(s, { type: 'next' });
      expect(s.phase).toBe('scores');
      s = classReducer(s, { type: 'next' });
      if (r < BALANCE.kelas.rounds - 1) expect(s.teams[0].answer).toBeNull();
    }
    expect(s.phase).toBe('winner');
    expect(s.teams[0].score).toBe(1000);
    expect(winners(s).map((t) => t.id)).toEqual(['t1']);
  });

  it('next does nothing in the question phase; reveal only in question', () => {
    const s = started();
    expect(classReducer(s, { type: 'next' })).toEqual(s);
    expect(classReducer(initialClassState(), { type: 'reveal' }).phase).toBe('lobby');
  });

  it('tied top scores are all winners', () => {
    let s = started(deckOf(10), 3);
    s = { ...s, phase: 'winner', teams: s.teams.map((t, i) => ({ ...t, score: [300, 300, 100][i] })) };
    expect(winners(s).map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('lobby action keeps teams, resets scores', () => {
    let s = started();
    s = classReducer(s, { type: 'answer', teamId: 't1', answer: 'scam' });
    s = classReducer(s, { type: 'reveal' });
    s = classReducer(s, { type: 'lobby' });
    expect(s.phase).toBe('lobby');
    expect(s.teams.every((t) => t.score === 0 && t.answer === null)).toBe(true);
  });
});

describe('deckFor', () => {
  const ids = (d: ClassCard[]) => d.map((c) => c.card.id);
  it('Scam: 10 swipe cards, at least 3 scam and 3 legit', () => {
    const d = deckFor('scam', 7, SWIPES, MONEY);
    expect(d).toHaveLength(10);
    expect(d.every((c) => c.kind === 'swipe')).toBe(true);
    const scams = d.filter((c) => c.kind === 'swipe' && c.card.answer === 'scam').length;
    expect(scams).toBeGreaterThanOrEqual(3);
    expect(10 - scams).toBeGreaterThanOrEqual(3);
    expect(new Set(ids(d)).size).toBe(10);
  });
  it('Duit: 10 money cards with both kinds and no duplicates', () => {
    const d = deckFor('duit', 3, SWIPES, MONEY);
    expect(d).toHaveLength(10);
    expect(d.every((c) => c.kind === 'money')).toBe(true);
    const kinds = d.map((c) => c.kind === 'money' && c.card.kind);
    expect(kinds).toContain('truefalse');
    expect(kinds).toContain('pick');
    expect(new Set(ids(d)).size).toBe(10);
  });
  it('Campur: 5 swipe + 5 money, interleaved', () => {
    const d = deckFor('campur', 11, SWIPES, MONEY);
    expect(d.map((c) => c.kind)).toEqual(['swipe', 'money', 'swipe', 'money', 'swipe', 'money', 'swipe', 'money', 'swipe', 'money']);
    expect(new Set(ids(d)).size).toBe(10);
  });
  it('is deterministic by seed and varies across seeds', () => {
    for (const set of ['scam', 'duit', 'campur'] as const) {
      expect(ids(deckFor(set, 5, SWIPES, MONEY))).toEqual(ids(deckFor(set, 5, SWIPES, MONEY)));
      expect(ids(deckFor(set, 5, SWIPES, MONEY))).not.toEqual(ids(deckFor(set, 6, SWIPES, MONEY)));
    }
  });
});
