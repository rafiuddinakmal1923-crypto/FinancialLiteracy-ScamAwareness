// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { Dompet } from './Dompet';

const STEP = BALANCE.finance.simpananStep;
const add = () => screen.queryByRole('button', { name: `Simpan RM${STEP}` });
const out = () => screen.queryByRole('button', { name: `Keluarkan RM${STEP}` });

function open(weekIntroOpen: boolean, simpanan = 100) {
  useGame.getState().set({
    week: 1, weekIntroOpen, budget: { needs: 50, wants: 30, savings: 20 },
    meters: { ...useGame.getState().meters, simpanan },
  });
  render(<Dompet />);
}

beforeEach(() => {
  useGame.getState().reset();
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
});
afterEach(cleanup);

describe('weekly saving in Dompet (D46)', () => {
  it('saves and takes out at a week intro', () => {
    open(true);
    fireEvent.click(add()!);
    expect(useGame.getState().meters.simpanan).toBe(100 + STEP);
    fireEvent.click(out()!);
    expect(useGame.getState().meters.simpanan).toBe(100);
  });

  it('is not offered outside a week intro', () => {
    open(false);
    expect(add()).toBeNull();
    expect(out()).toBeNull();
  });

  it('cannot take out what is not there', () => {
    open(true, 0);
    expect((out() as HTMLButtonElement).disabled).toBe(true);
  });

  it('cannot save more than Duit', () => {
    open(true, BALANCE.start.duit);
    expect((add() as HTMLButtonElement).disabled).toBe(true);
  });
});
