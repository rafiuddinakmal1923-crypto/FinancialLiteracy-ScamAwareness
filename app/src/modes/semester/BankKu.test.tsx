// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { BankKu } from './BankKu';
import { ChatThread } from './ChatThread';
import { FakePage } from './FakePage';

// Three chat scenarios (a transfer that branches on ui_ok, a fake page link, a Kalkulator hook) and two pages.
vi.mock('virtual:celik-content', async () => {
  const { compileScenario } = await import('../../engine/compile');
  const make = (id: string, lines: string[]) => compileScenario([
    `# id:${id}`, '# type:scam', '# family:mule', '# tactics:greed', '# contact:Abang Zul', '', ...lines,
  ].join('\n') + '\n', `${id}.ink`);
  const branch = [
    '{ ui_ok:',
    '  Abang Zul: Terima kasih! # effect:duit:-500 # outcome:mule',
    '- else:',
    '  Abang Zul: Takpe la. # outcome:safe',
    '}',
    '-> END',
  ];
  const page = (asksTac: boolean, button: string) => ({
    title: { ms: asksTac ? 'Bayaran penghantaran' : 'Pulangan lumayan' },
    body: { ms: 'Badan laman.' },
    fields: [{ label: { ms: 'Nombor penjejakan' }, value: 'KK-0000-0042 (contoh)' }],
    button: { ms: button },
    asksTac,
  });
  return {
    scenarios: {
      pindah: make('pindah', ['VAR ui_ok = false', 'Abang Zul: Tolong pindah RM500, upah RM50. # flag:greed:upah RM50 # ui:transfer:500', ...branch]),
      pautan: make('pautan', ['VAR ui_ok = false', 'Abang Zul: Bayar sini, ada hadiah. # flag:greed:ada hadiah # ui:link:kurierkilat-bayar.test/alamat', ...branch]),
      kira: make('kira', ['Abang Zul: Kira dulu, untung. # flag:greed:untung # ui:calc:masa:mula', 'Abang Zul: Ok. # outcome:safe', '-> END']),
    },
    pages: {
      'kurierkilat-bayar.test': page(true, 'Bayar RM2.90'),
      'cryptonaga.test': page(false, 'Daftar sekarang'),
    },
  };
});

const BANNER = 'SIMULASI - bukan laman/aplikasi sebenar';
const WARNING = /Jangan kongsi TAC dengan sesiapa, termasuk 'pegawai bank'\./;

beforeEach(() => {
  useGame.getState().reset();
  useGame.getState().set({ week: 3, onboarded: true });
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
  window.location.hash = '#/bankku';
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderTransfer(onDone = vi.fn()) {
  render(<BankKu mode="transfer" transfer={{ amount: 500, to: 'Abang Zul', onDone }} />);
  return onDone;
}

describe('BankKu transfer and TAC (S08)', () => {
  it('transfer shows SimulasiBanner and prefilled amount', () => {
    renderTransfer();
    expect(screen.getByText(BANNER)).toBeTruthy();
    expect(screen.getByText('RM500.00')).toBeTruthy();
    expect(screen.getByText('Abang Zul')).toBeTruthy();
    // From (the player) and To (the contact): fake "0000-0000-0NNN" numbers only.
    expect(screen.getAllByText(/^Akaun 0000-0000-0\d{3} \(contoh\)$/)).toHaveLength(2);
    // Read-only: nothing to type real data into.
    expect(document.querySelectorAll('input, textarea, select, [contenteditable]')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Sahkan' })).toBeTruthy();
  });

  it('TAC screen shows the warning "Jangan kongsi TAC dengan sesiapa"', () => {
    renderTransfer();
    fireEvent.click(screen.getByRole('button', { name: 'Sahkan' }));
    expect(screen.getByText(WARNING)).toBeTruthy();
    expect(screen.getByLabelText(/^Kod TAC \d{6}$/)).toBeTruthy();
    expect(screen.getByText(BANNER)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hantar TAC' })).toBeTruthy();
    expect(document.querySelectorAll('input, textarea, select')).toHaveLength(0);
  });

  it('double-tapping Sahkan transfers once (Review Focus 3)', () => {
    const onDone = renderTransfer();
    const sahkan = screen.getByRole('button', { name: 'Sahkan' });
    act(() => { sahkan.click(); sahkan.click(); });
    const hantar = screen.getByRole('button', { name: 'Hantar TAC' });
    act(() => { hantar.click(); hantar.click(); });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('double-tapping Hantar TAC, or Hantar then Batal in one burst, resolves once', () => {
    const onDone = renderTransfer();
    fireEvent.click(screen.getByRole('button', { name: 'Sahkan' }));
    const hantar = screen.getByRole('button', { name: 'Hantar TAC' });
    const batal = screen.getByRole('button', { name: 'Batal' });
    act(() => { hantar.click(); hantar.click(); batal.click(); });
    expect(onDone.mock.calls).toEqual([[true]]);
  });

  it('Batal on the transfer screen or the TAC screen resolves false', () => {
    const a = renderTransfer();
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(a.mock.calls).toEqual([[false]]);
    cleanup();
    const b = renderTransfer();
    fireEvent.click(screen.getByRole('button', { name: 'Sahkan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(b.mock.calls).toEqual([[false]]);
  });

  it('never moves money itself (ink effect tags do)', () => {
    const before = useGame.getState().meters;
    renderTransfer();
    fireEvent.click(screen.getByRole('button', { name: 'Sahkan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hantar TAC' }));
    expect(useGame.getState().meters).toBe(before);
    expect(useGame.getState().txLog).toEqual([]);
  });
});

describe('BankKu home (S08)', () => {
  it('balance 0 renders RM0.00 (Review Focus 2)', () => {
    useGame.getState().set({ meters: { ...useGame.getState().meters, duit: 0 } });
    render(<BankKu mode="home" />);
    const balance = screen.getByRole('region', { name: 'Baki tersedia' });
    expect(within(balance).getByText('RM0.00')).toBeTruthy();
    expect(screen.getByText(BANNER)).toBeTruthy();
  });

  it('shows read-only Pelaburan rows for both Labur products', () => {
    const m = useGame.getState().meters;
    useGame.getState().set({ meters: { ...m, duit: 1234.5, labur: { amanah: 120, ekuiti: 0 } } });
    render(<BankKu mode="home" />);
    expect(within(screen.getByRole('region', { name: 'Baki tersedia' })).getByText('RM1,234.50')).toBeTruthy();
    const invest = screen.getByRole('region', { name: 'Pelaburan' });
    expect(within(invest).getByText('Amanah Cempaka')).toBeTruthy();
    expect(within(invest).getByText('RM120.00')).toBeTruthy();
    expect(within(invest).getByText('Dana Ekuiti Cempaka')).toBeTruthy();
    expect(within(invest).getByText('RM0.00')).toBeTruthy();
    expect(within(invest).queryAllByRole('button')).toHaveLength(0);
  });

  it('lists the last 5 transactions, newest first', () => {
    const txLog = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, week: 2, label: `T${i + 1}`, amount: i === 6 ? 400 : -10 }));
    txLog[5] = { id: 6, week: 2, label: 'bankku.tx.income', amount: 400 };
    useGame.getState().set({ txLog });
    render(<BankKu mode="home" />);
    const list = screen.getByRole('list', { name: 'Transaksi terkini' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[0]!.textContent).toContain('T7');
    expect(items[0]!.textContent).toContain('+RM400.00');
    expect(items[1]!.textContent).toContain('Gaji sambilan');
    expect(items[4]!.textContent).toContain('T3');
    expect(items[4]!.textContent).toContain('-RM10.00');
    expect(items[4]!.textContent).toContain('Minggu 2');
  });

  it('shows an empty state with no transactions', () => {
    render(<BankKu mode="home" />);
    expect(screen.getByText(/Belum ada transaksi/)).toBeTruthy();
  });

  it('frozen account shows "Akaun anda telah dibekukan" and goes to the pending aftermath', () => {
    const g = useGame.getState();
    g.set({ meters: { ...g.meters, akaun: 'Disekat' } });
    g.startScenario('pindah');
    g.endScenario({ id: 'pindah', outcome: 'mule', transcript: [] });
    render(<BankKu mode="home" />);
    expect(screen.getByText('Akaun anda telah dibekukan')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lihat apa jadi seterusnya' }));
    expect(window.location.hash).toBe('#/semester/akibat/pindah');
  });

  it('frozen with nothing pending goes home', () => {
    useGame.getState().set({ meters: { ...useGame.getState().meters, akaun: 'Ditutup' } });
    render(<BankKu mode="home" />);
    expect(screen.getByText('Akaun anda telah dibekukan')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lihat apa jadi seterusnya' }));
    expect(window.location.hash).toBe('#/home');
  });
});

describe('FakePage (ui:link)', () => {
  it('shows the .test address, SimulasiBanner, the page and read-only fields', () => {
    render(<FakePage url="kurierkilat-bayar.test/alamat" onDone={vi.fn()} />);
    expect(screen.getByLabelText('Alamat laman').textContent).toBe('kurierkilat-bayar.test/alamat');
    expect(screen.getByText(BANNER)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Bayaran penghantaran' })).toBeTruthy();
    expect(screen.getByText('KK-0000-0042 (contoh)')).toBeTruthy();
    expect(document.querySelectorAll('input, textarea, select, [contenteditable]')).toHaveLength(0);
  });

  it('asksTac: the button leads to the TAC screen; Hantar TAC resolves true', () => {
    const onDone = vi.fn();
    render(<FakePage url="kurierkilat-bayar.test/alamat" onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bayar RM2.90' }));
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText(WARNING)).toBeTruthy();
    const hantar = screen.getByRole('button', { name: 'Hantar TAC' });
    act(() => { hantar.click(); hantar.click(); });
    expect(onDone.mock.calls).toEqual([[true]]);
  });

  it('asksTac on the TAC screen: Batal resolves false', () => {
    const onDone = vi.fn();
    render(<FakePage url="kurierkilat-bayar.test/alamat" onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bayar RM2.90' }));
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(onDone.mock.calls).toEqual([[false]]);
  });

  it('no TAC: the button resolves true once; closing resolves false', () => {
    const a = vi.fn();
    render(<FakePage url="cryptonaga.test/daftar" onDone={a} />);
    const btn = screen.getByRole('button', { name: 'Daftar sekarang' });
    act(() => { btn.click(); btn.click(); });
    expect(a.mock.calls).toEqual([[true]]);
    cleanup();
    const b = vi.fn();
    render(<FakePage url="cryptonaga.test" onDone={b} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tutup laman' }));
    expect(b.mock.calls).toEqual([[false]]);
  });

  it('an unknown host shows the generic "Laman ini tidak wujud (simulasi)" page', () => {
    const onDone = vi.fn();
    render(<FakePage url="tiada-langsung.test/x" onDone={onDone} />);
    expect(screen.getByText('Laman ini tidak wujud (simulasi)')).toBeTruthy();
    expect(screen.getByText(BANNER)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup laman' }));
    expect(onDone.mock.calls).toEqual([[false]]);
  });
});

describe('ChatThread overlays (ui:transfer, ui:link, ui:calc)', () => {
  const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
  const open = async (id: string) => {
    vi.useFakeTimers();
    window.location.hash = `#/sembang/${id}`;
    await act(async () => { render(<ChatThread params={{ id }} />); });
    await tick(BALANCE.typing.maxMs);
  };

  it('Hantar TAC continues the chat on the ui_ok branch; the ink moves the money', async () => {
    await open('pindah');
    expect(screen.queryByText(BANNER)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Buka BankKu' }));
    expect(screen.getByRole('dialog', { name: 'BankKu' })).toBeTruthy();
    expect(screen.getByText('RM500.00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sahkan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hantar TAC' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await tick(BALANCE.typing.maxMs);
    expect(screen.getByText('Terima kasih!')).toBeTruthy();
    expect(useGame.getState().meters.duit).toBe(BALANCE.start.duit - 500);
    expect(useGame.getState().txLog).toMatchObject([{ week: 3, label: 'Abang Zul', amount: -500 }]);
  });

  it('Batal continues on the other branch with the money untouched', async () => {
    await open('pindah');
    fireEvent.click(screen.getByRole('button', { name: 'Buka BankKu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    await tick(BALANCE.typing.maxMs);
    expect(screen.getByText('Takpe la.')).toBeTruthy();
    expect(useGame.getState().meters.duit).toBe(BALANCE.start.duit);
  });

  it('a link opens the fake page; its TAC leads on to the ui_ok branch', async () => {
    await open('pautan');
    fireEvent.click(screen.getByRole('button', { name: 'Buka pautan' }));
    expect(screen.getByRole('dialog', { name: 'kurierkilat-bayar.test/alamat' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bayar RM2.90' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hantar TAC' }));
    await tick(BALANCE.typing.maxMs);
    expect(screen.getByText('Terima kasih!')).toBeTruthy();
  });

  it('the Kalkulator hook is a neutral card, not a bank transfer', async () => {
    await open('kira');
    expect(screen.getByText('Kalkulator')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Buka BankKu' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Buka Kalkulator' }));
    await tick(BALANCE.typing.maxMs);
    expect(screen.getByText('Ok.')).toBeTruthy();
  });
});
