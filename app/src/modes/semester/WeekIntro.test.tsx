// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { WeekIntro } from './WeekIntro';

beforeEach(() => {
  useGame.getState().reset();
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
  useGame.getState().set({ onboarded: true });
  // Onboarded, budget split done, no week opened yet (week 0).
  useGame.getState().setBudget({ needs: 50, wants: 30, savings: 20 });
  window.location.hash = '#/semester/minggu';
});

afterEach(cleanup);

describe('WeekIntro (S04)', () => {
  it('the first intro is Minggu 1: it charges Makan 80 + Pengangkutan 20 + Bil telefon 30, once under StrictMode', async () => {
    await act(async () => { render(<StrictMode><WeekIntro /></StrictMode>); });
    expect(useGame.getState().week).toBe(1);
    expect(useGame.getState().weekIntroOpen).toBe(true);
    expect(useGame.getState().meters.duit).toBe(2000 - 80 - 20 - 30);
    expect(screen.getByRole('heading', { name: 'Minggu 1' })).toBeTruthy();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Makan-RM80', 'Pengangkutan-RM20', 'Bil telefon-RM30']);
    expect(screen.getByText(/Minggu pertama di kolej/)).toBeTruthy();
  });

  it('shows the open intro again without starting another week', async () => {
    await act(async () => { render(<WeekIntro />); });
    cleanup();
    await act(async () => { render(<WeekIntro />); });
    expect(useGame.getState().week).toBe(1);
    expect(screen.getByRole('heading', { name: 'Minggu 1' })).toBeTruthy();
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
    expect(useGame.getState().week).toBe(0);
  });

  it('after week 12 shows "Semester tamat"', async () => {
    useGame.getState().set({ week: BALANCE.semesterWeeks });
    await act(async () => { render(<WeekIntro />); });
    expect(screen.getByRole('heading', { name: 'Semester tamat' })).toBeTruthy();
    expect(useGame.getState().week).toBe(BALANCE.semesterWeeks);
  });
});

describe('WeekIntro loop (Task 25)', () => {
  const done = (...ids: string[]) => ids.map((id) => ({ id, outcome: 'safe' as const, right: true, flagsFound: 0, flagsTotal: 0, tactics: [], family: 'job' as const, concepts: [] }));

  it('Teruskan closes the intro and opens the chat behind the "Mesej baru" banner', async () => {
    await act(async () => { render(<WeekIntro />); });
    fireEvent.click(screen.getByRole('button', { name: 'Teruskan' }));
    expect(useGame.getState().weekIntroOpen).toBe(false);
    expect(window.location.hash).toBe('#/semester/mesej/kerja_sambilan');
  });

  it('week 11 goes to the ringing call, week 7 to the reflection, week 12 to the report', async () => {
    const cases: [number, string][] = [[11, '#/panggilan/panggilan_mahkamah'], [7, '#/semester/cuti'], [12, '#/semester/rapor']];
    for (const [week, hash] of cases) {
      cleanup();
      useGame.getState().set({ week, weekIntroOpen: true });
      await act(async () => { render(<WeekIntro />); });
      fireEvent.click(screen.getByRole('button', { name: 'Teruskan' }));
      expect(window.location.hash).toBe(hash);
    }
  });

  it('a new week cannot start while the last scenario is unfinished', async () => {
    useGame.getState().set({ week: 3, results: done('kerja_sambilan', 'dompet_minggu0') });
    await act(async () => { render(<WeekIntro />); });
    expect(useGame.getState().week).toBe(3);
    expect(window.location.hash).toBe('#/sembang/sewa_akaun');
  });

  it('a pending aftermath blocks the next week', async () => {
    useGame.getState().set({ week: 1 });
    useGame.getState().startScenario('kerja_sambilan');
    useGame.getState().endScenario({ id: 'kerja_sambilan', outcome: 'safe', transcript: [] });
    await act(async () => { render(<WeekIntro />); });
    expect(useGame.getState().week).toBe(1);
    expect(window.location.hash).toBe('#/semester/akibat/kerja_sambilan');
  });
});
