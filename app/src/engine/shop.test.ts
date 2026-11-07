import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { initialMeters } from './meters';
import { parseContent, SemesterFileSchema } from './schemas';
import { buyItem, itemPrice, type ShopState } from './shop';
import { applyWeekIntro, type WeekDef } from './week';

const fresh = (duit = 1000, simpanan = 0): ShopState => ({ meters: { ...initialMeters(), duit, simpanan }, week: 2, purchases: [] });
const bought = (r: ReturnType<typeof buyItem>): ShopState => {
  if ('error' in r) throw new Error(r.error);
  return r.state;
};

describe('itemPrice', () => {
  it('comes from balance.ts', () => {
    expect(itemPrice('basikal')).toBe(150);
    expect(itemPrice('tiada')).toBeNull();
  });

  it('keeps the cash items under one part-time pay (D37)', () => {
    const cash = ['snek', 'konsert', 'earfon', 'basikal', 'buku'].map((id) => itemPrice(id) ?? 0);
    expect(cash.reduce((a, b) => a + b, 0)).toBe(383);
  });
});

describe('buyItem', () => {
  it('pays from Duit and records the item and week', () => {
    const s = bought(buyItem(fresh(), 'basikal'));
    expect(s.meters.duit).toBe(850);
    expect(s.purchases).toEqual([{ item: 'basikal', week: 2 }]);
  });

  it('refuses when Duit is short, changing nothing', () => {
    expect(buyItem(fresh(100), 'basikal')).toEqual({ error: 'insufficient' });
  });

  it('can spend the last ringgit', () => {
    expect(bought(buyItem(fresh(150), 'basikal')).meters.duit).toBe(0);
  });

  it('keeps Simpanan within Duit', () => {
    expect(bought(buyItem(fresh(200, 200), 'basikal')).meters.simpanan).toBe(50);
  });

  it('refuses an unknown item', () => {
    expect(buyItem(fresh(), 'tiada')).toEqual({ error: 'unknown-item' });
  });

  it('refuses an item already bought', () => {
    expect(buyItem(bought(buyItem(fresh(), 'buku')), 'buku')).toEqual({ error: 'owned' });
  });

  it('takes nothing up front for an instalment item, even with little Duit', () => {
    const s = bought(buyItem(fresh(10), 'telefon'));
    expect(s.meters.duit).toBe(10);
    expect(s.purchases).toEqual([{ item: 'telefon', week: 2 }]);
  });
});

describe('whole semesters (D37)', () => {
  const file = readFileSync(new URL('../../../content/semester.json', import.meta.url), 'utf8');
  const weeks: WeekDef[] = parseContent(SemesterFileSchema, JSON.parse(file), 'semester.json').weeks;

  function play(wanted: string[]): number[] {
    let s: ShopState = { meters: initialMeters(), week: 0, purchases: [] };
    for (const id of wanted) s = bought(buyItem(s, id));
    const duit: number[] = [];
    for (const def of weeks) {
      s = { ...s, week: def.week, meters: applyWeekIntro(s.meters, def, BALANCE, s.purchases).meters };
      duit.push(s.meters.duit);
    }
    return duit;
  }

  it('buying nothing reaches week 12 with Duit never below RM0', () => {
    const duit = play([]);
    expect(duit).toHaveLength(BALANCE.semesterWeeks);
    expect(Math.min(...duit)).toBeGreaterThanOrEqual(0);
  });

  it('buying everything reaches week 12 with Duit never below RM0', () => {
    const duit = play(Object.keys(BALANCE.kedai.prices));
    expect(duit).toHaveLength(BALANCE.semesterWeeks);
    expect(Math.min(...duit)).toBeGreaterThanOrEqual(0);
  });
});
