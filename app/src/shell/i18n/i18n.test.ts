import { describe, expect, it } from 'vitest';
import { DICTS, mergeDicts, translate } from './index';
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

describe('per-mode dictionaries', () => {
  it('merges them under the main dictionary, and the main keys win', () => {
    expect(mergeDicts({ a: 'main' }, [{ a: 'mode', b: 'mode' }])).toEqual({ a: 'main', b: 'mode' });
  });

  it('serves the finalist modes in both languages', () => {
    expect(translate('ms', 'suapan.app')).toBe('Suapan');
    expect(translate('en', 'suapan.app')).toBe('Feed');
  });

  it('has an English string for every per-mode key', () => {
    const missing = Object.keys(DICTS.ms).filter((k) => !k.startsWith('_') && !(k in DICTS.en));
    expect(missing).toEqual([]);
  });
});

describe('home v2 copy', () => {
  it('has a level.<name> key in MS and EN for every level', async () => {
    const { BALANCE } = await import('../../engine/balance');
    for (const [name] of BALANCE.levels) {
      expect(typeof (ms as Record<string, unknown>)[`level.${name}`], name).toBe('string');
      expect(typeof (en as Record<string, unknown>)[`level.${name}`], name).toBe('string');
    }
    expect(translate('ms', 'level.Pemula')).toBe('Pemula');
  });

  it('has the mule and frozen enforcement steps (M5; sources in docs/verification-log.md)', () => {
    for (const k of ['akibat.mule.3.text', 'akibat.mule.4.text', 'akibat.frozen.1.text', 'akibat.frozen.4.text']) {
      expect(typeof (ms as Record<string, unknown>)[k]).toBe('string');
    }
  });
});
