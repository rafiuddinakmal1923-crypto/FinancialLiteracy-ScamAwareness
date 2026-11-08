// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../state/settings';
import { Settings } from './Settings';

beforeEach(() => useSettings.getState().hydrate({ lang: 'ms', sound: true, reducedMotion: true, demo: true }));
afterEach(cleanup);

// F3 (docs/FUTURE-PLAN.md): no sounds exist yet, so the switch must not promise them.
describe('Sound switch', () => {
  it('says the sounds are coming soon', () => {
    render(<Settings />);
    const sw = screen.getByRole('switch', { name: 'Bunyi' });
    expect(sw.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(sw.getAttribute('aria-describedby')!)?.textContent).toMatch(/^Akan datang/);
  });
});
