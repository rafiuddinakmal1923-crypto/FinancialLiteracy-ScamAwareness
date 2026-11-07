// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { Cuti } from './Cuti';
import { NewMessage } from './NewMessage';

beforeEach(() => {
  useGame.getState().reset();
  useGame.getState().set({ week: 7, onboarded: true });
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
});
afterEach(cleanup);

describe('week 7 reflection card', () => {
  it('shows the break and the Mesin Masa prompt, and gives no XP', async () => {
    const xp = useGame.getState().meters.xp;
    await act(async () => { render(<Cuti />); });
    expect(screen.getByRole('heading', { name: 'Cuti pertengahan semester' })).toBeTruthy();
    expect(screen.getByText(/Kalau simpan RM50 sebulan/)).toBeTruthy();
    expect(useGame.getState().meters.xp).toBe(xp);
  });
  it('Kira dengan Mesin Masa opens the prefilled calculator tab', async () => {
    await act(async () => { render(<Cuti />); });
    fireEvent.click(screen.getByRole('button', { name: 'Kira dengan Mesin Masa' }));
    expect(window.location.hash).toBe('#/kalkulator/masa?preset=labur50');
  });
  it('Teruskan goes home', async () => {
    await act(async () => { render(<Cuti />); });
    fireEvent.click(screen.getByRole('button', { name: 'Teruskan' }));
    expect(window.location.hash).toBe('#/home');
  });
});

describe('Mesej baru banner', () => {
  it('names the contact and opens the chat on tap', async () => {
    window.location.hash = '#/semester/mesej/kerja_sambilan';
    await act(async () => { render(<NewMessage params={{ id: 'kerja_sambilan' }} />); });
    fireEvent.click(screen.getByRole('button', { name: /Mesej baru dari Kak Mira/ }));
    expect(window.location.hash).toBe('#/sembang/kerja_sambilan');
  });
  it('opens the chat by itself after the banner time', async () => {
    window.location.hash = '#/semester/mesej/kerja_sambilan';
    await act(async () => { render(<NewMessage params={{ id: 'kerja_sambilan' }} />); });
    expect(window.location.hash).toBe('#/semester/mesej/kerja_sambilan');
    await act(async () => { await new Promise((r) => setTimeout(r, BALANCE.loop.bannerMs + 150)); });
    expect(window.location.hash).toBe('#/sembang/kerja_sambilan');
  });
});
