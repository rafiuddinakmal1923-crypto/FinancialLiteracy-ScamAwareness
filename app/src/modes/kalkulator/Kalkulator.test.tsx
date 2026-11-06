// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { ToastHost } from '../../ui/Toast';
import { Kalkulator } from './Kalkulator';

vi.mock('virtual:celik-content', () => ({
  scenarios: {},
  calcPresets: [
    { id: 'naga30w', tab: 'pulangan', label: { ms: 'Janji 30% seminggu (CryptoNaga)' }, inputs: { promised: 30, period: 'minggu' } },
    { id: 'bayar1000', tab: 'kos', label: { ms: 'BayarNanti: RM1,000, 12 bulan' }, inputs: { amount: 1000, flat: 18, months: 12 } },
    { id: 'labur50', tab: 'masa', label: { ms: 'RM50 sebulan' }, inputs: { monthly: 50, rate: 5, startAge: 19, endAge: 30 } },
  ],
}));

const STRIP = 'Contoh sahaja, bukan nasihat pelaburan';

function open(tab: 'masa' | 'pulangan' | 'kos' | undefined, query = '') {
  window.location.hash = `#/kalkulator${tab ? `/${tab}` : ''}${query}`;
  return render(<><Kalkulator params={tab ? { tab } : {}} /><ToastHost /></>);
}
const type = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const noBadText = () => {
  const text = document.body.textContent ?? '';
  expect(text).not.toMatch(/NaN|Infinity|undefined/);
};

beforeEach(() => {
  useGame.getState().reset();
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
});
afterEach(cleanup);

describe('shell', () => {
  it('has the three tabs and the yellow strip on every tab', () => {
    for (const tab of ['masa', 'pulangan', 'kos'] as const) {
      const { unmount } = open(tab);
      expect(screen.getByRole('tab', { name: 'Mesin Masa' })).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Semak Pulangan' })).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Kos Sebenar' })).toBeTruthy();
      expect(screen.getByText(STRIP)).toBeTruthy();
      unmount();
    }
  });

  it('the selected tab matches the route, and tapping a tab navigates', () => {
    open('pulangan');
    expect(screen.getByRole('tab', { name: 'Semak Pulangan' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Kos Sebenar' }));
    expect(window.location.hash).toBe('#/kalkulator/kos');
  });

  it('/kalkulator without a tab opens Mesin Masa', () => {
    open(undefined);
    expect(screen.getByRole('tab', { name: 'Mesin Masa' }).getAttribute('aria-selected')).toBe('true');
  });

  it('is not in scenario mode without a resume point: no return button', () => {
    open('masa');
    expect(screen.queryByRole('button', { name: 'Kembali ke perbualan' })).toBeNull();
  });
});

describe('Mesin Masa', () => {
  it('defaults RM50 / 5% / 19 to 30 give RM8,775.28 and the split line', () => {
    open('masa');
    expect(screen.getByText('RM8,775.28')).toBeTruthy();
    expect(screen.getByText('Anda simpan RM6,600, pertumbuhan RM2,175.28')).toBeTruthy();
    expect(screen.getByText('Mula awal, walaupun sedikit.')).toBeTruthy();
    const chart = screen.getByRole('img', { name: /Graf/ });
    expect(chart.querySelectorAll('[data-area]')).toHaveLength(2);
    expect((screen.getByLabelText('Simpan sebulan (RM)') as HTMLInputElement).value).toBe('50');
    expect((screen.getByLabelText('Mula umur') as HTMLInputElement).value).toBe('19');
    noBadText();
  });

  it('the 55 chip and the stepper change the result', () => {
    open('masa');
    fireEvent.click(screen.getByRole('button', { name: '55' }));
    expect(screen.getByText('RM60,324.80')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Simpan sebulan (RM)' }));
    expect((screen.getByLabelText('Simpan sebulan (RM)') as HTMLInputElement).value).toBe('60');
  });

  it('the stepper never goes below 0 and typing keeps numbers only', () => {
    open('masa');
    type('Simpan sebulan (RM)', '0');
    fireEvent.click(screen.getByRole('button', { name: 'Kurangkan Simpan sebulan (RM)' }));
    expect((screen.getByLabelText('Simpan sebulan (RM)') as HTMLInputElement).value).toBe('0');
    type('Simpan sebulan (RM)', '-5abc');
    // The minus and letters are dropped; the value can never be negative.
    expect((screen.getByLabelText('Simpan sebulan (RM)') as HTMLInputElement).value).toBe('5');
    type('Simpan sebulan (RM)', '0');
    expect(screen.getByText('RM0.00')).toBeTruthy();
    noBadText();
  });

  it('an empty input says Isi semua nombor and shows no number', () => {
    open('masa');
    type('Simpan sebulan (RM)', '');
    expect(screen.getByText('Isi semua nombor')).toBeTruthy();
    expect(screen.queryByText('RM8,775.28')).toBeNull();
    noBadText();
  });

  it('a huge rate or age range is handled, not NaN', () => {
    open('masa');
    type('Pulangan setahun (%, contoh)', '99999999');
    type('Hingga umur', '100');
    noBadText();
    expect(screen.getByText('Isi semua nombor')).toBeTruthy();
  });

  it('prefills from ?preset=labur50', () => {
    open('masa', '?preset=labur50');
    expect(screen.getByText('RM8,775.28')).toBeTruthy();
    expect(screen.getByText(/RM50 sebulan/)).toBeTruthy();
  });
});

describe('Semak Pulangan', () => {
  it('10% a month: = 213.8% setahun, red pin, Terlalu Lumayan, the where-to-check line', () => {
    open('pulangan');
    type('Janji pulangan (%)', '10');
    fireEvent.click(screen.getByRole('radio', { name: 'bulan' }));
    expect(screen.getByText('= 213.8% setahun')).toBeTruthy();
    expect(screen.getByText('Terlalu Lumayan')).toBeTruthy();
    expect(screen.getByText('Tiada pelaburan sah boleh jamin pulangan begini.')).toBeTruthy();
    expect(screen.getByRole('img', { name: /Kadar dijanjikan 213.8% setahun/ })).toBeTruthy();
    expect(screen.getByText('Semak dulu: SC Investor Alert List')).toBeTruthy();
    expect(document.querySelector('a[href]')).toBeNull();
    noBadText();
  });

  it('a realistic rate has no flag and says which band contains it', () => {
    open('pulangan');
    type('Janji pulangan (%)', '4');
    fireEvent.click(screen.getByRole('radio', { name: 'tahun' }));
    expect(screen.getByText('= 4% setahun')).toBeTruthy();
    expect(screen.queryByText('Terlalu Lumayan')).toBeNull();
    expect(screen.getByText(/jatuh dalam julat Dana harga tetap \(3%–6%\)/)).toBeTruthy();
  });

  it('empty, zero and absurd inputs never show NaN or Infinity', () => {
    open('pulangan');
    type('Janji pulangan (%)', '');
    expect(screen.getByText('Isi semua nombor')).toBeTruthy();
    type('Janji pulangan (%)', '0');
    noBadText();
    type('Janji pulangan (%)', '99999999999');
    fireEvent.click(screen.getByRole('radio', { name: 'hari' }));
    noBadText();
    expect(screen.getByText('Terlalu Lumayan')).toBeTruthy();
  });

  it('prefills from ?preset=naga30w (30% a week)', () => {
    open('pulangan', '?preset=naga30w');
    expect((screen.getByLabelText('Janji pulangan (%)') as HTMLInputElement).value).toBe('30');
    expect(screen.getByRole('radio', { name: 'minggu' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Terlalu Lumayan')).toBeTruthy();
  });
});

describe('Kos Sebenar', () => {
  it('RM1,000 / flat 18% / 12 months', () => {
    open('kos');
    const cards = screen.getByRole('region', { name: 'Hasil' });
    expect(within(cards).getByText('RM98.33')).toBeTruthy();
    expect(within(cards).getByText('RM1,180.00')).toBeTruthy();
    expect(within(cards).getByText('RM180.00')).toBeTruthy();
    expect(within(cards).getByText(/^31\.\d%$/)).toBeTruthy();
    expect(within(cards).getByText(/lebih tinggi daripada kadar rata/)).toBeTruthy();
    noBadText();
  });

  it('switching to a fee uses the fee', () => {
    open('kos');
    fireEvent.click(screen.getByRole('radio', { name: 'Yuran (RM)' }));
    type('Yuran (RM)', '120');
    expect(screen.getByText('RM1,120.00')).toBeTruthy();
  });

  it('empty months say Isi semua nombor; zero months and amount 0 are safe', () => {
    open('kos');
    type('Tempoh (bulan)', '');
    expect(screen.getByText('Isi semua nombor')).toBeTruthy();
    type('Tempoh (bulan)', '0');
    expect(screen.getByText('Isi semua nombor')).toBeTruthy();
    type('Tempoh (bulan)', '12');
    type('Jumlah (RM)', '0');
    noBadText();
    expect(screen.queryByText('Isi semua nombor')).toBeNull();
  });

  it('prefills from ?preset=bayar1000', () => {
    open('kos', '?preset=bayar1000');
    expect(screen.getByText('RM1,180.00')).toBeTruthy();
    expect(screen.getByText(/BayarNanti/)).toBeTruthy();
  });
});

describe('scenario mode (Kira dulu)', () => {
  beforeEach(() => {
    useGame.getState().startScenario('kira');
    useGame.getState().calcOpen({ id: 'kira', family: 'investment', trail: [] });
  });

  it('shows Kembali ke perbualan, awards +10 XP once and toasts it', async () => {
    const xp = useGame.getState().meters.xp;
    await act(async () => { open('pulangan', '?preset=naga30w'); });
    expect(screen.getByRole('button', { name: 'Kembali ke perbualan' })).toBeTruthy();
    // +10 for Kira dulu, +10 for the greed flag the unrealistic preset finds.
    expect(useGame.getState().meters.xp).toBe(xp + BALANCE.xp.calc + BALANCE.xp.flag);
    expect(useGame.getState().calcUsed).toEqual(['kira']);
    expect(screen.getByText('+10 XP: Kira dulu')).toBeTruthy();
    // Opening again (reload on the Kalkulator): no second award.
    const after = useGame.getState().meters.xp;
    cleanup();
    await act(async () => { open('pulangan', '?preset=naga30w'); });
    expect(useGame.getState().meters.xp).toBe(after);
  });

  it('an unrealistic Semak Pulangan result counts as a found greed flag, once', async () => {
    const start = useGame.getState().meters.imuniti.greed;
    await act(async () => { open('pulangan', '?preset=naga30w'); });
    const g = useGame.getState().meters.imuniti.greed;
    expect(g).toBe(start + BALANCE.imuniti.flag);
    type('Janji pulangan (%)', '40');
    expect(useGame.getState().meters.imuniti.greed).toBe(g);
  });

  it('a realistic result does not count as a flag', async () => {
    const start = useGame.getState().meters.imuniti.greed;
    await act(async () => { open('pulangan'); });
    type('Janji pulangan (%)', '3');
    fireEvent.click(screen.getByRole('radio', { name: 'tahun' }));
    expect(useGame.getState().meters.imuniti.greed).toBe(start);
  });

  it('Kembali ke perbualan marks the return and goes back to the chat', async () => {
    await act(async () => { open('masa', '?preset=labur50'); });
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke perbualan' }));
    expect(useGame.getState().calcResume?.returned).toBe(true);
    expect(window.location.hash).toBe('#/sembang/kira');
    navigate('/home');
  });
});
