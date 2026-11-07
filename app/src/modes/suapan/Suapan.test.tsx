// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FeedPost } from '../../engine/types';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { Suapan } from './Suapan';

const POSTS: FeedPost[] = [
  {
    id: 't1', kind: 'advice', author: { name: 'Kak Nurul Simpan', handle: '@nurulsimpan', followers: '3.1K' },
    text: { ms: 'Simpan dulu, belanja kemudian.', en: 'Save first, spend later.' }, concept: 'kecemasan', semak: { kad: 'kecemasan' },
  },
  {
    id: 't2', kind: 'hype', author: { name: 'Abang Duit Pantas', handle: '@duitpantas', followers: '48.2K' },
    text: { ms: 'Saya buat 2% sehari.' }, concept: 'risiko', semak: { kad: 'risiko' },
    debrief: { ms: 'Pulangan mustahil.' },
  },
];
const CALC_POST: FeedPost = {
  id: 't3', kind: 'scam', author: { name: 'Naga Profit', handle: '@nagaprofit', followers: '9K' },
  text: { ms: 'Untung 30% seminggu!' }, tactics: ['greed'], semak: { calc: 'naga30w' }, debrief: { ms: 'Pulangan dijamin tinggi ialah tanda scam.' },
};
const content = vi.hoisted(() => ({ feed: null as FeedPost[] | null }));
vi.mock('virtual:celik-content', () => ({ get feed() { return content.feed; } }));

afterEach(() => { cleanup(); useSettings.setState({ lang: 'ms' }); useGame.getState().reset(); window.location.hash = ''; });

describe('Suapan feed (W1)', () => {
  it('lists every post in file order with its author, handle and followers', () => {
    content.feed = POSTS;
    render(<Suapan />);
    const items = within(screen.getByRole('list', { name: 'Hantaran dalam suapan' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Kak Nurul Simpan')).toBeTruthy();
    expect(within(items[0]).getByText('Simpan dulu, belanja kemudian.')).toBeTruthy();
    expect(within(items[1]).getByText(/@duitpantas/)).toBeTruthy();
    expect(within(items[1]).getByText(/48\.2K pengikut/)).toBeTruthy();
  });

  it('never shows the post kind or its debrief before the player judges it', () => {
    content.feed = POSTS;
    render(<Suapan />);
    expect(screen.queryByText(/hype|advice|scam/i)).toBeNull();
    expect(screen.queryByText('Pulangan mustahil.')).toBeNull();
  });

  it('uses English text in English, falling back to BM when a post has none', () => {
    content.feed = POSTS;
    useSettings.setState({ lang: 'en' });
    render(<Suapan />);
    expect(screen.getByText('Save first, spend later.')).toBeTruthy();
    expect(screen.getByText('Saya buat 2% sehari.')).toBeTruthy();
    expect(screen.getByText(/3\.1K followers/)).toBeTruthy();
  });

  it('shows an empty state when there are no posts', () => {
    content.feed = null;
    render(<Suapan />);
    expect(screen.getByText('Belum ada hantaran.')).toBeTruthy();
  });

  it('offers Percaya, Semak and Lapor on an unjudged post; a call is saved once and opens the debrief', () => {
    content.feed = POSTS;
    render(<Suapan />);
    const card = screen.getAllByRole('listitem')[1];
    fireEvent.click(within(card).getByRole('button', { name: 'Percaya' }));
    expect(useGame.getState().feed).toEqual({ t2: 'percaya' });
    const sheet = screen.getByRole('dialog', { name: 'Ulasan hantaran' });
    expect(within(sheet).getByText(/Pilihan kamu: Percaya/)).toBeTruthy();
    expect(within(sheet).getByText('Ini hype: sah, tetapi mengelirukan.')).toBeTruthy();
    expect(within(sheet).getByText('Pulangan mustahil.')).toBeTruthy();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Tutup' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    // Judged: the calls are gone, a summary reopens the debrief.
    expect(within(card).queryByRole('button', { name: 'Lapor' })).toBeNull();
    fireEvent.click(within(card).getByRole('button', { name: /Lihat semula/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('Semak on a Kalkulator post opens its preset and comes back to the feed', () => {
    content.feed = [CALC_POST];
    render(<Suapan />);
    fireEvent.click(screen.getByRole('button', { name: 'Semak' }));
    fireEvent.click(screen.getByRole('button', { name: 'Buka Kalkulator' }));
    expect(window.location.hash).toBe('#/kalkulator?preset=naga30w&back=/suapan');
  });

  it('Semak on a Kad Ilmu post earns that card and opens it', () => {
    content.feed = POSTS;
    render(<Suapan />);
    fireEvent.click(within(screen.getAllByRole('listitem')[1]).getByRole('button', { name: 'Semak' }));
    fireEvent.click(screen.getByRole('button', { name: 'Baca Kad Ilmu' }));
    expect(useGame.getState().kadIlmu).toContain('risiko');
    expect(window.location.hash).toBe('#/kad/ilmu/risiko');
  });
});
