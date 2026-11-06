import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONTENT_FILES, CalcPresetsFileSchema } from './schemas';

const file = fileURLToPath(new URL('../../../content/calc-presets.json', import.meta.url));
const presets = JSON.parse(readFileSync(file, 'utf8')) as unknown;

describe('calc-presets.json schema (Task 18)', () => {
  it('is registered in CONTENT_FILES', () => {
    expect(CONTENT_FILES['calc-presets.json']).toBe(CalcPresetsFileSchema);
  });

  it('the shipped file is valid and has the three presets', () => {
    const list = CalcPresetsFileSchema.parse(presets);
    expect(list.map((p) => p.id).sort()).toEqual(['bayar1000', 'labur50', 'naga30w']);
    const by = Object.fromEntries(list.map((p) => [p.id, p]));
    expect(by.naga30w).toMatchObject({ tab: 'pulangan', inputs: { promised: 30, period: 'minggu' } });
    expect(by.bayar1000).toMatchObject({ tab: 'kos', inputs: { amount: 1000, flat: 18, months: 12 } });
    expect(by.labur50).toMatchObject({ tab: 'masa', inputs: { monthly: 50, rate: 5, startAge: 19, endAge: 30 } });
  });

  it('rejects duplicate ids, a bad tab/inputs pairing and negative numbers', () => {
    const ok = { id: 'a', tab: 'pulangan', label: { ms: 'x' }, inputs: { promised: 5, period: 'bulan' } };
    expect(CalcPresetsFileSchema.safeParse([ok, ok]).success).toBe(false);
    expect(CalcPresetsFileSchema.safeParse([{ ...ok, tab: 'kos' }]).success).toBe(false);
    expect(CalcPresetsFileSchema.safeParse([{ ...ok, inputs: { promised: -1, period: 'bulan' } }]).success).toBe(false);
    expect(CalcPresetsFileSchema.safeParse([{ ...ok, inputs: { promised: 1, period: 'dekad' } }]).success).toBe(false);
    expect(CalcPresetsFileSchema.safeParse([{ id: 'k', tab: 'kos', label: { ms: 'x' }, inputs: { amount: 1, months: 3 } }]).success).toBe(false);
    expect(CalcPresetsFileSchema.safeParse([{ id: 'k', tab: 'kos', label: { ms: 'x' }, inputs: { amount: 1, months: 3, flat: 1, fee: 2 } }]).success).toBe(false);
    expect(CalcPresetsFileSchema.safeParse([ok]).success).toBe(true);
  });
});
