// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { WeekIntro } from './WeekIntro';

beforeEach(() => {
  useGame.getState().reset();
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
  useGame.getState().set({ week: 1 });
  useGame.getState().setBudget({ needs: 50, wants: 30, savings: 20 });
  window.location.hash = '#/semester/minggu';
});

afterEach(cleanup);

describe('WeekIntro (S04)', () => {
  it('opens the next week exactly once under StrictMode', async () => {
    await act(async () => { render(<StrictMode><WeekIntro /></StrictMode>); });
    expect(useGame.getState().week).toBe(2);
    expect(useGame.getState().weekIntroOpen).toBe(true);
    expect(useGame.getState().meters.duit).toBe(1900);
    expect(screen.getByRole('heading', { name: 'Minggu 2' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows the open intro again without starting another week', async () => {
    await act(async () => { render(<WeekIntro />); });
    cleanup();
    await act(async () => { render(<WeekIntro />); });
    expect(useGame.getState().week).toBe(2);
    expect(screen.getByRole('heading', { name: 'Minggu 2' })).toBeTruthy();
  });

  it('warns when Tekanan is at the desperation cue', async () => {
    useGame.getState().set({ meters: { ...useGame.getState().meters, tekanan: BALANCE.desperation.cueAt } });
    await act(async () => { render(<WeekIntro />); });
    expect(screen.getByRole('note').textContent).toMatch(/Tekanan tinggi/);
  });

  it('no warning below the cue', async () => {
    await act(async () => { render(<WeekIntro />); });
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('without a budget it sends the player to Dompet and starts nothing', async () => {
    useGame.getState().set({ budget: null });
    await act(async () => { render(<WeekIntro />); });
    expect(window.location.hash).toBe('#/dompet');
    expect(useGame.getState().week).toBe(1);
  });

  it('after week 12 shows "Semester tamat"', async () => {
    useGame.getState().set({ week: BALANCE.semesterWeeks });
    await act(async () => { render(<WeekIntro />); });
    expect(screen.getByRole('heading', { name: 'Semester tamat' })).toBeTruthy();
    expect(useGame.getState().week).toBe(BALANCE.semesterWeeks);
  });
});
