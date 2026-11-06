// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { content, MONEY, SWIPE } from './testContent';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { CekHarian } from './CekHarian';

vi.mock('virtual:celik-content', async () => {
  const f = await import('./testContent');
  return {
    get cards() { return f.content.cards; },
    get moneyCards() { return f.content.moneyCards; },
    tactics: f.TACTICS,
    concepts: f.CONCEPTS,
  };
});

const TODAY = '2026-11-07';

/** The card on screen, found by its text. */
function current(): { kind: 'swipe'; card: (typeof SWIPE)[number] } | { kind: 'money'; card: (typeof MONEY)[number] } {
  for (const c of SWIPE) if (screen.queryByText(c.text.ms)) return { kind: 'swipe', card: c };
  for (const c of MONEY) if (screen.queryByText(c.text.ms)) return { kind: 'money', card: c };
  throw new Error('no card on screen');
}

function answerCurrent(right: boolean) {
  const cur = current();
  if (cur.kind === 'swipe') {
    const pick = (cur.card.answer === 'scam') === right ? 'Scam' : 'Sahih';
    fireEvent.click(screen.getByRole('button', { name: pick }));
  } else if (cur.card.kind === 'truefalse') {
    fireEvent.click(screen.getByRole('button', { name: (cur.card.answer === right) ? 'BETUL' : 'SALAH' }));
  } else {
    const idx = right ? cur.card.better : (1 - cur.card.better);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${idx === 0 ? 'A' : 'B'}\\b`) }));
  }
  return cur;
}

/** Plays all five cards (answering `right` each time) up to, not including, the finish button. */
function playToLast(right = true) {
  const seen: string[] = [];
  for (let i = 0; i < 5; i++) {
    const cur = answerCurrent(right);
    seen.push(cur.kind === 'swipe' ? 'swipe' : cur.card.kind);
    expect(screen.getByText(cur.card.why.ms)).toBeTruthy();
    if (i < 4) fireEvent.click(screen.getByRole('button', { name: 'Seterusnya' }));
  }
  return seen;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 7, 10, 0, 0));
  content.cards = SWIPE;
  content.moneyCards = MONEY;
  useGame.getState().reset();
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Cek Harian', () => {
  it('plays 5 cards with a reason after each answer and no timer, then shows x / 5', () => {
    render(<CekHarian params={{}} />);
    expect(screen.getByText(/5 kad/)).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('timer')).toBeNull();
    const seen = playToLast(true);
    expect(seen.filter((k) => k === 'swipe')).toHaveLength(3);
    expect(seen).toContain('truefalse');
    expect(seen).toContain('pick');
    fireEvent.click(screen.getByRole('button', { name: 'Lihat keputusan' }));
    expect(screen.getByText('5 / 5')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Main 60 saat' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Selesai' })).toBeTruthy();
  });

  it('marks an answer with an icon and a word, never colour alone', () => {
    render(<CekHarian params={{}} />);
    answerCurrent(false);
    expect(screen.getByText('Belum tepat')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Seterusnya' }));
    answerCurrent(true);
    expect(screen.getByText('Tepat')).toBeTruthy();
  });

  it('applies answerCard once per answer even on a double click', () => {
    const spy = vi.spyOn(useGame.getState(), 'answerCard');
    render(<CekHarian params={{}} />);
    const cur = current();
    const name = cur.kind === 'swipe' ? 'Scam' : cur.card.kind === 'truefalse' ? 'BETUL' : /^A\b/;
    const btn = screen.getByRole('button', { name });
    fireEvent.click(btn); fireEvent.click(btn);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('moves XP on a right answer', () => {
    const before = useGame.getState().meters.xp;
    render(<CekHarian params={{}} />);
    answerCurrent(true);
    expect(useGame.getState().meters.xp).toBeGreaterThan(before);
  });

  it('calls playHarian once at the end, even on a double click of the finish button', () => {
    const spy = vi.spyOn(useGame.getState(), 'playHarian');
    render(<CekHarian params={{}} />);
    playToLast(true);
    const finish = screen.getByRole('button', { name: 'Lihat keputusan' });
    fireEvent.click(finish); fireEvent.click(finish);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(5, TODAY);
    expect(useGame.getState().harian.streak).toBe(1);
    expect(useGame.getState().harianProgress).toBeNull();
  });

  it('lists the concept or tactic each miss belongs to', () => {
    render(<CekHarian params={{}} />);
    playToLast(false);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat keputusan' }));
    expect(screen.getByText('0 / 5')).toBeTruthy();
    expect(screen.getByText('Bajet')).toBeTruthy();
    expect(screen.getByText('Kuasa Kompaun')).toBeTruthy();
    expect(screen.getAllByText(/Terlalu Lumayan|Desakan Masa/).length).toBeGreaterThan(0);
  });

  it('Main 60 saat opens the 60-second round, Selesai goes home', () => {
    render(<CekHarian params={{}} />);
    playToLast(true);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat keputusan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Main 60 saat' }));
    expect(window.location.hash).toBe('#/swipe');
    fireEvent.click(screen.getByRole('button', { name: 'Selesai' }));
    expect(window.location.hash).toBe('#/home');
  });

  it('replaying on the same day shows Datang lagi esok and applies nothing', () => {
    useGame.getState().playHarian(4, TODAY);
    const spy = vi.spyOn(useGame.getState(), 'answerCard');
    render(<CekHarian params={{}} />);
    expect(screen.getByText('Datang lagi esok')).toBeTruthy();
    expect(screen.getByText('4 / 5')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Scam' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'BETUL' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Main 60 saat' })).toBeTruthy();
    expect(screen.getAllByTestId('streak-day')).toHaveLength(7);
    expect(spy).not.toHaveBeenCalled();
  });

  it('resumes after a remount in the middle of a round without re-applying answers', () => {
    const spy = vi.spyOn(useGame.getState(), 'answerCard');
    const first = render(<CekHarian params={{}} />);
    const c1 = answerCurrent(true);
    fireEvent.click(screen.getByRole('button', { name: 'Seterusnya' }));
    const c2 = answerCurrent(false);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(useGame.getState().harianProgress).toEqual({ date: TODAY, answers: [true, false] });
    first.unmount();
    render(<CekHarian params={{}} />);
    expect(screen.getByText('Kad 3 daripada 5')).toBeTruthy();
    expect(screen.queryByText(c1.card.text.ms)).toBeNull();
    expect(screen.queryByText(c2.card.text.ms)).toBeNull();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('ignores progress saved on another date', () => {
    useGame.getState().setHarianProgress({ date: '2026-11-06', answers: [true, true, true] });
    render(<CekHarian params={{}} />);
    expect(screen.getByText('Kad 1 daripada 5')).toBeTruthy();
  });

  it('shows Kad belum tersedia when content is missing', () => {
    content.cards = null;
    render(<CekHarian params={{}} />);
    expect(screen.getByText('Kad belum tersedia')).toBeTruthy();
    cleanup();
    content.cards = SWIPE.slice(0, 1);
    content.moneyCards = [];
    render(<CekHarian params={{}} />);
    expect(screen.getByText('Kad belum tersedia')).toBeTruthy();
  });

  it("shows whether this week's freeze is still available", () => {
    render(<CekHarian params={{}} />);
    expect(screen.getByLabelText('Beku mingguan: masih ada')).toBeTruthy();
    cleanup();
    useGame.getState().set({ harian: { ...useGame.getState().harian, freezeWeek: '2026-W45' } });
    render(<CekHarian params={{}} />);
    expect(screen.getByLabelText('Beku mingguan: sudah digunakan')).toBeTruthy();
  });
});
