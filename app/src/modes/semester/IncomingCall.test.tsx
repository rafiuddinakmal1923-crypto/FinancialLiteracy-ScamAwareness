// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { hasHangUp, IncomingCall } from './IncomingCall';

// A call with a fear line, two choices and a "Letak telefon" branch; "nohangup" has no hang-up choice.
vi.mock('virtual:celik-content', async () => {
  const { compileScenario } = await import('../../engine/compile');
  const head = (id: string) => [`# id:${id}`, '# type:scam', '# family:authority', '# tactics:authority,fear', '# contact:Pegawai Mahkamah', '# number:011-0000 0990', '# ui:call', ''];
  const call = compileScenario([
    ...head('telefon'),
    'Pegawai Mahkamah: Saya Pegawai Mahkamah. # flag:authority:Saya Pegawai Mahkamah',
    'Inspektor: Ada waran tangkap untuk kamu. # flag:fear:waran tangkap',
    '* [Baik, saya ikut arahan.] -> ikut',
    '* [Letak telefon.] -> letak',
    '=== ikut ===',
    'Kamu pindahkan RM300. # effect:duit:-300 # outcome:scammed',
    '-> END',
    '=== letak ===',
    'Kamu letak telefon. # outcome:safe',
    '-> END',
  ].join('\n') + '\n', 'telefon.ink');
  const nohang = compileScenario([
    ...head('nohangup'),
    'Pegawai Mahkamah: Dengar sini, saya pegawai. # flag:authority:saya pegawai',
    'Pegawai Mahkamah: Kamu akan ditangkap. # flag:fear:ditangkap',
    '* [Baik.] Kamu: Baik. # outcome:scammed',
    '* [Saya semak sendiri.] Kamu: Semak. # outcome:safe',
    '-> END',
  ].join('\n') + '\n', 'nohangup.ink');
  const chat = compileScenario(['# id:sembang1', '# type:scam', '# family:job', '# tactics:greed', '# contact:Kak', '', 'Kak: Hai. # flag:greed:Hai', '* [x] Kamu: x # outcome:safe', '-> END'].join('\n') + '\n', 'sembang1.ink');
  return { scenarios: { telefon: call, nohangup: nohang, sembang1: chat }, semester: { weeks: [] } };
});

const instant = () => Promise.resolve();
const options = { delay: instant, random: () => 0 };

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  useGame.getState().reset();
  useGame.getState().set({ week: 11, onboarded: true });
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: false, demo: true });
  window.location.hash = '#/panggilan/telefon';
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(50); });
const accept = async () => {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Terima' })); });
  await flush();
};

describe('hasHangUp', () => {
  it('finds a "Letak telefon" choice among the first choices', () => {
    expect(hasHangUp('telefon')).toBe(true);
    expect(hasHangUp('nohangup')).toBe(false);
  });
});

describe('IncomingCall (S07)', () => {
  it('rings with the caller ID and Terima / Tolak, without starting the story', async () => {
    await act(async () => { render(<IncomingCall params={{ id: 'telefon' }} options={options} />); });
    expect(screen.getByRole('heading', { name: 'Pegawai Mahkamah' })).toBeTruthy();
    expect(screen.getByText('011-0000 0990')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Terima' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tolak' })).toBeTruthy();
    expect(useGame.getState().active).toBeNull();
  });

  it('accept: timer, transcript, chips; picking one ends in the aftermath', async () => {
    await act(async () => { render(<IncomingCall params={{ id: 'telefon' }} options={options} />); });
    await accept();
    expect(screen.getByRole('timer').textContent).toBe('00:00');
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(screen.getByRole('timer').textContent).toBe('00:03');
    expect(screen.getByText(/Ada waran tangkap/)).toBeTruthy();
    const chips = screen.getByRole('group', { name: 'Pilih balasan' });
    expect(chips.textContent).toMatch(/Baik, saya ikut arahan/);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Letak telefon.' })); });
    await flush();
    expect(useGame.getState().lastEnded?.outcome).toBe('safe');
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Lihat apa jadi seterusnya' })); });
    expect(window.location.hash).toBe('#/semester/akibat/telefon');
  });

  it('Tekanan pulses on the fear line', async () => {
    await act(async () => { render(<IncomingCall params={{ id: 'telefon' }} options={options} />); });
    await accept();
    expect(document.querySelector('[data-fear]')).not.toBeNull();
  });

  it('Tolak plays the hang-up branch by itself and ends safe', async () => {
    await act(async () => { render(<IncomingCall params={{ id: 'telefon' }} options={options} />); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tolak' })); });
    await flush();
    await flush();
    expect(useGame.getState().lastEnded?.outcome).toBe('safe');
    expect(useGame.getState().meters.duit).toBe(2000);
  });

  it('Tolak on a call with no hang-up shows it as missed and keeps Terima', async () => {
    window.location.hash = '#/panggilan/nohangup';
    await act(async () => { render(<IncomingCall params={{ id: 'nohangup' }} options={options} />); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tolak' })); });
    expect(screen.getByRole('note').textContent).toMatch(/Panggilan terlepas/);
    expect(screen.queryByRole('button', { name: 'Tolak' })).toBeNull();
    expect(useGame.getState().active).toBeNull();
    await accept();
    expect(screen.getByRole('group', { name: 'Pilih balasan' })).toBeTruthy();
  });

  it('reduced motion: halo and voice bars are static', async () => {
    useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
    await act(async () => { render(<IncomingCall params={{ id: 'telefon' }} options={options} />); });
    expect(document.querySelector('.call-halo')?.getAttribute('data-static')).toBe('true');
    await accept();
    expect(screen.getByRole('img', { name: 'Gelombang suara' }).getAttribute('data-static')).toBe('true');
    expect(document.querySelector('.call-bar')).toBeNull();
  });

  it('a chat id goes home; a pending aftermath is shown instead of a new call', async () => {
    window.location.hash = '#/panggilan/sembang1';
    await act(async () => { render(<IncomingCall params={{ id: 'sembang1' }} />); });
    expect(window.location.hash).toBe('#/home');
    cleanup();
    useGame.getState().startScenario('nohangup');
    useGame.getState().endScenario({ id: 'nohangup', outcome: 'scammed', transcript: [] });
    await act(async () => { render(<IncomingCall params={{ id: 'telefon' }} />); });
    expect(window.location.hash).toBe('#/semester/akibat/nohangup');
  });

  it('a finished call cannot be played again', async () => {
    useGame.getState().set({ results: [{ id: 'telefon', outcome: 'safe', right: true, flagsFound: 0, flagsTotal: 0, tactics: [], family: 'authority', concepts: [] }] });
    await act(async () => { render(<IncomingCall params={{ id: 'telefon' }} />); });
    expect(screen.getByText('Panggilan ini sudah selesai.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Terima' })).toBeNull();
  });
});
