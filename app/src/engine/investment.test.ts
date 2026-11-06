// Task 19: the real-vs-fake investment scenarios and the costly-BNPL scenario compile and teach what they should.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { enumeratePaths, compileScenario, walkScenario } from './compile';
import { parseLineTags } from './tags';

const load = (id: string) => compileScenario(
  readFileSync(new URL(`../../../content/scenarios/${id}.ink`, import.meta.url), 'utf8'), `${id}.ink`,
);
const presets = JSON.parse(readFileSync(new URL('../../../content/calc-presets.json', import.meta.url), 'utf8')) as { id: string }[];

/** The ui:calc directives a scenario can open, from every path. */
function calcDirectives(json: string): { tab: string; preset: string }[] {
  const out: { tab: string; preset: string }[] = [];
  for (const p of walkScenario(json)) {
    for (const l of p.lines) {
      const ui = parseLineTags(l.tags).ui;
      if (ui?.kind === 'calc') out.push({ tab: ui.tab, preset: ui.preset });
    }
  }
  return out;
}
/** Effects on the last line of every path with this outcome. */
function endEffects(json: string, outcome: string) {
  return walkScenario(json)
    .filter((p) => parseLineTags(p.lines[p.lines.length - 1]!.tags).outcome === outcome)
    .map((p) => parseLineTags(p.lines[p.lines.length - 1]!.tags).effects);
}

describe('kawan_labur (real unit trust, W5)', () => {
  const c = load('kawan_labur');
  const paths = enumeratePaths(c.json);

  it('is a finance scenario about risiko and semak, with a friendly senior', () => {
    expect(c.meta).toMatchObject({ id: 'kawan_labur', type: 'finance', family: 'investment' });
    expect(c.meta.concepts).toEqual(['risiko', 'semak']);
    expect(c.meta.contact).toBeTruthy();
  });

  it('has right (untung, safe) and wrong (rugi) paths; every path ends in an outcome', () => {
    expect(paths.filter((p) => p.outcome === undefined)).toEqual([]);
    const got = new Set(paths.map((p) => p.outcome));
    expect(got.has('untung')).toBe(true);
    expect(got.has('safe')).toBe(true);
    expect(got.has('rugi')).toBe(true);
  });

  it('untung moves RM100 from Duit into Dana Ekuiti Cempaka', () => {
    const fx = endEffects(c.json, 'untung');
    expect(fx.length).toBeGreaterThan(0);
    for (const e of fx) {
      expect(e).toContainEqual({ kind: 'labur', product: 'ekuiti', delta: 100 });
      expect(e).toContainEqual({ kind: 'duit', delta: -100 });
    }
  });

  it('every rugi path really costs money (a negative Duit effect, no free lunch)', () => {
    for (const e of endEffects(c.json, 'rugi')) {
      const duit = e.filter((x) => x.kind === 'duit').reduce((s, x) => s + (x as { delta: number }).delta, 0);
      expect(duit).toBeLessThan(0);
    }
  });
});

describe('crypto_naga (fake crypto, W8)', () => {
  const c = load('crypto_naga');
  const paths = enumeratePaths(c.json);

  it('is a W8 investment scam flagged for greed, social and urgency', () => {
    expect(c.meta).toMatchObject({ id: 'crypto_naga', type: 'scam', family: 'investment' });
    expect(c.meta.tactics).toEqual(['greed', 'social', 'urgency']);
    expect(c.meta.concepts).toEqual(['risiko', 'semak']);
    const by = Object.fromEntries(c.flags.map((f) => [f.tactic, f.phrase]));
    expect(by).toMatchObject({ greed: '30% seminggu', social: '500 pelajar dah join', urgency: 'slot tutup malam ni' });
  });

  it('has a safe path and a scammed path, and only scam outcomes', () => {
    const got = new Set(paths.map((p) => p.outcome));
    expect(got.has('safe')).toBe(true);
    expect(got.has('scammed')).toBe(true);
    for (const o of got) expect(['scammed', 'mule', 'frozen', 'safe']).toContain(o);
  });

  it('Kira dulu opens Semak Pulangan with naga30w, and the RM500 deposit costs RM500', () => {
    const calc = calcDirectives(c.json);
    expect(calc.length).toBeGreaterThan(0);
    for (const d of calc) expect(d).toEqual({ tab: 'pulangan', preset: 'naga30w' });
    for (const e of endEffects(c.json, 'scammed')) expect(e).toContainEqual({ kind: 'duit', delta: -500 });
  });

  it('after the calculator the player can still deposit or refuse', () => {
    const afterCalc = walkScenario(c.json).filter((p) => p.lines.some((l) => parseLineTags(l.tags).ui?.kind === 'calc'));
    const outcomes = new Set(afterCalc.map((p) => parseLineTags(p.lines[p.lines.length - 1]!.tags).outcome));
    expect(outcomes.has('scammed')).toBe(true);
    expect(outcomes.has('safe')).toBe(true);
  });
});

describe('bayar_nanti (legal but costly BNPL, W9)', () => {
  const c = load('bayar_nanti');
  const paths = enumeratePaths(c.json);

  it('is a finance loan scenario about hutang with no scam tactics', () => {
    expect(c.meta).toMatchObject({ id: 'bayar_nanti', type: 'finance', family: 'loan' });
    expect(c.meta.concepts).toEqual(['hutang']);
    expect(c.meta.tactics).toEqual([]);
    expect(c.flags).toEqual([]);
  });

  it('has a hutang path and an untung path; taking it unexamined costs the first instalment and Tekanan', () => {
    const got = new Set(paths.map((p) => p.outcome));
    expect(got.has('hutang')).toBe(true);
    expect(got.has('untung')).toBe(true);
    for (const e of endEffects(c.json, 'hutang')) {
      expect(e).toContainEqual({ kind: 'duit', delta: -100 });
      expect(e).toContainEqual({ kind: 'tekanan', delta: 10 });
    }
  });

  it('Kira dulu opens Kos Sebenar with bayar1000', () => {
    const calc = calcDirectives(c.json);
    expect(calc.length).toBeGreaterThan(0);
    for (const d of calc) expect(d).toEqual({ tab: 'kos', preset: 'bayar1000' });
  });
});

describe('presets used by the new scenarios exist', () => {
  it.each(['crypto_naga', 'bayar_nanti', 'kawan_labur'])('%s', (id) => {
    for (const d of calcDirectives(load(id).json)) expect(presets.map((p) => p.id)).toContain(d.preset);
  });
});
