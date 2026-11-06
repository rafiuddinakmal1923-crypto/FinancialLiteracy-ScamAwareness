// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { content, SWIPE } from './testContent';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { SwipeGame } from './SwipeGame';

vi.mock('virtual:celik-content', async () => {
  const f = await import('./testContent');
  return {
    get cards() { return f.content.cards; },
    get moneyCards() { return f.content.moneyCards; },
    tactics: f.TACTICS,
    concepts: f.CONCEPTS,
  };
});

const secs = () => Number(screen.getByTestId('seconds').textContent);
const adv = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
function onScreen() {
  const c = SWIPE.find((x) => screen.queryByText(x.text.ms));
  if (!c) throw new Error('no card');
  return c;
}
function answer(right: boolean) {
  const c = onScreen();
  fireEvent.click(screen.getByRole('button', { name: (c.answer === 'scam') === right ? 'Scam' : 'Sahih' }));
  return c;
}
const start = () => fireEvent.click(screen.getByRole('button', { name: 'Mula' }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 7, 10, 0, 0));
  content.cards = SWIPE;
  useGame.getState().reset();
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Sahih atau Scam', () => {
  it('starts at 60 s and counts down', () => {
    render(<SwipeGame params={{}} />);
    start();
    expect(secs()).toBe(BALANCE.swipe.seconds);
    adv(5000);
    expect(secs()).toBe(BALANCE.swipe.seconds - 5);
  });

  it('pauses the timer during the 1.5 s reason and resumes after it', () => {
    render(<SwipeGame params={{}} />);
    start();
    adv(5000);
    const c = answer(true);
    expect(screen.getByText(c.why.ms)).toBeTruthy();
    expect(secs()).toBe(55);
    adv(BALANCE.swipe.revealMs - 100);
    expect(secs()).toBe(55);
    expect(screen.getByText(c.why.ms)).toBeTruthy();
    adv(200);
    expect(screen.queryByText(c.why.ms)).toBeNull();
    expect(secs()).toBe(55);
    adv(1000);
    expect(secs()).toBe(54);
  });

  it('ends at 0 with unanswered cards counted as unanswered, not wrong', () => {
    render(<SwipeGame params={{}} />);
    start();
    answer(true);
    adv(BALANCE.swipe.revealMs);
    adv(BALANCE.swipe.seconds * 1000 + 200);
    expect(screen.getByText('Masa tamat')).toBeTruthy();
    expect(screen.getByText('1 / 10')).toBeTruthy();
    expect(screen.getByText('9 tidak sempat dijawab')).toBeTruthy();
    expect(screen.queryByTestId('missed')).toBeNull();
    expect(useGame.getState().swipe.best).toBe(1);
  });

  it('finishes after the tenth card, lists misses with reasons, saves the best score and Main lagi restarts', () => {
    render(<SwipeGame params={{}} />);
    start();
    const wrong: string[] = [];
    for (let i = 0; i < BALANCE.swipe.cards; i++) {
      const right = i % 3 !== 0;
      const c = answer(right);
      if (!right) wrong.push(c.why.ms);
      adv(BALANCE.swipe.revealMs);
    }
    expect(screen.getByText(`${BALANCE.swipe.cards - wrong.length} / ${BALANCE.swipe.cards}`)).toBeTruthy();
    for (const w of wrong) expect(screen.getByText(w)).toBeTruthy();
    expect(useGame.getState().swipe.best).toBe(BALANCE.swipe.cards - wrong.length);
    fireEvent.click(screen.getByRole('button', { name: 'Main lagi' }));
    expect(secs()).toBe(BALANCE.swipe.seconds);
  });

  it('keeps the best score across rounds', () => {
    useGame.getState().set({ swipe: { best: 9, streak: 1, lastPlayed: '2026-11-06' } });
    render(<SwipeGame params={{}} />);
    start();
    answer(false);
    adv(BALANCE.swipe.revealMs);
    adv(BALANCE.swipe.seconds * 1000 + 2000);
    expect(useGame.getState().swipe.best).toBe(9);
  });

  it('answers once on a double click', () => {
    const spy = vi.spyOn(useGame.getState(), 'answerRound');
    render(<SwipeGame params={{}} />);
    start();
    const c = onScreen();
    const btn = screen.getByRole('button', { name: c.answer === 'scam' ? 'Scam' : 'Sahih' });
    fireEvent.click(btn); fireEvent.click(btn);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('gives XP only in the first round of the local day, Imuniti every round', () => {
    render(<SwipeGame params={{}} />);
    start();
    answer(true); adv(BALANCE.swipe.revealMs);
    const xp1 = useGame.getState().meters.xp;
    expect(xp1).toBe(BALANCE.xp.swipeRight);
    adv(BALANCE.swipe.seconds * 1000 + 200);
    fireEvent.click(screen.getByRole('button', { name: 'Main lagi' }));
    const imunitiBefore = JSON.stringify(useGame.getState().meters.imuniti);
    for (let i = 0; i < BALANCE.swipe.cards && JSON.stringify(useGame.getState().meters.imuniti) === imunitiBefore; i++) {
      answer(false); adv(BALANCE.swipe.revealMs);
    }
    expect(useGame.getState().meters.xp).toBe(xp1);
    expect(JSON.stringify(useGame.getState().meters.imuniti)).not.toBe(imunitiBefore);
    expect(useGame.getState().swipeXpDate).toBe('2026-11-07');
  });

  it('XP is available again on the next local day', () => {
    useGame.getState().set({ swipeXpDate: '2026-11-06' });
    render(<SwipeGame params={{}} />);
    start();
    answer(true);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.swipeRight);
  });

  it('shows Kad belum tersedia when there are too few cards', () => {
    content.cards = SWIPE.slice(0, 3);
    render(<SwipeGame params={{}} />);
    expect(screen.getByText('Kad belum tersedia')).toBeTruthy();
  });
});
