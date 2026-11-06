import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileScenario, enumeratePaths } from './compile';
import { ContentError } from './schemas';

const kerjaSambilan = readFileSync(
  new URL('../../../content/scenarios/kerja_sambilan.ink', import.meta.url),
  'utf8',
);

function scam(body: string, tactics = 'greed'): string {
  return [
    '# id:t1',
    '# type:scam',
    '# family:job',
    `# tactics:${tactics}`,
    '# contact:Encik X',
    body,
  ].join('\n');
}

describe('compileScenario', () => {
  it('compiles kerja_sambilan', () => {
    const c = compileScenario(kerjaSambilan, 'kerja_sambilan.ink');
    expect(c.meta.id).toBe('kerja_sambilan');
    expect(c.meta.family).toBe('job');
    expect(c.meta.tactics).toEqual(['greed', 'urgency', 'payfirst']);
    expect(c.meta.apaPatut.length).toBeGreaterThanOrEqual(2);
    expect(c.meta.hint).toBeTruthy();
    expect(c.flags.length).toBeGreaterThanOrEqual(3);
    expect(typeof c.json).toBe('string');
  });

  it('every path ends in an outcome', () => {
    const c = compileScenario(kerjaSambilan, 'kerja_sambilan.ink');
    const paths = enumeratePaths(c.json);
    expect(paths.length).toBeGreaterThan(1);
    expect(paths.filter((p) => p.outcome === undefined)).toEqual([]);
    expect(paths.some((p) => p.outcome === 'safe')).toBe(true);
    expect(paths.some((p) => p.outcome === 'scammed')).toBe(true);
  });

  it('rejects a flag phrase missing from its line', () => {
    const src = scam(`Encik X: Kerja senang, RM300 sehari! # flag:greed:RM500 sejam
* [Ok]
    Encik X: Bagus. # outcome:scammed
    -> END
* [Tak nak]
    Encik X: Ok bye. # outcome:safe
    -> END`);
    expect(() => compileScenario(src, 't1.ink')).toThrow(ContentError);
    expect(() => compileScenario(src, 't1.ink')).toThrow(/RM500 sejam/);
  });

  it('rejects a scam whose listed tactics are not all flagged', () => {
    const src = scam(`Encik X: Kerja senang, RM300 sehari! # flag:greed:RM300 sehari
* [Ok]
    Encik X: Bagus. # outcome:scammed
    -> END
* [Tak nak]
    Encik X: Ok bye. # outcome:safe
    -> END`, 'greed,urgency');
    expect(() => compileScenario(src, 't1.ink')).toThrow(ContentError);
    expect(() => compileScenario(src, 't1.ink')).toThrow(/urgency/);
  });

  it('rejects a scam without a safe path', () => {
    const src = scam(`Encik X: Kerja senang, RM300 sehari! # flag:greed:RM300 sehari
* [Ok]
    Encik X: Bagus. # outcome:scammed
    -> END`);
    expect(() => compileScenario(src, 't1.ink')).toThrow(/safe/);
  });

  it('rejects a path with no outcome', () => {
    const src = scam(`Encik X: Kerja senang, RM300 sehari! # flag:greed:RM300 sehari
* [Ok]
    Encik X: Bagus.
    -> END
* [Tak nak]
    Encik X: Ok bye. # outcome:safe
    -> END`);
    expect(() => compileScenario(src, 't1.ink')).toThrow(/outcome/);
  });

  it('rejects an outcome that is not on the last line', () => {
    const src = scam(`Encik X: Kerja senang, RM300 sehari! # flag:greed:RM300 sehari
* [Ok]
    Encik X: Bagus. # outcome:scammed
    Encik X: Terima kasih.
    -> END
* [Tak nak]
    Encik X: Ok bye. # outcome:safe
    -> END`);
    expect(() => compileScenario(src, 't1.ink')).toThrow(/last line/);
  });

  it('rejects a legit scenario without both safe and curiga paths', () => {
    const src = `# id:t2
# type:legit
# family:job
# tactics:
# contact:Kafe UCR
Kafe UCR: Ada kerja part-time di kafe kampus. Temuduga di kafe, Isnin 10 pagi.
* [Saya datang]
    Kafe UCR: Jumpa Isnin! # outcome:safe
    -> END
* [Saya datang juga]
    Kafe UCR: Ok jumpa! # outcome:safe
    -> END`;
    expect(() => compileScenario(src, 't2.ink')).toThrow(ContentError);
    expect(() => compileScenario(src, 't2.ink')).toThrow(/curiga/);
  });

  it('rejects ink that does not compile', () => {
    const src = scam('Encik X: hai\n-> knot_tiada');
    expect(() => compileScenario(src, 't1.ink')).toThrow(ContentError);
  });

  it('rejects an id that does not match the file name', () => {
    const src = scam(`Encik X: Kerja senang, RM300 sehari! # flag:greed:RM300 sehari
* [Tak nak]
    Encik X: Ok bye. # outcome:safe
    -> END`);
    expect(() => compileScenario(src, 'lain.ink')).toThrow(/lain/);
  });

  it('strips a UTF-8 BOM before compiling', () => {
    const c = compileScenario('﻿' + kerjaSambilan, 'kerja_sambilan.ink');
    expect(c.meta.id).toBe('kerja_sambilan');
  });
});

describe('enumeratePaths', () => {
  it('fails when there are more paths than the limit', () => {
    const c = compileScenario(kerjaSambilan, 'kerja_sambilan.ink');
    expect(() => enumeratePaths(c.json, 1)).toThrow(/too many paths/);
  });
});
