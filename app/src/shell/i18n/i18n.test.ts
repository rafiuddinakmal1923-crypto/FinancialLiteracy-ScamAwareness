import { describe, expect, it } from 'vitest';
import { translate } from './index';
import ms from './ms.json';
import en from './en.json';

describe('translate', () => {
  it('interpolates {vars}', () => {
    expect(translate('ms', 'home.week', { week: 3, total: 12 })).toBe('Minggu 3 daripada 12');
  });

  it('falls back from EN to MS, then to the key', () => {
    const msOnly = Object.keys(ms).find((k) => !k.startsWith('_') && !(k in en));
    if (msOnly) expect(translate('en', msOnly)).toBe((ms as Record<string, unknown>)[msOnly]);
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });

  it('uses EN when present', () => {
    expect(translate('en', 'splash.start')).toBe('Start');
    expect(translate('ms', 'splash.start')).toBe('Mula');
  });

  it('ms.json has a _todoVerify list and only string values otherwise', () => {
    expect(Array.isArray((ms as Record<string, unknown>)._todoVerify)).toBe(true);
    for (const [k, v] of Object.entries(ms)) if (!k.startsWith('_')) expect(typeof v).toBe('string');
    for (const k of Object.keys(en)) if (!k.startsWith('_')) expect(k in ms).toBe(true);
  });
});
