// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Goal } from '../../engine/types';
import { useGame } from '../../state/game';
import { GoalBar } from './GoalBar';
import { GoalPicker } from './GoalPicker';
import { GoalResult } from './GoalResult';

const GOALS = vi.hoisted(() => [
  { id: 'kecemasan', measure: 'simpanan', name: { ms: 'Dana kecemasan', en: 'Emergency fund' } },
  { id: 'laptop', measure: 'simpanan', name: { ms: 'Simpan untuk laptop' } },
] as Goal[]);
vi.mock('virtual:celik-content', () => ({ goals: GOALS }));
const engine = vi.hoisted(() => ({ reached: false, value: 0 }));
vi.mock('../../engine/goals', async (orig) => {
  const real = await orig<typeof import('../../engine/goals')>();
  return {
    ...real,
    goalProgress: (s: Parameters<typeof real.goalProgress>[0]) => {
      const p = real.goalProgress(s);
      return p && { ...p, value: engine.value, ratio: engine.value / p.target };
    },
    goalReached: () => engine.reached,
  };
});

afterEach(() => { cleanup(); useGame.getState().reset(); engine.reached = false; engine.value = 0; });

describe('Matlamat (W4)', () => {
  it('GoalPicker lists every goal with its balance.ts target at week 0 and saves the pick', () => {
    render(<GoalPicker />);
    expect(screen.getByRole('button', { name: /Dana kecemasan.*RM300/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Simpan untuk laptop.*RM500/ }));
    expect(useGame.getState().goal).toBe('laptop');
  });

  it('GoalPicker hides once a goal is picked, and after week 0', () => {
    useGame.setState({ goal: 'kecemasan' });
    const a = render(<GoalPicker />);
    expect(a.container.innerHTML).toBe('');
    a.unmount();
    useGame.setState({ goal: null, week: 3 });
    expect(render(<GoalPicker />).container.innerHTML).toBe('');
  });

  it('GoalBar shows progress toward the target; it can be changed only at week 0', () => {
    engine.value = 120;
    useGame.setState({ goal: 'kecemasan' });
    const v = render(<GoalBar />);
    expect(screen.getByText('Matlamat: Dana kecemasan')).toBeTruthy();
    expect(screen.getByText('RM120 / RM300')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('120');
    fireEvent.click(screen.getByRole('button', { name: 'Tukar matlamat' }));
    expect(useGame.getState().goal).toBeNull();
    v.unmount();
    useGame.setState({ goal: 'kecemasan', week: 2 });
    render(<GoalBar />);
    expect(screen.queryByRole('button', { name: 'Tukar matlamat' })).toBeNull();
  });

  it('GoalBar and GoalResult render nothing without a goal', () => {
    expect(render(<GoalBar />).container.innerHTML).toBe('');
    expect(render(<GoalResult />).container.innerHTML).toBe('');
  });

  it('GoalResult says reached with the XP bonus, or how far the player got', () => {
    useGame.setState({ goal: 'kecemasan' });
    engine.value = 180;
    const v = render(<GoalResult />);
    expect(screen.getByText('Dana kecemasan: RM180 daripada RM300. Setiap ringgit yang disimpan tetap dikira.')).toBeTruthy();
    v.unmount();
    engine.reached = true;
    render(<GoalResult />);
    expect(screen.getByText('Dana kecemasan: RM300 tercapai! +100 XP.')).toBeTruthy();
  });
});
