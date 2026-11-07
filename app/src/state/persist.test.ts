import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGame } from './game';
import { startAutoSave } from './persist';

const writeSaveNow = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('../storage/db', () => ({ loadSave: vi.fn(), writeSaveNow }));

beforeEach(() => {
  vi.useFakeTimers();
  writeSaveNow.mockClear();
});
afterEach(() => { vi.useRealTimers(); });

describe('startAutoSave cleanup (A6)', () => {
  it('writes a pending save instead of dropping it', () => {
    const stop = startAutoSave();
    useGame.getState().set({ week: 3 });
    expect(writeSaveNow).not.toHaveBeenCalled();
    stop();
    expect(writeSaveNow).toHaveBeenCalledTimes(1);
  });

  it('writes nothing when no save is pending', () => {
    const stop = startAutoSave();
    stop();
    expect(writeSaveNow).not.toHaveBeenCalled();
  });
});
