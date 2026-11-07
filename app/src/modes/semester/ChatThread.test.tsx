// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { ChatThread } from './ChatThread';
import { ChatList } from './ChatList';

// Two small chat scenarios: "satu" has ended (pending aftermath); the chat on offer (kerja_sambilan, "Dua") is another.
vi.mock('virtual:celik-content', async () => {
  const { compileScenario } = await import('../../engine/compile');
  const make = (id: string, contact: string) => compileScenario([
    `# id:${id}`, '# type:scam', '# family:job', '# tactics:greed', `# contact:${contact}`, '',
    `${contact}: Kerja senang. # flag:greed:Kerja senang`,
    '* [Tak nak] Kamu: Tak nak. # outcome:safe',
    '-> END',
  ].join('\n') + '\n', `${id}.ink`);
  const NL = String.fromCharCode(10);
  const call = compileScenario([
    '# id:telefon', '# type:scam', '# family:authority', '# tactics:fear', '# contact:Pegawai', '# ui:call', '',
    'Pegawai: Ada waran. # flag:fear:waran',
    '* [Letak telefon.] Kamu: Letak. # outcome:safe',
    '-> END',
  ].join(NL) + NL, 'telefon.ink');
  return { scenarios: { satu: make('satu', 'Satu'), kerja_sambilan: make('kerja_sambilan', 'Dua'), telefon: call }, semester: { weeks: [] } };
});

const transcript = [{ id: 1, from: 'them' as const, speaker: 'Satu', text: 'Kerja senang.', flags: [] }];

beforeEach(() => {
  useGame.getState().reset();
  useGame.getState().set({ week: 1 });
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
  // "satu" ended with RM400 gone; its consequence is still open.
  useGame.getState().startScenario('satu');
  useGame.getState().apply([{ kind: 'duit', delta: -400 }]);
  useGame.getState().endScenario({ id: 'satu', outcome: 'scammed', transcript });
  window.location.hash = '#/sembang/kerja_sambilan';
});

afterEach(cleanup);

describe('pending aftermath guard (M2)', () => {
  it('opening a different chat redirects to the pending consequence and keeps the meters', async () => {
    await act(async () => { render(<ChatThread params={{ id: 'kerja_sambilan' }} />); });
    expect(window.location.hash).toBe('#/semester/akibat/satu');
    const s = useGame.getState();
    expect(s.active?.id).toBe('satu');
    expect(s.lastEnded?.id).toBe('satu');
    expect(s.meters.duit).toBe(BALANCE.start.duit - 400);
  });

  it('chat list rows open the pending consequence', async () => {
    window.location.hash = '#/sembang';
    await act(async () => { render(<ChatList />); });
    const row = screen.getByRole('button', { name: /Dua/ });
    await act(async () => { fireEvent.click(row); });
    expect(window.location.hash).toBe('#/semester/akibat/satu');
    expect(screen.getByRole('button', { name: /Satu/ }).textContent).toMatch(/Lihat apa jadi/);
  });
});

describe('chat route only for chat scenarios (Task 25)', () => {
  it('a call scenario id on /sembang/:id does not play as a chat', async () => {
    useGame.getState().reset();
    useGame.getState().set({ week: 1 });
    window.location.hash = '#/sembang/telefon';
    await act(async () => { render(<ChatThread params={{ id: 'telefon' }} />); });
    expect(window.location.hash).toBe('#/sembang');
    expect(useGame.getState().active).toBeNull();
    expect(screen.queryByRole('log')).toBeNull();
  });

  it('an unknown id does not open', async () => {
    useGame.getState().reset();
    window.location.hash = '#/sembang/tiada';
    await act(async () => { render(<ChatThread params={{ id: 'tiada' }} />); });
    expect(window.location.hash).toBe('#/sembang');
    expect(useGame.getState().active).toBeNull();
  });
});
