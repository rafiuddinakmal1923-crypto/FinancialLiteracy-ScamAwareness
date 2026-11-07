// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { ChatThread } from './ChatThread';

// A chat with a reply, then a Kira dulu pause, then more talk: leaving for the Kalkulator and coming back must resume it.
vi.mock('virtual:celik-content', async () => {
  const { compileScenario } = await import('../../engine/compile');
  const ink = [
    '# id:kira2', '# type:scam', '# family:investment', '# tactics:greed', '# contact:Abang Zul', '',
    'VAR ui_ok = false',
    'Abang Zul: Salam, ada projek untung. # effect:duit:-10',
    '* [Cerita lagi]',
    '- Abang Zul: Untung 30% seminggu! # flag:greed:30% seminggu # ui:calc:pulangan:naga30w',
    'Abang Zul: Jadi, nak join? # outcome:safe',
    '-> END',
  ].join('\n') + '\n';
  return {
    semester: null, scenarios: { kira2: compileScenario(ink, 'kira2.ink') }, calcPresets: [], pages: {} };
});

const tick = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

beforeEach(() => {
  vi.useFakeTimers();
  useGame.getState().reset();
  useGame.getState().set({ week: 3, onboarded: true });
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
  window.location.hash = '#/sembang/kira2';
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

async function toCalcCard() {
  await act(async () => { render(<ChatThread params={{ id: 'kira2' }} />); });
  await tick(BALANCE.typing.maxMs);
  fireEvent.click(screen.getByRole('button', { name: 'Cerita lagi' }));
  await tick(BALANCE.typing.maxMs);
  expect(screen.getByRole('button', { name: 'Buka Kalkulator' })).toBeTruthy();
}

describe('chat resumes after the Kalkulator (Review Focus 3)', () => {
  it('opening saves the path; coming back rebuilds the chat and continues past the pause', async () => {
    await toCalcCard();
    fireEvent.click(screen.getByRole('button', { name: 'Buka Kalkulator' }));
    expect(window.location.hash).toBe('#/kalkulator/pulangan?preset=naga30w');
    expect(useGame.getState().calcResume).toMatchObject({ id: 'kira2', trail: [{ c: 0 }], returned: false });
    cleanup(); // the chat unmounts when the route changes

    useGame.getState().calcReturn();
    await act(async () => { render(<ChatThread params={{ id: 'kira2' }} />); });
    // The earlier bubbles are back at once, no duplicates, the Duit effect applied exactly once.
    expect(screen.getAllByText('Salam, ada projek untung.')).toHaveLength(1);
    expect(screen.getAllByText('Cerita lagi')).toHaveLength(1);
    expect(screen.getAllByText('Untung 30% seminggu!')).toHaveLength(1);
    expect(useGame.getState().meters.duit).toBe(BALANCE.start.duit - 10);
    expect(screen.queryByRole('button', { name: 'Buka Kalkulator' })).toBeNull();
    await tick(BALANCE.typing.maxMs);
    expect(screen.getByText('Jadi, nak join?')).toBeTruthy();
    expect(useGame.getState().calcResume).toBeNull();
  });

  it('after a reload (hydrate rolls the chat back) the card is shown again at the same point', async () => {
    await toCalcCard();
    fireEvent.click(screen.getByRole('button', { name: 'Buka Kalkulator' }));
    cleanup();
    const saved = JSON.parse(JSON.stringify(useGame.getState()));
    useGame.getState().hydrate(saved);
    expect(useGame.getState().calcResume).toMatchObject({ id: 'kira2' });
    await act(async () => { render(<ChatThread params={{ id: 'kira2' }} />); });
    expect(screen.getAllByText('Untung 30% seminggu!')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Buka Kalkulator' })).toBeTruthy();
    expect(useGame.getState().meters.duit).toBe(BALANCE.start.duit - 10);
  });
});
