// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BALANCE } from '../../engine/balance';
import { useSettings } from '../../state/settings';
import { MoneyChain } from './MoneyChain';

const LABELS = ['Mangsa', 'Akaun anda', 'Akaun lapis', 'Sindiket'];
const { hopMs, startMs, traceMs } = BALANCE.moneyChain;

beforeEach(() => {
  vi.useFakeTimers();
  useSettings.setState({ reducedMotion: false, lang: 'ms' });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe('MoneyChain', () => {
  it('shows the four nodes in order, labelled in words', () => {
    render(<MoneyChain />);
    const list = screen.getByRole('list', { name: /Rantaian duit/ });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((li) => li.textContent?.trim())).toEqual(LABELS);
  });

  it('moves the money hop by hop, then the police trace back to "Akaun anda" after the last hop', () => {
    const onDone = vi.fn();
    render(<MoneyChain onDone={onDone} />);
    const chain = screen.getByTestId('money-chain');
    expect(chain.dataset.phase).toBe('0');
    expect(screen.queryByTestId('police-trace')).toBeNull();

    advance(startMs);
    expect(chain.dataset.phase).toBe('1');
    advance(hopMs);
    expect(chain.dataset.phase).toBe('2');
    advance(hopMs);
    expect(chain.dataset.phase).toBe('3');
    // Still no police while the last hop is under way.
    expect(screen.queryByTestId('police-trace')).toBeNull();

    advance(hopMs);
    expect(chain.dataset.phase).toBe('trace');
    const trace = screen.getByTestId('police-trace');
    expect(trace).toHaveProperty('textContent', expect.stringMatching(/Polis/));
    expect(onDone).not.toHaveBeenCalled();

    advance(traceMs);
    expect(chain.dataset.phase).toBe('done');
    expect(screen.getByText(/Akaun anda/, { selector: '[data-traced] *' })).toBeTruthy();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('with reduced motion renders the final state at once (trace included) and reports done', () => {
    useSettings.setState({ reducedMotion: true });
    const onDone = vi.fn();
    render(<MoneyChain onDone={onDone} />);
    expect(screen.getByTestId('money-chain').dataset.phase).toBe('done');
    expect(screen.getByTestId('police-trace')).toBeTruthy();
    advance(BALANCE.moneyChain.reducedMs * 6);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
