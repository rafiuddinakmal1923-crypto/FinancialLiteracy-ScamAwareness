// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scenarios } from 'virtual:celik-content';
import { deriveCards } from '../../engine/cards';
import { applyPreset } from '../../shell/demo';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { KadBook } from './KadBook';
import { KadIlmu } from './KadIlmu';

beforeEach(() => {
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
  applyPreset('report');
  window.location.hash = '#/kad';
});
afterEach(cleanup);

describe('KadBook', () => {
  const total = deriveCards(Object.values(scenarios)).length;
  it('derives at least the 12 semester cards from the real content', () => {
    expect(total).toBeGreaterThanOrEqual(12);
  });
  it('header shows found / N kad and the two top tabs', () => {
    render(<KadBook />);
    expect(screen.getByText(`7 / ${total} kad`)).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Bendera Merah' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Kad Ilmu' })).toBeTruthy();
  });
  it('ignores card ids that are not in the derived set', () => {
    useGame.getState().set({ cards: ['greed-job', 'nonsense-card'] });
    render(<KadBook />);
    expect(screen.getByText(`1 / ${total} kad`)).toBeTruthy();
  });
  it('has 7 tactic sub-tabs with counts', () => {
    render(<KadBook />);
    const subs = within(screen.getByRole('tablist', { name: 'Helah' })).getAllByRole('tab');
    expect(subs).toHaveLength(7);
    expect(subs[0].textContent).toContain('/');
  });
  it('locked tiles show ??? and collected tiles open a detail sheet', () => {
    useGame.getState().set({ cards: ['greed-job'] });
    render(<KadBook />);
    expect(screen.getAllByRole('img', { name: 'Kad belum dikumpul' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('???').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Kad bendera merah/ }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText('Cara kesan')).toBeTruthy();
    expect(within(sheet).getByText('Apa nak buat')).toBeTruthy();
    expect(within(sheet).getByText(/RM300 sehari/)).toBeTruthy();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Tutup' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('Kad Ilmu tab shows earned and locked cards; tapping an earned card opens its detail', () => {
    render(<KadBook />);
    fireEvent.click(screen.getByRole('tab', { name: 'Kad Ilmu' }));
    expect(screen.getByText('4 / 6 kad')).toBeTruthy();
    expect(screen.getAllByRole('img', { name: 'Kad Ilmu belum dikumpul' })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Kad Ilmu: Bajet' }));
    expect(window.location.hash).toBe('#/kad/ilmu/bajet');
  });
  it('Kad Ilmu cards that have a Tonton explainer show a Tonton chip (F2)', () => {
    render(<KadBook />);
    fireEvent.click(screen.getByRole('tab', { name: 'Kad Ilmu' }));
    for (const name of ['Kuasa Kompaun', 'Kos Hutang']) {
      expect(within(screen.getByRole('button', { name: `Kad Ilmu: ${name}, ada Tonton` })).getByText('Tonton')).toBeTruthy();
    }
    expect(within(screen.getByRole('button', { name: 'Kad Ilmu: Bajet' })).queryByText('Tonton')).toBeNull();
  });
  it('no NaN or undefined text on either tab', () => {
    const { container } = render(<KadBook />);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
    fireEvent.click(screen.getByRole('tab', { name: 'Kad Ilmu' }));
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});

describe('KadIlmu detail', () => {
  it('shows the four sections, the figure year note and the footer', () => {
    const { container } = render(<KadIlmu params={{ code: 'kecemasan' }} />);
    for (const h of ['Apa itu', 'Contoh', 'Di dunia sebenar', 'Cara semak']) expect(screen.getByRole('heading', { name: h })).toBeTruthy();
    expect(screen.getAllByText(/contoh, 2026, perlu disahkan|contoh, perlu disahkan/).length).toBeGreaterThan(0);
    expect(screen.getByText('Kad ini menerangkan, bukan mengesyorkan.')).toBeTruthy();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
  it('a card with an explainer has a Tonton button that scrolls to it; one without has none (F2)', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const v = render(<KadIlmu params={{ code: 'kompaun' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tonton penerangan' }));
    expect(scroll).toHaveBeenCalledTimes(1);
    v.unmount();
    render(<KadIlmu params={{ code: 'bajet' }} />);
    expect(screen.queryByRole('button', { name: 'Tonton penerangan' })).toBeNull();
  });
  it('redirects an unearned code to /kad', () => {
    window.location.hash = '#/kad/ilmu/semak';
    render(<KadIlmu params={{ code: 'semak' }} />);
    expect(window.location.hash).toBe('#/kad');
  });
  it('redirects an unknown code to /kad', () => {
    window.location.hash = '#/kad/ilmu/xyz';
    render(<KadIlmu params={{ code: 'xyz' }} />);
    expect(window.location.hash).toBe('#/kad');
  });
});
