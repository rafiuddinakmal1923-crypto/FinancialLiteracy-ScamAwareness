import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { initialMeters, netWorth } from './meters';
import { round2 } from './money';
import { CONTENT_FILES, parseContent, SemesterFileSchema } from './schemas';
import { applyBudget, applyWeekIntro, moveLabur, weekCosts, type WeekDef } from './week';

const wk = (week: number, costs: { label: string; amount: number }[] = []): WeekDef => ({
  week, scenario: null, context: { ms: 'x' }, costs: costs.map((c) => ({ label: { ms: c.label }, amount: c.amount })),
});
const base = () => ({ ...initialMeters(), duit: 1000, simpanan: 500, tekanan: 20 });

describe('applyWeekIntro', () => {
  it('deducts costs and reports them', () => {
    const r = applyWeekIntro(base(), wk(1, [{ label: 'Makan', amount: 80 }, { label: 'Pengangkutan', amount: 20 }]));
    expect(r.meters.duit).toBe(900);
    expect(r.costs).toEqual([{ label: 'Makan', amount: 80 }, { label: 'Pengangkutan', amount: 20 }]);
    expect(r.income).toBe(0);
  });
  it('pays RM400 only in weeks 4, 8, 12', () => {
    for (let w = 1; w <= 12; w++) {
      const r = applyWeekIntro(base(), wk(w));
      expect(r.income).toBe([4, 8, 12].includes(w) ? 400 : 0);
      expect(r.meters.duit).toBe(1000 + r.income);
    }
  });
  it('simpanan below 100 adds tekanan +10', () => {
    const r = applyWeekIntro({ ...base(), simpanan: 50 }, wk(1));
    expect(r.meters.tekanan).toBe(30);
    expect(applyWeekIntro(base(), wk(1)).meters.tekanan).toBe(20);
  });
  it('desperate at tekanan 60 after the update', () => {
    expect(applyWeekIntro({ ...base(), simpanan: 0, tekanan: 50 }, wk(1)).desperate).toBe(true);
    expect(applyWeekIntro({ ...base(), simpanan: 0, tekanan: 40 }, wk(1)).desperate).toBe(false);
  });
  it('costs keep duit >= 0 and simpanan <= duit', () => {
    const r = applyWeekIntro({ ...base(), duit: 100, simpanan: 100 }, wk(3, [{ label: 'Yuran', amount: 600 }]));
    expect(r.meters.duit).toBe(0);
    expect(r.meters.simpanan).toBe(0);
  });
  it('amanah grows 4%/52 per week to the sen', () => {
    const m = { ...base(), labur: { amanah: 500, ekuiti: 0 } };
    const r = applyWeekIntro(m, wk(1));
    expect(r.laburGrowth.amanah).toBe(0.38);
    expect(r.meters.labur.amanah).toBe(500.38);
  });
  it('ekuiti follows the path incl. -6% at week 8', () => {
    const m = { ...base(), labur: { amanah: 0, ekuiti: 1000 } };
    expect(applyWeekIntro(m, wk(1)).laburGrowth.ekuiti).toBe(8);
    const r = applyWeekIntro(m, wk(8));
    expect(r.laburGrowth.ekuiti).toBe(-60);
    expect(r.meters.labur.ekuiti).toBe(940);
  });
  it('does not mutate its input', () => {
    const m = base();
    const copy = structuredClone(m);
    applyWeekIntro(m, wk(4, [{ label: 'a', amount: 10 }]));
    expect(m).toEqual(copy);
  });
});

describe('applyBudget', () => {
  it('50/30/20 -> simpanan 400 of 2000', () => {
    const r = applyBudget(initialMeters(), { needs: 50, wants: 30, savings: 20 });
    expect(r.simpanan).toBe(400);
    expect(r.duit).toBe(2000);
  });
  it('rounds to RM10', () => {
    const r = applyBudget({ ...initialMeters(), duit: 1234 }, { needs: 50, wants: 30, savings: 20 });
    expect(r.simpanan).toBe(250);
  });
  it('rejects a bad split', () => {
    expect(() => applyBudget(initialMeters(), { needs: 50, wants: 30, savings: 30 })).toThrow(RangeError);
    expect(() => applyBudget(initialMeters(), { needs: 110, wants: -10, savings: 0 })).toThrow(RangeError);
  });
});

describe('moveLabur', () => {
  it('outside a week intro returns not-week-intro', () => {
    expect(moveLabur(base(), 'amanah', 100, false)).toEqual({ error: 'not-week-intro' });
  });
  it('a move never changes net worth', () => {
    const m = { ...base(), labur: { amanah: 200, ekuiti: 100 } };
    for (const [p, d] of [['amanah', 300], ['ekuiti', 900], ['amanah', -200], ['ekuiti', -100]] as const) {
      const r = moveLabur(m, p, d, true);
      if ('error' in r) throw new Error(r.error);
      expect(netWorth(r.meters)).toBe(netWorth(m));
    }
  });
  it('moves in from duit and back out', () => {
    const r = moveLabur(base(), 'ekuiti', 200, true);
    if ('error' in r) throw new Error(r.error);
    expect(r.meters.duit).toBe(800);
    expect(r.meters.labur.ekuiti).toBe(200);
    const back = moveLabur(r.meters, 'ekuiti', -50, true);
    if ('error' in back) throw new Error(back.error);
    expect(back.meters.duit).toBe(850);
    expect(back.meters.labur.ekuiti).toBe(150);
  });
  it('insufficient funds', () => {
    expect(moveLabur(base(), 'amanah', 5000, true)).toEqual({ error: 'insufficient' });
    expect(moveLabur(base(), 'amanah', -1, true)).toEqual({ error: 'insufficient' });
  });
  it('zero delta is a no-op', () => {
    const m = base();
    expect(moveLabur(m, 'amanah', 0, true)).toEqual({ meters: m });
  });
  it('move in with simpanan 60 adds tekanan +5 and tip', () => {
    const r = moveLabur({ ...base(), simpanan: 60 }, 'amanah', 100, true);
    if ('error' in r) throw new Error(r.error);
    expect(r.tip).toBe('kecemasan');
    expect(r.meters.tekanan).toBe(25);
  });
  it('no tip at the emergency target; moving out never adds tekanan', () => {
    const ok = moveLabur({ ...base(), simpanan: 300 }, 'amanah', 100, true);
    if ('error' in ok) throw new Error(ok.error);
    expect(ok.tip).toBeUndefined();
    const out = moveLabur({ ...base(), simpanan: 0, labur: { amanah: 100, ekuiti: 0 } }, 'amanah', -100, true);
    if ('error' in out) throw new Error(out.error);
    expect(out.tip).toBeUndefined();
    expect(out.meters.tekanan).toBe(20);
  });
  it('simpanan drops to duit when the move leaves duit below it', () => {
    const r = moveLabur({ ...base(), duit: 500, simpanan: 400 }, 'amanah', 300, true);
    if ('error' in r) throw new Error(r.error);
    expect(r.meters.duit).toBe(200);
    expect(r.meters.simpanan).toBe(200);
  });
});

describe('sen grid', () => {
  it('12 week intros keep every balance on the sen grid', () => {
    let m = { ...base(), duit: 1000.55, simpanan: 100.25, labur: { amanah: 500, ekuiti: 333.33 } };
    const grid = (x: number) => { expect(Number.isInteger(Math.round(x * 100))).toBe(true); expect(x).toBe(round2(x)); };
    for (let w = 1; w <= 12; w++) {
      m = applyWeekIntro(m, wk(w, [{ label: 'Makan', amount: 80.1 }])).meters;
      for (const x of [m.duit, m.simpanan, m.labur.amanah, m.labur.ekuiti]) grid(x);
    }
  });
  it('sen-valued moves keep net worth identical', () => {
    const m = { ...base(), duit: 1234.56, simpanan: 0, labur: { amanah: 100.01, ekuiti: 0 } };
    const a = moveLabur(m, 'amanah', 33.33, true);
    if ('error' in a) throw new Error(a.error);
    const b = moveLabur(a.meters, 'amanah', -0.07, true);
    if ('error' in b) throw new Error(b.error);
    expect(netWorth(a.meters)).toBe(netWorth(m));
    expect(netWorth(b.meters)).toBe(netWorth(m));
  });
});

describe('semester.json', () => {
  const raw = JSON.parse(readFileSync(new URL('../../../content/semester.json', import.meta.url), 'utf8'));
  const sem = parseContent(SemesterFileSchema, raw, 'semester.json');
  it('has 12 weeks in order, 10 scenario weeks, 4 scams (D20)', () => {
    expect(sem.weeks.map((w) => w.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const ids = sem.weeks.map((w) => w.scenario).filter((s): s is string => s !== null);
    expect(ids).toHaveLength(10);
    expect(sem.weeks[6]!.scenario).toBeNull();
    expect(sem.weeks[11]!.scenario).toBeNull();
    const scams = ['kerja_sambilan', 'sewa_akaun', 'crypto_naga', 'panggilan_mahkamah'];
    expect(ids.filter((i) => scams.includes(i))).toHaveLength(4);
    expect(ids).toEqual(['kerja_sambilan', 'dompet_minggu0', 'sewa_akaun', 'gaji_pertama', 'kawan_labur', 'alert_bankku', 'crypto_naga', 'bayar_nanti', 'buku_terpakai', 'panggilan_mahkamah']);
  });
  it('has the specified costs', () => {
    const cost = (w: number, label: string) => sem.weeks[w - 1]!.costs.find((c) => c.label.ms === label)?.amount;
    for (const w of sem.weeks) {
      expect(cost(w.week, 'Makan')).toBe(80);
      expect(cost(w.week, 'Pengangkutan')).toBe(20);
    }
    expect(cost(1, 'Bil telefon')).toBe(30);
    expect(cost(3, 'Yuran asrama')).toBe(600);
    expect(cost(5, 'Baiki laptop')).toBe(150);
    expect(cost(9, 'Buku rujukan')).toBe(120);
    expect(sem.weeks[6]!.context.ms).toContain('Mesin Masa');
  });
  it('is registered in CONTENT_FILES', () => {
    expect(CONTENT_FILES['semester.json']).toBe(SemesterFileSchema);
    expect(BALANCE.incomeWeeks).toEqual([4, 8, 12]);
  });
});

describe('weekCosts with purchases (A3)', () => {
  const transport = (week: number): WeekDef => ({
    week, scenario: null, context: { ms: 'x' },
    costs: [{ label: { ms: 'Makan' }, amount: 80 }, { label: { ms: 'Pengangkutan' }, amount: 20, kind: 'transport' }],
  });

  it('lowers the transport cost from the week after the bicycle is bought', () => {
    expect(weekCosts(transport(5), [{ item: 'basikal', week: 4 }]).map((c) => c.amount)).toEqual([80, 10]);
  });

  it('does not change the week it was bought in', () => {
    expect(weekCosts(transport(4), [{ item: 'basikal', week: 4 }]).map((c) => c.amount)).toEqual([80, 20]);
  });

  it('never makes a cost negative', () => {
    const cheap: WeekDef = { week: 5, scenario: null, context: { ms: 'x' }, costs: [{ label: { ms: 'P' }, amount: 5, kind: 'transport' }] };
    expect(weekCosts(cheap, [{ item: 'basikal', week: 1 }]).map((c) => c.amount)).toEqual([0]);
  });

  it('adds the instalment in weeks 4, 8 and 12 only, after the purchase', () => {
    const p = [{ item: 'telefon', week: 5 }];
    expect(weekCosts(wk(4), p)).toEqual([]);
    expect(weekCosts(wk(7), p)).toEqual([]);
    expect(weekCosts(wk(8), p)).toEqual([{ labelKey: 'bankku.tx.instalment', amount: BALANCE.kedai.instalment.telefon.monthly }]);
    expect(weekCosts(wk(12), p)).toHaveLength(1);
  });

  it('applyWeekIntro pays the changed costs', () => {
    const r = applyWeekIntro(base(), transport(5), BALANCE, [{ item: 'basikal', week: 1 }]);
    expect(r.meters.duit).toBe(910);
    expect(r.costs.map((c) => c.amount)).toEqual([80, 10]);
  });

  it('applyWeekIntro reports the instalment by its i18n key', () => {
    const r = applyWeekIntro(base(), wk(8), BALANCE, [{ item: 'telefon', week: 1 }]);
    expect(r.costs).toEqual([{ label: 'bankku.tx.instalment', amount: 110 }]);
  });
});
