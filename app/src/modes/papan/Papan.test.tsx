// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGame } from '../../state/game';
import { Papan } from './Papan';

vi.mock('virtual:celik-content', () => ({
  scenarios: {},
  classmates: Array.from({ length: 9 }, (_, i) => ({ id: `k${i + 1}`, name: `Rakan ${i + 1}`, avatar: `a${i + 1}` })),
}));
const report = vi.hoisted(() => ({ score: 65.5 }));
vi.mock('../kongsi/useReport', () => ({ useReport: () => ({ score: report.score, finished: false }) }));

afterEach(() => { cleanup(); useGame.getState().reset(); });

describe('Papan Markah (W5)', () => {
  it('lists 10 rows and highlights the player at the place rankClassmates gives', () => {
    useGame.getState().set({ week: 12 });
    render(<Papan />);
    const rows = within(screen.getByRole('list', { name: 'Kedudukan kelas' })).getAllByRole('listitem');
    expect(rows).toHaveLength(10);
    const mine = rows.filter((r) => r.getAttribute('aria-current') === 'true');
    expect(mine).toHaveLength(1);
    // Grades 42 51 58 63 67 71 76 82 90: 65.5 sits 6th from the top.
    expect(rows.indexOf(mine[0])).toBe(5);
    expect(within(mine[0]).getByText('Aina (kamu)')).toBeTruthy();
    expect(screen.getByText('Kamu di tempat ke-6 daripada 10.')).toBeTruthy();
    // The same one-decimal score as the report card and Kad Keputusan.
    expect(within(mine[0]).getByText('65.5/100')).toBeTruthy();
  });

  it('a tie places the player above the classmate; 100 is first and 0 is last', () => {
    useGame.getState().set({ week: 12 });
    for (const [score, place] of [[90, 1], [100, 1], [0, 10]] as const) {
      report.score = score;
      const v = render(<Papan />);
      expect(screen.getByText(`Kamu di tempat ke-${place} daripada 10.`)).toBeTruthy();
      v.unmount();
    }
  });

  it('shows the Cek Harian streak and the offline note', () => {
    useGame.setState({ harian: { ...useGame.getState().harian, streak: 3 }, swipe: { best: 5, streak: 9, lastPlayed: null } });
    render(<Papan />);
    expect(screen.getByText('Siri Cek Harian kamu: 3 hari')).toBeTruthy();
    expect(screen.getByText(/rekaan/)).toBeTruthy();
  });

  it('mid-semester, classmates show the grades for this week and an up or down mark (not the final grades)', () => {
    useGame.getState().set({ week: 6 });
    report.score = 40;
    render(<Papan />);
    const list = screen.getByRole('list', { name: 'Kedudukan kelas' });
    expect(within(list).queryByText('90/100')).toBeNull();
    expect(within(list).getAllByLabelText(/^Naik [\d.]+ minggu ini$/).length).toBeGreaterThan(0);
    expect(within(list).getAllByLabelText(/^Turun [\d.]+ minggu ini$/).length).toBeGreaterThan(0);
  });
});
