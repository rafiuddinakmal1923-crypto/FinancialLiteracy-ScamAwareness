// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MoneyCard } from '../../engine/schemas';
import { SWIPE } from '../harian/testContent';
import { useSettings } from '../../state/settings';
import { ClassMode } from './ClassMode';

const MONEY_MANY: MoneyCard[] = Array.from({ length: 12 }, (_, i) => (i % 3 === 0
  ? { id: `m${i}`, kind: 'pick', concept: 'bajet', better: (i % 2) as 0 | 1, options: [{ ms: `Pilihan A${i}` }, { ms: `Pilihan B${i}` }], text: { ms: `Soalan pilih ${i}` }, why: { ms: `Sebab wang ${i}` } }
  : { id: `m${i}`, kind: 'truefalse', concept: 'bajet', answer: i % 2 === 0, text: { ms: `Kenyataan wang ${i}` }, why: { ms: `Sebab wang ${i}` } }) as MoneyCard);

vi.mock('virtual:celik-content', async () => {
  const f = await import('../harian/testContent');
  return { cards: f.SWIPE, get moneyCards() { return (globalThis as { __money?: unknown }).__money; }, tactics: f.TACTICS, concepts: f.CONCEPTS };
});

beforeEach(() => {
  (globalThis as { __money?: unknown }).__money = MONEY_MANY;
  window.location.hash = '#/kelas';
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: false });
});
afterEach(cleanup);

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const chooseSet = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
const teamGroup = (name: string) => screen.getByRole('group', { name });

/** The answer a team's buttons offer that is the right one for the card on screen. */
function rightLabel(): string {
  const swipe = SWIPE.find((c) => screen.queryByText(c.text.ms));
  if (swipe) return swipe.answer === 'scam' ? 'SCAM' : 'SAHIH';
  const m = MONEY_MANY.find((c) => screen.queryByText(c.text.ms));
  if (!m) throw new Error('no card on screen');
  if (m.kind === 'truefalse') return m.answer ? 'BETUL' : 'SALAH';
  return m.better === 0 ? 'A' : 'B';
}

describe('ClassMode', () => {
  it('lobby shows 2 teams by default and clamps 2-6', () => {
    render(<ClassMode params={{}} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect((screen.getByRole('button', { name: 'Kurangkan pasukan' }) as HTMLButtonElement).disabled).toBe(true);
    for (let i = 0; i < 8; i++) {
      const more = screen.getByRole('button', { name: 'Tambah pasukan' });
      if (!(more as HTMLButtonElement).disabled) fireEvent.click(more);
    }
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
    expect((screen.getByRole('button', { name: 'Tambah pasukan' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('team names are free text capped at 20 characters', () => {
    render(<ClassMode params={{}} />);
    const first = screen.getByRole('textbox', { name: 'Nama pasukan 1' });
    expect(first.getAttribute('maxlength')).toBe('20');
    fireEvent.change(first, { target: { value: 'Harimau Malaya' } });
    click('Mula');
    expect(teamGroup('Harimau Malaya')).toBeTruthy();
  });

  it('starting shows a card and round 1 / 10', () => {
    render(<ClassMode params={{}} />);
    chooseSet('Scam');
    click('Mula');
    expect(screen.getByText('Pusingan 1 / 10')).toBeTruthy();
    expect(SWIPE.some((c) => screen.queryByText(c.text.ms))).toBe(true);
    expect(within(teamGroup('Pasukan Merah')).getByRole('button', { name: /SCAM/ }).getAttribute('aria-pressed')).toBe('false');
  });

  it('answering for two teams then Dedahkan shows the answer, the reason and the scores', () => {
    render(<ClassMode params={{}} />);
    chooseSet('Scam');
    click('Mula');
    const right = rightLabel();
    const wrong = right === 'SCAM' ? 'SAHIH' : 'SCAM';
    fireEvent.click(within(teamGroup('Pasukan Merah')).getByRole('button', { name: new RegExp(right) }));
    fireEvent.click(within(teamGroup('Pasukan Biru')).getByRole('button', { name: new RegExp(wrong) }));
    expect(within(teamGroup('Pasukan Merah')).getByRole('button', { name: new RegExp(right) }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('2 daripada 2 pasukan sudah jawab')).toBeTruthy();
    click('Dedahkan');
    expect(screen.getByRole('status').textContent).toContain(`Dedahkan. Jawapan betul ialah ${right}.`);
    expect(screen.getByText(/^Sebab kad/)).toBeTruthy();
    expect(within(teamGroup('Pasukan Merah')).getByText('+100')).toBeTruthy();
    expect(within(teamGroup('Pasukan Biru')).queryByText('+100')).toBeNull();
    // Locked after the reveal.
    expect((within(teamGroup('Pasukan Biru')).getByRole('button', { name: new RegExp(right) }) as HTMLButtonElement).disabled).toBe(true);
    click('Papan skor');
    const rows = screen.getAllByTestId('score-row');
    expect(rows[0].textContent).toContain('Pasukan Merah');
    expect(rows[0].textContent).toContain('100');
    expect(rows[1].textContent).toContain('0');
  });

  it('a money card shows the buttons of its own kind', () => {
    render(<ClassMode params={{}} />);
    chooseSet('Duit');
    click('Mula');
    const m = MONEY_MANY.find((c) => screen.queryByText(c.text.ms))!;
    const g = teamGroup('Pasukan Merah');
    if (m.kind === 'truefalse') {
      expect(within(g).getByRole('button', { name: /BETUL/ })).toBeTruthy();
      expect(within(g).getByRole('button', { name: /SALAH/ })).toBeTruthy();
      expect(within(g).queryByRole('button', { name: /SCAM/ })).toBeNull();
    } else {
      expect(within(g).getByRole('button', { name: /: A$/ })).toBeTruthy();
      expect(within(g).getByRole('button', { name: /: B$/ })).toBeTruthy();
      expect(screen.getByText(m.options[0].ms)).toBeTruthy();
      expect(screen.getByText(m.options[1].ms)).toBeTruthy();
    }
  });

  it('plays 10 rounds to a winner screen listing every tied winner', () => {
    render(<ClassMode params={{}} />);
    click('Mula');
    for (let r = 0; r < 10; r++) {
      expect(screen.getByText(`Pusingan ${r + 1} / 10`)).toBeTruthy();
      click('Dedahkan');
      click('Papan skor');
      click(r === 9 ? 'Lihat pemenang' : 'Pusingan seterusnya');
    }
    expect(screen.getByText('Seri! Pemenang: Pasukan Merah, Pasukan Biru')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Main lagi' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Selesai' })).toBeTruthy();
    click('Main lagi');
    expect(screen.getByRole('button', { name: 'Mula' })).toBeTruthy();
  });

  it('Keluar asks for confirmation before leaving', () => {
    render(<ClassMode params={{}} />);
    click('Mula');
    click('Keluar');
    const dialog = screen.getByRole('alertdialog', { name: 'Keluar dari Mod Kelas?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Teruskan main' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(window.location.hash).toBe('#/kelas');
    click('Keluar');
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Ya, tinggalkan' }));
    expect(window.location.hash).toBe('#/home');
  });

  it('says so when the cards are not available', () => {
    (globalThis as { __money?: unknown }).__money = null;
    render(<ClassMode params={{}} />);
    chooseSet('Duit');
    expect((screen.getByRole('button', { name: 'Mula' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
