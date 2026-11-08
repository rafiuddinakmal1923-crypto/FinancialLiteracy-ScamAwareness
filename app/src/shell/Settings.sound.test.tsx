// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../state/settings';
import { Settings } from './Settings';

beforeEach(() => useSettings.getState().hydrate({ lang: 'ms', sound: true, reducedMotion: true, demo: true }));
afterEach(cleanup);

// The Sound switch turns the code-made music and sounds (engine/sound.ts) on and off.
describe('Sound switch', () => {
  it('says what it turns on', () => {
    render(<Settings />);
    const sw = screen.getByRole('switch', { name: 'Bunyi' });
    expect(sw.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(sw.getAttribute('aria-describedby')!)?.textContent).toBe('Muzik dan bunyi permainan');
  });
});
