// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { localDate } from '../engine/dates';
import { useGame } from '../state/game';
import { useSettings } from '../state/settings';
import { HomeScreen } from './HomeScreen';

beforeEach(() => {
  useGame.getState().reset();
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
});
afterEach(cleanup);

describe('Cek Harian tile', () => {
  it('shows belum, then selesai and the streak after playHarian for today (local date)', () => {
    const { container } = render(<HomeScreen />);
    expect(container.textContent).toContain('hari ini: belum');
    act(() => useGame.getState().playHarian(4, localDate()));
    expect(container.textContent).toContain('hari ini: selesai');
    expect(screen.getByText('1 hari berturut')).toBeTruthy();
  });
  it('ignores the 60-second round fields', () => {
    useGame.setState({ swipe: { best: 5, streak: 9, lastPlayed: localDate() } });
    const { container } = render(<HomeScreen />);
    expect(container.textContent).toContain('hari ini: belum');
  });
});
