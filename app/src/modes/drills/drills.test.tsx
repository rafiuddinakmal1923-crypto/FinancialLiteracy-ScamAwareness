// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { Checklist } from './Checklist';
import { Drill997 } from './Drill997';
import { Latihan } from './Latihan';
import { SemakSim } from './SemakSim';

beforeEach(() => {
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
  useGame.getState().reset();
  window.location.hash = '#/latihan';
});
afterEach(cleanup);

const key = (d: string) => fireEvent.click(screen.getByRole('button', { name: d }));

/** Taps every open step / checklist checkbox until the drill ends (steps appear one by one). */
async function finishCall(): Promise<void> {
  await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0), { timeout: 3000 });
  for (let guard = 0; guard < 40 && !screen.queryByText('Latihan selesai'); guard++) {
    const open = screen.getAllByRole('checkbox').filter((c) => c.getAttribute('aria-checked') === 'false');
    if (open.length === 0) break;
    fireEvent.click(open[0]);
  }
}

describe('Latihan menu', () => {
  it('has three tiles', () => {
    render(<Latihan />);
    for (const n of [/Hubungi 997/, /Semak akaun/, /Senarai tindakan/]) expect(screen.getByRole('button', { name: n })).toBeTruthy();
  });
});

describe('Drill997', () => {
  it('shows the SimulasiBanner and has no tel: link anywhere', () => {
    const { container } = render(<Drill997 />);
    expect(screen.getByRole('note').textContent).toContain('SIMULASI');
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(screen.getByText('Kalau ini kecemasan sebenar, telefon 997 sekarang.').closest('a')).toBeNull();
  });

  it('starts only after 9, 9, 7 in order', async () => {
    render(<Drill997 />);
    key('9'); key('7'); key('9');
    expect(screen.queryByText(/Sambungan simulasi/)).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Padam' }));
    key('9'); key('9');
    expect(screen.queryByText(/Sambungan simulasi/)).toBeNull();
    key('7');
    expect(screen.getByText(/Sambungan simulasi/)).toBeTruthy();
    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0), { timeout: 3000 });
  });

  it('completing every step and checklist item finishes once (+40 XP)', async () => {
    const { container } = render(<Drill997 />);
    key('9'); key('9'); key('7');
    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0), { timeout: 3000 });
    expect(screen.queryByText('Latihan selesai')).toBeNull();
    await finishCall();
    expect(screen.getByText('Latihan selesai')).toBeTruthy();
    expect(useGame.getState().drills).toEqual(['997']);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.drill);
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    // a second pass pays nothing more
    cleanup();
    render(<Drill997 />);
    key('9'); key('9'); key('7');
    await finishCall();
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.drill);
  });
});

describe('SemakSim', () => {
  const search = (value: string) => {
    fireEvent.change(screen.getByRole('textbox', { name: /nombor akaun/i }), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Semak' }));
  };

  it('shows the banner and the example-only helper text', () => {
    render(<SemakSim />);
    expect(screen.getByRole('note').textContent).toContain('SIMULASI');
    expect(screen.getByText(/jangan taip nombor akaun sebenar/)).toBeTruthy();
  });

  it('finds the mule account: Dilaporkan dalam 3 kes, completes the drill once', () => {
    render(<SemakSim />);
    search('0000-0000-0638');
    expect(screen.getByText('Dilaporkan dalam 3 kes')).toBeTruthy();
    expect(useGame.getState().drills).toEqual(['semak']);
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.drill);
    search('0000-0000-0638');
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.drill);
  });

  it('a suggestion chip fills the field', () => {
    render(<SemakSim />);
    fireEvent.click(screen.getByRole('button', { name: /Cuba: 0000-0000-0638/ }));
    expect((screen.getByRole('textbox', { name: /nombor akaun/i }) as HTMLInputElement).value).toBe('0000-0000-0638');
  });

  it('unknown or clean numbers are neutral and give no XP', () => {
    render(<SemakSim />);
    search('0000-0000-0999');
    expect(screen.getByText('Tiada laporan setakat ini')).toBeTruthy();
    expect(screen.getByText(/tidak bermakna akaun itu selamat/)).toBeTruthy();
    expect(screen.queryByText(/Dilaporkan dalam/)).toBeNull();
    search('0000-0000-0111');
    expect(screen.getByText('Tiada laporan setakat ini')).toBeTruthy();
    expect(useGame.getState().meters.xp).toBe(0);
  });

  it('filters out anything but digits and dashes', () => {
    render(<SemakSim />);
    const input = screen.getByRole('textbox', { name: /nombor akaun/i }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ab12 34-x5' } });
    expect(input.value).toBe('1234-5');
  });

  it('the real portal button is exact, opens in a new tab, safely', () => {
    render(<SemakSim />);
    const a = screen.getByRole('link', { name: 'Buka Semak Mule sebenar' }) as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('https://semakmule.rmp.gov.my');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(a.getAttribute('rel')).toContain('noreferrer');
    expect(screen.getByText(/keluar dari permainan/i)).toBeTruthy();
    expect(document.querySelectorAll('a[href^="http"]')).toHaveLength(1);
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  });
});

describe('Checklist', () => {
  it('lists six actions with checkboxes and the honesty note', () => {
    render(<Checklist />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
    expect(screen.getByText('Ini untuk kamu sendiri — tiada siapa semak.')).toBeTruthy();
    expect(screen.getByText(/SC licence register/)).toBeTruthy();
    expect(document.querySelector('a')).toBeNull();
  });

  it('ticking gives +25 XP once; untick and re-tick pay nothing', () => {
    render(<Checklist />);
    const first = () => screen.getAllByRole('checkbox')[0];
    fireEvent.click(first());
    expect(first().getAttribute('aria-checked')).toBe('true');
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.action);
    fireEvent.click(first());
    expect(first().getAttribute('aria-checked')).toBe('false');
    fireEvent.click(first());
    expect(useGame.getState().meters.xp).toBe(BALANCE.xp.action);
    expect(useGame.getState().actions).toEqual(['save-997']);
  });

  it('a tick shows a confetti burst unless motion is reduced', () => {
    useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: false, demo: true });
    render(<Checklist />);
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    expect(screen.getByTestId('burst')).toBeTruthy();
    cleanup();
    useGame.getState().reset();
    useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
    render(<Checklist />);
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    expect(screen.queryByTestId('burst')).toBeNull();
  });
});
