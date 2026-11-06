// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { useScenario } from './useScenario';

// Scenario 1 as authored (path from app/, where vitest runs; jsdom gives import.meta.url a non-file
// scheme), plus a small fixture with a system line, tag-only effects and a ui directive.
vi.mock('virtual:celik-content', async () => {
  const { compileScenario } = await import('../../engine/compile');
  const src = readFileSync(resolve(process.cwd(), '../content/scenarios/kerja_sambilan.ink'), 'utf8');
  const head = ['# id:fixture', '# type:scam', '# family:job', '# tactics:greed', '# contact:Tester', '# apa_patut:Semak dulu.'];
  const body = [
    'Tester: Halo dik.',
    'Mesej ini dipadam.',
    'Tester: Nak kerja? # flag:greed:Nak kerja # effect:tekanan:5',
    '# effect:duit:-50',
    '* [Ya] -> ya',
    '* [Tak] -> tak',
    '=== ya ===',
    'Tester: Bayar sini bayar.test/yuran # ui:link:bayar.test/yuran',
    'Tester: Terima kasih. # effect:duit:-100 # outcome:scammed',
    '-> END',
    '=== tak ===',
    'Tester: Ok. # outcome:safe',
    '-> END',
  ];
  return {
    scenarios: {
      kerja_sambilan: compileScenario(src, 'kerja_sambilan.ink'),
      fixture: compileScenario(`${head.join('\n')}\n\n${body.join('\n')}\n`, 'fixture.ink'),
    },
  };
});

const MIN = BALANCE.typing.minMs;
const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
/** Lets queued promise callbacks run without moving the clock. */
const flush = () => act(() => vi.advanceTimersByTimeAsync(0));

beforeEach(() => {
  vi.useFakeTimers();
  useGame.getState().reset();
  useGame.getState().set({ week: 1 });
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: false, demo: true });
  window.location.hash = '#/sembang/fixture';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useScenario', () => {
  it('shows the first message after the typing delay', async () => {
    const { result } = renderHook(() => useScenario('kerja_sambilan', { random: () => 0 }));
    expect(useGame.getState().active?.id).toBe('kerja_sambilan');
    expect(result.current.meta.contact).toBe('Kak Mira (HR)');
    await flush();
    expect(result.current.typing).toBe(true);
    expect(result.current.messages).toEqual([]);
    await tick(MIN - 1);
    expect(result.current.messages).toEqual([]);
    await tick(1);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      from: 'them', speaker: 'Kak Mira (HR)', text: 'Salam dik 😊 Akak Mira, HR dari Bintang Digital Sdn Bhd.',
    });
  });

  it('uses min + random x (max - min), times 0.3 with reduced motion', async () => {
    const waits: number[] = [];
    const delay = (ms: number) => { waits.push(ms); return Promise.resolve(); };
    renderHook(() => useScenario('kerja_sambilan', { delay, random: () => 0.5 }));
    await flush();
    const mid = MIN + 0.5 * (BALANCE.typing.maxMs - MIN);
    expect(waits.slice(0, 5)).toEqual([mid, mid, mid, mid, mid]);

    useSettings.getState().toggle('reducedMotion');
    waits.length = 0;
    renderHook(() => useScenario('kerja_sambilan', { delay, random: () => 0.5 }));
    await flush();
    expect(waits[0]).toBeCloseTo(mid * 0.3);
  });

  it('renders system lines as system messages and offers choices', async () => {
    const { result } = renderHook(() => useScenario('fixture', { random: () => 0 }));
    await tick(MIN * 3);
    expect(result.current.messages.map((m) => [m.from, m.speaker, m.text])).toEqual([
      ['them', 'Tester', 'Halo dik.'],
      ['system', null, 'Mesej ini dipadam.'],
      ['them', 'Tester', 'Nak kerja?'],
    ]);
    expect(result.current.typing).toBe(false);
    expect(result.current.choices).toEqual([{ index: 0, text: 'Ya' }, { index: 1, text: 'Tak' }]);
  });

  it('tag-only lines apply effects without a bubble', async () => {
    const { result } = renderHook(() => useScenario('fixture', { random: () => 0 }));
    await tick(MIN * 3);
    expect(result.current.messages.some((m) => m.text === '')).toBe(false);
    expect(useGame.getState().meters.tekanan).toBe(BALANCE.start.tekanan + 5);
    expect(useGame.getState().meters.duit).toBe(BALANCE.start.duit - 50);
  });

  it('choosing adds a me bubble and continues', async () => {
    const { result } = renderHook(() => useScenario('fixture', { random: () => 0 }));
    await tick(MIN * 3);
    act(() => result.current.choose(1));
    expect(result.current.choices).toBeNull();
    expect(result.current.messages.at(-1)).toMatchObject({ from: 'me', text: 'Tak' });
    await tick(MIN);
    expect(result.current.messages.at(-1)).toMatchObject({ from: 'them', text: 'Ok.' });
    expect(result.current.ended).toEqual({ outcome: 'safe' });
    // No navigation on the end: ChatThread shows "Lihat apa jadi seterusnya" after a pause.
    expect(window.location.hash).toBe('#/sembang/fixture');
    const ended = useGame.getState().lastEnded;
    expect(ended).toMatchObject({ id: 'fixture', outcome: 'safe', found: [], huntDone: false });
    expect(ended!.transcript.map((m) => m.text)).toEqual(['Halo dik.', 'Mesej ini dipadam.', 'Nak kerja?', 'Tak', 'Ok.']);
    expect(ended!.transcript[2].flags).toEqual([{ tactic: 'greed', phrase: 'Nak kerja' }]);
  });

  it('double-tapping a chip chooses once', async () => {
    const { result } = renderHook(() => useScenario('fixture', { random: () => 0 }));
    await tick(MIN * 3);
    act(() => {
      result.current.choose(0);
      result.current.choose(0);
    });
    await tick(MIN);
    expect(result.current.messages.filter((m) => m.from === 'me')).toHaveLength(1);
    // The link line pauses the story until the ui is resolved.
    expect(result.current.pendingUi).toEqual({ kind: 'link', url: 'bayar.test/yuran' });
    await tick(MIN * 4);
    expect(result.current.messages.at(-1)?.text).toBe('Bayar sini bayar.test/yuran');
    act(() => result.current.resolveUi(true));
    expect(result.current.pendingUi).toBeNull();
    await tick(MIN);
    expect(result.current.ended).toEqual({ outcome: 'scammed' });
    expect(useGame.getState().meters.duit).toBe(BALANCE.start.duit - 50 - 100);
  });

  it('hint returns the scenario hint once and costs 10 XP', async () => {
    useGame.getState().set({ meters: { ...useGame.getState().meters, xp: 100 } });
    const { result } = renderHook(() => useScenario('kerja_sambilan', { random: () => 0 }));
    let first: string | null = null;
    let second: string | null = 'x';
    act(() => { first = result.current.hint(); });
    act(() => { second = result.current.hint(); });
    expect(first).toBe('Syarikat sebenar tak minta bayaran untuk mula kerja.');
    expect(second).toBeNull();
    expect(useGame.getState().meters.xp).toBe(90);
    expect(useGame.getState().active?.hintUsed).toBe(true);
  });

  it('hint is null when the scenario has none', () => {
    const { result } = renderHook(() => useScenario('fixture'));
    expect(result.current.hint()).toBeNull();
  });

  it('stops after unmount', async () => {
    const { result, unmount } = renderHook(() => useScenario('fixture', { random: () => 0 }));
    await flush();
    unmount();
    await tick(MIN * 5);
    expect(result.current.messages).toEqual([]);
  });
});
