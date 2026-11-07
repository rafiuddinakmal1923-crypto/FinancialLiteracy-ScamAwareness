// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FeedPost } from '../../engine/types';
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
const content = vi.hoisted(() => ({ feed: null as FeedPost[] | null }));
vi.mock('virtual:celik-content', () => ({ get feed() { return content.feed; } }));

afterEach(() => { cleanup(); useSettings.setState({ lang: 'ms' }); });

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
});
