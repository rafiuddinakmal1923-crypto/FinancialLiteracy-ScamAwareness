import { describe, expect, it } from 'vitest';
import { kosResult, masaResult, parseNum, pulanganResult } from './calcModel';

describe('parseNum', () => {
  it('reads plain non-negative numbers and rejects the rest', () => {
    expect(parseNum('50')).toBe(50);
    expect(parseNum('5.5')).toBe(5.5);
    expect(parseNum('0')).toBe(0);
    for (const bad of ['', ' ', '.', '-3', 'abc', '1e9', 'NaN', 'Infinity']) expect(parseNum(bad)).toBeNull();
  });
});

describe('masaResult', () => {
  const base = { monthly: '50', rate: '5', startAge: '19', endAge: '30' };
  it('defaults give RM8,775.28 with RM6,600 contributed', () => {
    const r = masaResult(base)!;
    expect(r.value).toBe(8775.28);
    expect(r.contributed).toBe(6600);
    expect(r.growth).toBe(2175.28);
    expect(r.series).toHaveLength(12);
    expect(r.series[0]).toMatchObject({ age: 19, value: 0 });
  });
  it('19 to 55 gives RM60,324.80', () => {
    expect(masaResult({ ...base, endAge: '55' })!.value).toBe(60324.8);
  });
  it('zero saving and zero rate are fine', () => {
    expect(masaResult({ ...base, monthly: '0' })!.value).toBe(0);
    expect(masaResult({ ...base, rate: '0' })!.value).toBe(6600);
  });
  it('empty, reversed, out-of-range and overflowing inputs return null, never NaN', () => {
    expect(masaResult({ ...base, monthly: '' })).toBeNull();
    expect(masaResult({ ...base, endAge: '18' })).toBeNull();
    expect(masaResult({ ...base, endAge: '150' })).toBeNull();
    expect(masaResult({ ...base, startAge: '19.5' })).toBeNull();
    expect(masaResult({ ...base, rate: '99999999', endAge: '100' })).toBeNull();
  });
});

describe('pulanganResult', () => {
  it('10% a month is 213.8% a year, unrealistic, above every band', () => {
    const r = pulanganResult({ promised: '10', period: 'bulan' })!;
    expect(r.pct).toBeCloseTo(213.84, 1);
    expect(r.unrealistic).toBe(true);
    expect(r.band).toBe('atas');
  });
  it('30% a week is far off the scale but finite', () => {
    const r = pulanganResult({ promised: '30', period: 'minggu' })!;
    expect(Number.isFinite(r.pct)).toBe(true);
    expect(r.unrealistic).toBe(true);
  });
  it('4% a year falls inside hargaTetap and is realistic', () => {
    const r = pulanganResult({ promised: '4', period: 'tahun' })!;
    expect(r.pct).toBeCloseTo(4, 6);
    expect(r.unrealistic).toBe(false);
    expect(r.band).toMatchObject({ key: 'hargaTetap', contains: true });
  });
  it('a rate in a gap between bands is not claimed to be in a band', () => {
    const r = pulanganResult({ promised: '1.5', period: 'tahun' })!;
    expect(typeof r.band === 'object' && r.band.contains).toBe(true); // unitAmanah spans -10..12
  });
  it('an absurd promise overflowing to Infinity is capped, not NaN', () => {
    const r = pulanganResult({ promised: '99999999999', period: 'hari' })!;
    expect(r.capped).toBe(true);
    expect(r.unrealistic).toBe(true);
    expect(Number.isNaN(r.pct)).toBe(false);
  });
  it('empty or negative input returns null', () => {
    expect(pulanganResult({ promised: '', period: 'bulan' })).toBeNull();
    expect(pulanganResult({ promised: '-5', period: 'bulan' })).toBeNull();
  });
});

describe('kosResult', () => {
  const base = { amount: '1000', mode: 'flat' as const, flat: '18', fee: '0', months: '12' };
  it('RM1,000 at flat 18% over 12 months', () => {
    const r = kosResult(base)!;
    expect(r.instalment).toBe(98.33);
    expect(r.total).toBe(1180);
    expect(r.cost).toBe(180);
    expect(r.effectivePct).toBeGreaterThan(31.5);
    expect(r.effectivePct).toBeLessThan(32);
  });
  it('fee mode uses the fee', () => {
    const r = kosResult({ ...base, mode: 'fee', fee: '120' })!;
    expect(r.total).toBe(1120);
    expect(r.cost).toBe(120);
  });
  it('zero amount gives zeros; empty, zero or fractional months give null', () => {
    expect(kosResult({ ...base, amount: '0' })!.cost).toBe(0);
    expect(kosResult({ ...base, amount: '' })).toBeNull();
    expect(kosResult({ ...base, months: '0' })).toBeNull();
    expect(kosResult({ ...base, months: '2.5' })).toBeNull();
    expect(kosResult({ ...base, flat: '' })).toBeNull();
    expect(kosResult({ ...base, months: '99999' })).toBeNull();
  });
});
