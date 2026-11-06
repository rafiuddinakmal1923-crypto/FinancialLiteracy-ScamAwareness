import { describe, expect, it } from 'vitest';
import { isoWeek, localDate } from './dates';

describe('localDate', () => {
  it('uses the local calendar date, not UTC (UTC+8 evening)', () => {
    // 23:30 local on 7 Nov is 15:30Z in UTC+8, but 00:30 local on 8 Nov is 16:30Z on the 7th.
    expect(localDate(new Date(2026, 10, 7, 23, 30))).toBe('2026-11-07');
    expect(localDate(new Date(2026, 10, 8, 0, 30))).toBe('2026-11-08');
  });
  it('zero-pads month and day', () => {
    expect(localDate(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });
  it('defaults to now', () => {
    expect(localDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isoWeek', () => {
  it('gives YYYY-Www with Monday as week start', () => {
    expect(isoWeek('2026-11-02')).toBe('2026-W45'); // Monday
    expect(isoWeek('2026-11-08')).toBe('2026-W45'); // Sunday
    expect(isoWeek('2026-11-09')).toBe('2026-W46');
  });
  it('handles year boundaries', () => {
    expect(isoWeek('2021-01-03')).toBe('2020-W53');
    expect(isoWeek('2024-12-30')).toBe('2025-W01');
    expect(isoWeek('2026-01-01')).toBe('2026-W01');
  });
});
