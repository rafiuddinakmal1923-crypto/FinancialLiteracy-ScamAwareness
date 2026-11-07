// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSettings } from '../../state/settings';
import { ExplainerSlot, FRAME_MS } from './ExplainerSlot';

vi.mock('virtual:celik-content', () => ({
  explainers: [{
    id: 'kompaun', concept: 'kompaun',
    frames: [1, 2, 3].map((n) => ({ svg: `kompaun-${n}`, caption: { ms: `Bingkai ${n}`, en: `Frame ${n}` } })),
  }],
}));
vi.mock('./frames', () => ({ FRAME_URL: { 'kompaun-1': '/a.svg', 'kompaun-2': '/b.svg', 'kompaun-3': '/c.svg' } }));

afterEach(() => { cleanup(); vi.useRealTimers(); useSettings.setState({ lang: 'ms' }); });

describe('Tonton (W7)', () => {
  it('renders nothing for a concept with no explainer', () => {
    expect(render(<ExplainerSlot concept="bajet" />).container.innerHTML).toBe('');
  });

  it('steps with Seterusnya, Sebelum and a tap on the picture', () => {
    render(<ExplainerSlot concept="kompaun" />);
    expect(screen.getByText('Bingkai 1')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Sebelum' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Seterusnya' }));
    expect(screen.getByText('Bingkai 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Gambar seterusnya' }));
    expect(screen.getByText('Bingkai 3')).toBeTruthy();
    expect(screen.getByText('3 / 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sebelum' }));
    expect(screen.getByText('Bingkai 2')).toBeTruthy();
  });

  it('Main plays every frame on a timer, stops at the end and offers Main semula', () => {
    vi.useFakeTimers();
    render(<ExplainerSlot concept="kompaun" />);
    fireEvent.click(screen.getByRole('button', { name: 'Main' }));
    expect(screen.getByRole('button', { name: 'Jeda' })).toBeTruthy();
    act(() => { vi.advanceTimersByTime(FRAME_MS); });
    expect(screen.getByText('Bingkai 2')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(FRAME_MS); });
    expect(screen.getByText('Bingkai 3')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(FRAME_MS * 2); });
    expect(screen.getByText('Bingkai 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Main semula' }));
    expect(screen.getByText('Bingkai 1')).toBeTruthy();
  });

  it('shows English captions in English', () => {
    useSettings.setState({ lang: 'en' });
    render(<ExplainerSlot concept="kompaun" />);
    expect(screen.getByText('Frame 1')).toBeTruthy();
  });
});
