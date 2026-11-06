import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileScenario, enumeratePaths } from './compile';
import { ContentError } from './schemas';

const sewaAkaun = readFileSync(
  new URL('../../../content/scenarios/sewa_akaun.ink', import.meta.url),
  'utf8',
);

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

function finance(body: string, extra: string[] = []): string {
  return ['# id:f1', '# type:finance', '# family:budget', '# concepts:bajet,kecemasan', '# contact:Kak Long', ...extra, body].join('\n');
}

describe('compileScenario: finance and the new outcomes (D23, D29)', () => {
  it('compiles a finance scenario with a right and a wrong path, no tactics', () => {
    const c = compileScenario(finance(`Kak Long: Duit biasiswa dah masuk? Nak bahagi macam mana?
* [Asingkan simpanan dulu]
    Kak Long: Bagus! # outcome:untung
    -> END
* [Belanja dulu, simpan kemudian]
    Kak Long: Hmm, hujung bulan nanti susah. # outcome:rugi
    -> END`), 'f1.ink');
    expect(c.meta.type).toBe('finance');
    expect(c.meta.concepts).toEqual(['bajet', 'kecemasan']);
    expect(c.meta.tactics).toEqual([]);
    expect(enumeratePaths(c.json).map((p) => p.outcome)).toEqual(['untung', 'rugi']);
  });

  it('accepts safe as the right path and hutang or curiga as the wrong path', () => {
    for (const [right, wrong] of [['safe', 'hutang'], ['untung', 'curiga']]) {
      const src = finance(`Kak Long: Pilih.
* [A]
    Kak Long: A. # outcome:${right}
    -> END
* [B]
    Kak Long: B. # outcome:${wrong}
    -> END`);
      expect(() => compileScenario(src, 'f1.ink'), `${right}/${wrong}`).not.toThrow();
    }
  });

  it('rejects a finance scenario without a wrong path', () => {
    const src = finance(`Kak Long: Pilih.
* [A]
    Kak Long: A. # outcome:untung
    -> END
* [B]
    Kak Long: B. # outcome:safe
    -> END`);
    expect(() => compileScenario(src, 'f1.ink')).toThrow(ContentError);
    expect(() => compileScenario(src, 'f1.ink')).toThrow(/wrong/);
  });

  it('rejects a finance scenario without a right path', () => {
    const src = finance(`Kak Long: Pilih.
* [A]
    Kak Long: A. # outcome:rugi
    -> END
* [B]
    Kak Long: B. # outcome:hutang
    -> END`);
    expect(() => compileScenario(src, 'f1.ink')).toThrow(/right/);
  });

  it('rejects a finance scenario with a scam outcome', () => {
    const src = finance(`Kak Long: Pilih.
* [A]
    Kak Long: A. # outcome:untung
    -> END
* [B]
    Kak Long: B. # outcome:scammed
    -> END`);
    expect(() => compileScenario(src, 'f1.ink')).toThrow(/scammed/);
  });

  it('rejects untung, rugi or hutang in a scam scenario', () => {
    for (const o of ['untung', 'rugi', 'hutang']) {
      const src = scam(`Encik X: Kerja senang, RM300 sehari! # flag:greed:RM300 sehari
* [Ok]
    Encik X: Bagus. # outcome:${o}
    -> END
* [Tak nak]
    Encik X: Ok bye. # outcome:safe
    -> END`);
      expect(() => compileScenario(src, 't1.ink'), o).toThrow(new RegExp(o));
    }
  });

  it('rejects curiga in a scam scenario and rugi in a legit scenario', () => {
    const scamSrc = scam(`Encik X: Kerja senang, RM300 sehari! # flag:greed:RM300 sehari
* [Hmm]
    Encik X: Ok. # outcome:curiga
    -> END
* [Tak nak]
    Encik X: Ok bye. # outcome:safe
    -> END`);
    expect(() => compileScenario(scamSrc, 't1.ink')).toThrow(/curiga/);
    const legitSrc = `# id:t2
# type:legit
# family:bank
# tactics:
# contact:BankKu
BankKu: Transaksi RM89.90. Bukan anda? Hubungi nombor di belakang kad.
* [Ok]
    BankKu: Terima kasih. # outcome:safe
    -> END
* [Abaikan]
    BankKu: Ok. # outcome:curiga
    -> END
* [Lain]
    BankKu: Hmm. # outcome:rugi
    -> END`;
    expect(() => compileScenario(legitSrc, 't2.ink')).toThrow(/rugi/);
  });

  it('rejects effect:labur without a product', () => {
    const src = finance(`Kak Long: Pilih.
* [A]
    Kak Long: A. # effect:labur:+200 # outcome:untung
    -> END
* [B]
    Kak Long: B. # outcome:rugi
    -> END`);
    expect(() => compileScenario(src, 'f1.ink')).toThrow(ContentError);
    expect(() => compileScenario(src, 'f1.ink')).toThrow(/labur/);
  });

  it('rejects a finance scenario with no concepts', () => {
    const src = ['# id:f1', '# type:finance', '# family:budget', '# contact:Kak Long', `Kak Long: Pilih.
* [A]
    Kak Long: A. # outcome:untung
    -> END
* [B]
    Kak Long: B. # outcome:rugi
    -> END`].join('\n');
    expect(() => compileScenario(src, 'f1.ink')).toThrow(/concept/);
  });
});

describe('enumeratePaths', () => {
  it('fails when there are more paths than the limit', () => {
    const c = compileScenario(kerjaSambilan, 'kerja_sambilan.ink');
    expect(() => enumeratePaths(c.json, 1)).toThrow(/too many paths/);
  });
});

describe('ui_ok branches (Task 16)', () => {
  const src = scam(`VAR ui_ok = false
Encik X: Tolong pindah RM500, upah RM50. # flag:greed:upah RM50 # ui:transfer:500
{ ui_ok:
    Encik X: Terima kasih! # effect:duit:-500 # outcome:mule
- else:
    Encik X: Takpe la. # outcome:safe
}
-> END`);

  it('walks both the Hantar TAC (ui_ok true) and the Batal (false) branch of a ui pause', () => {
    const c = compileScenario(src, 't1.ink');
    expect(enumeratePaths(c.json).map((p) => p.outcome).sort()).toEqual(['mule', 'safe']);
  });

  it('checks the content of the ui_ok true branch too', () => {
    const bad = src.replace('# outcome:mule', '# outcome:menang');
    expect(() => compileScenario(bad, 't1.ink')).toThrow(ContentError);
  });
});

describe('sewa_akaun (Task 16)', () => {
  const c = compileScenario(sewaAkaun, 'sewa_akaun.ink');

  it('is the W3 mule scam with Abang Zul', () => {
    expect(c.meta).toMatchObject({ id: 'sewa_akaun', type: 'scam', family: 'mule', contact: 'Abang Zul', number: '011-0000 0456' });
    expect(c.meta.tactics).toEqual(['greed', 'secrecy', 'social']);
    expect(c.meta.hint).toBeTruthy();
    expect(c.meta.apaPatut.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least one mule path and one safe path, and every path ends in an outcome', () => {
    const paths = enumeratePaths(c.json);
    expect(paths.filter((p) => p.outcome === undefined)).toEqual([]);
    expect(paths.filter((p) => p.outcome === 'mule').length).toBeGreaterThanOrEqual(1);
    expect(paths.filter((p) => p.outcome === 'safe').length).toBeGreaterThanOrEqual(1);
  });

  it('flags the exact phrases for greed, secrecy and social', () => {
    const phrases = Object.fromEntries(c.flags.map((f) => [f.tactic, f.phrase]));
    expect(phrases).toMatchObject({ greed: 'RM1,500', secrecy: 'jangan cerita kat orang', social: 'semua orang buat' });
  });
});
