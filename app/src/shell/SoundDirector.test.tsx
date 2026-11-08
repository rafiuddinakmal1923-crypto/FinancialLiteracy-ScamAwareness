// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Sound } from '../engine/sound';
import { useGame } from '../state/game';
import { useSettings } from '../state/settings';
import { SoundDirector } from './SoundDirector';

function fakeSound() {
  return { unlock: vi.fn(), play: vi.fn(), setMusic: vi.fn(), setEnabled: vi.fn(), setHidden: vi.fn() } satisfies Sound;
}

beforeEach(() => {
  useSettings.getState().hydrate({ lang: 'ms', sound: true, reducedMotion: true, demo: true });
  useGame.getState().reset();
  useGame.getState().set({ onboarded: true, week: 2 });
});
afterEach(cleanup);

describe('SoundDirector', () => {
  it('picks the music for the screen', () => {
    const s = fakeSound();
    const { rerender } = render(<SoundDirector route="home" sound={s} />);
    expect(s.setMusic).toHaveBeenLastCalledWith('calm');
    rerender(<SoundDirector route="chat" sound={s} />);
    expect(s.setMusic).toHaveBeenLastCalledWith('tense');
  });
  it('follows the Sound switch', () => {
    const s = fakeSound();
    render(<SoundDirector route="home" sound={s} />);
    expect(s.setEnabled).toHaveBeenLastCalledWith(true);
    act(() => useSettings.getState().toggle('sound'));
    expect(s.setEnabled).toHaveBeenLastCalledWith(false);
  });
  it('a tap on a button unlocks audio and clicks; a tap elsewhere only unlocks', () => {
    const s = fakeSound();
    const { container } = render(<><SoundDirector route="home" sound={s} /><button>Go</button><p>text</p></>);
    container.querySelector('p')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(s.unlock).toHaveBeenCalledTimes(1);
    expect(s.play).not.toHaveBeenCalled();
    container.querySelector('button')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(s.play).toHaveBeenCalledWith('tap');
  });
  it('plays coin and week sounds when the game changes', () => {
    const s = fakeSound();
    render(<SoundDirector route="home" sound={s} />);
    const m = useGame.getState().meters;
    act(() => useGame.getState().set({ meters: { ...m, duit: m.duit + 50 } }));
    expect(s.play).toHaveBeenLastCalledWith('coinIn');
    act(() => useGame.getState().set({ week: 3 }));
    expect(s.play).toHaveBeenLastCalledWith('week');
  });
  it('pings for a new message screen and rings for a call', () => {
    const s = fakeSound();
    const { rerender } = render(<SoundDirector route="mesej" sound={s} />);
    expect(s.play).toHaveBeenLastCalledWith('ping');
    rerender(<SoundDirector route="panggilan" sound={s} />);
    expect(s.play).toHaveBeenLastCalledWith('ring');
  });
  it('pauses when the app is hidden', () => {
    const s = fakeSound();
    render(<SoundDirector route="home" sound={s} />);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(s.setHidden).toHaveBeenLastCalledWith(true);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });
});
