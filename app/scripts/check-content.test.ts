import { describe, it, expect } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCelikContent } from '../vite-plugins/ink';
import { scanText, readBannedNames, namesFor, rateMarkerProblems } from './check-content';

const banned = readBannedNames(fileURLToPath(new URL('../../content/banned-names.txt', import.meta.url)));
const allowed = readBannedNames(fileURLToPath(new URL('../../content/allowed-real-names.txt', import.meta.url)));

describe('finalist content files', () => {
  const tempDir = () => {
    const dir = mkdtempSync(join(tmpdir(), 'celik-'));
    mkdirSync(join(dir, 'scenarios'));
    writeFileSync(join(dir, 'banned-names.txt'), 'Maybank');
    return dir;
  };
  const post = { id: 'p1', kind: 'advice', author: { name: 'Kak Ana', handle: '@ana', followers: '1K' }, text: { ms: 'Simpan dahulu.' }, concept: 'bajet', semak: { kad: 'bajet' } };

  it('accepts a valid post', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'feed.json'), JSON.stringify([post]));
    expect(loadCelikContent(dir).problems).toEqual([]);
  });

  it('fails on a banned name in a new file', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'feed.json'), JSON.stringify([{ ...post, author: { ...post.author, name: 'Maybank' } }]));
    expect(loadCelikContent(dir).problems.join()).toContain('Maybank');
  });

  it('fails when a hype post has no debrief, or a post opens a missing preset', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'feed.json'), JSON.stringify([{ ...post, kind: 'hype' }]));
    expect(loadCelikContent(dir).problems.join()).toContain('debrief');
    writeFileSync(join(dir, 'feed.json'), JSON.stringify([{ ...post, semak: { calc: 'tiada' } }]));
    expect(loadCelikContent(dir).problems.join()).toContain('tiada');
  });

  it('fails when a shop item has no price', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'shop.json'), JSON.stringify([{ id: 'tiada', name: { ms: 'x' }, pot: 'kehendak', effect: 'none', tip: { ms: 'x' } }]));
    expect(loadCelikContent(dir).problems.join()).toContain('no price');
  });
});

describe('scanText', () => {
  it('flags a real brand from the list', () => {
    expect(scanText('Akaun Maybank anda disekat', 'x.ink', banned)).toHaveLength(1);
    expect(scanText('Akaun maybank anda disekat', 'x.ink', ['Maybank'])).toHaveLength(1);
    expect(scanText('Parcel J&T anda tertahan', 'x.ink', banned)).toHaveLength(1);
  });

  it('matches brand names as whole words only', () => {
    expect(scanText('Mudigital itu kedai', 'x.ink', ['Digi'])).toEqual([]);
  });

  it('allows every fictional entity', () => {
    const fictional =
      'BankKu, Bintang Digital Sdn Bhd, KurierKilat, CryptoNaga, PinjamCepat, Universiti Cempaka Raya, Bank Merpati, Sembang';
    expect(scanText(fictional, 'x.ink', banned)).toEqual([]);
  });

  it('flags http URL', () => {
    expect(scanText('Klik http://kurierkilat-bayar.test/alamat', 'x.ink', []).length).toBeGreaterThan(0);
    expect(scanText('Klik https://kurierkilat-bayar.test/alamat', 'x.ink', []).length).toBeGreaterThan(0);
  });

  it('flags a non-.test domain', () => {
    expect(scanText('Klik kurierkilat-bayar.com/alamat', 'x.ink', [])).toHaveLength(1);
    expect(scanText('Klik kurierkilat.test.com.my', 'x.ink', [])).toHaveLength(1);
  });

  it('allows kurierkilat-bayar.test/alamat', () => {
    expect(scanText('Klik kurierkilat-bayar.test/alamat sekarang', 'x.ink', banned)).toEqual([]);
  });

  it('allows semakmule.rmp.gov.my', () => {
    expect(scanText('Semak di semakmule.rmp.gov.my dulu', 'x.ink', banned)).toEqual([]);
  });

  it('allows 997 and 011-0000 0123', () => {
    expect(scanText('Telefon 997 segera. Nombor dia 011-0000 0123.', 'x.ink', banned)).toEqual([]);
  });

  it('flags 012-345 6789', () => {
    expect(scanText('Call saya 012-345 6789', 'x.ink', [])).toHaveLength(1);
    expect(scanText('Call saya 0123456789', 'x.ink', [])).toHaveLength(1);
  });

  it.each([
    '012 345 6789',
    '012-345-6789',
    '+6012-345 6789',
    '60123456789',
    '03 2345 6789',
    '1-300-88-6688',
    '1300 88 6688',
    '1-800-22-1234',
  ])('flags phone format %s', (num) => {
    expect(scanText(`Hubungi ${num} sekarang`, 'x.ink', [])).toHaveLength(1);
  });

  it('does not flag money, times, durations or dates', () => {
    const text = 'Bayar RM1,500 atau RM10.30 sebelum 10.30 pagi, 09.30 malam, 1.5 jam, 05/11/2026, 05.11.2026, 2026-11-06, RM0.50';
    expect(scanText(text, 'x.ink', banned)).toEqual([]);
  });

  it('flags a fake number written with a +6 prefix', () => {
    expect(scanText('Nombor +6011-0000 0123', 'x.ink', [])).toHaveLength(1);
  });

  it('flags real agencies from the list', () => {
    for (const a of ['Bukit Aman', 'SSM', 'Suruhanjaya Syarikat Malaysia', 'PDRM', 'Bank Negara', 'BNM', 'MCMC', 'LHDN', 'KWSP', 'EPF', 'PTPTN']) {
      expect(scanText(`Saya dari ${a}.`, 'x.ink', banned).length, a).toBeGreaterThan(0);
    }
  });

  it('allows NSRC only next to 997', () => {
    expect(scanText('Telefon NSRC 997 segera.', 'x.ink', banned)).toEqual([]);
    expect(scanText('Telefon 997 (NSRC) segera.', 'x.ink', banned)).toEqual([]);
    expect(scanText('Telefon NSRC segera.', 'x.ink', banned)).toHaveLength(1);
    expect(scanText('Pegawai nsrc akan hubungi anda. Atau telefon 997.', 'x.ink', banned)).toHaveLength(1);
  });

  it('matches URLs case-insensitively', () => {
    expect(scanText('Beli di Kedai.COM hari ni', 'x.ink', [])).toHaveLength(1);
  });

  it('allows .test subdomains', () => {
    expect(scanText('Buka bayar.kurierkilat.test/alamat', 'x.ink', [])).toEqual([]);
  });

  it('allows the Semak Mule portal in any case, with or without https', () => {
    for (const t of ['https://semakmule.rmp.gov.my', 'HTTPS://SemakMule.RMP.gov.my', 'SEMAKMULE.RMP.GOV.MY', 'https://semakmule.rmp.gov.my/']) {
      expect(scanText(`Semak di ${t} dulu`, 'x.ink', banned), t).toEqual([]);
    }
    expect(scanText('Semak di http://semakmule.rmp.gov.my', 'x.ink', banned)).toHaveLength(1);
    expect(scanText('Semak di https://semakmule.rmp.gov.my.palsu.test', 'x.ink', banned)).toHaveLength(1);
  });

  it('matches banned names across apostrophe and space variants', () => {
    for (const t of ['Touch ’n Go', "Touch'n Go", 'Touch n Go', 'NinjaVan', 'Ninja Van', 'CityLink', 'PosLaju']) {
      expect(scanText(`Bayar guna ${t}`, 'x.ink', banned).length, t).toBeGreaterThan(0);
    }
  });

  it('reports the file and line number', () => {
    const [p] = scanText('ok\nCall saya 012-345 6789', 'kerja.ink', []);
    expect(p).toMatch(/kerja\.ink:2/);
  });
});

describe('real scheme and agency names (D27)', () => {
  it('the allowlist names the expected schemes and agencies, all also banned', () => {
    for (const n of ['KWSP', 'EPF', 'PTPTN', 'Tabung Haji', 'ASB', 'SC', 'BNM', 'Bank Negara', 'AKPK', 'Belanjawanku']) {
      expect(allowed, n).toContain(n);
    }
    const lower = banned.map((b) => b.toLowerCase());
    for (const n of allowed) expect(lower, n).toContain(n.toLowerCase());
  });

  it('KWSP is allowed in concepts.json and flagged in a scenario', () => {
    const text = 'Guna panduan KWSP Belanjawanku. Semak SC Investor Alert List dan BNM Financial Consumer Alert List. Hubungi AKPK.';
    expect(scanText(text, 'concepts.json', namesFor('concepts.json', banned, allowed))).toEqual([]);
    expect(scanText('Saya pegawai KWSP.', 'scenarios/x.ink', namesFor('scenarios/x.ink', banned, allowed))).toHaveLength(1);
    expect(scanText('Simpan dalam ASB.', 'cards.json', namesFor('cards.json', banned, allowed))).toHaveLength(1);
    expect(scanText('Saya pegawai KWSP.', 'scenarios/concepts.json', namesFor('scenarios/concepts.json', banned, allowed))).toHaveLength(1);
  });

  it('allowlisted names stay banned elsewhere even if missing from banned-names.txt', () => {
    expect(namesFor('x.ink', [], ['AKPK'])).toEqual(['AKPK']);
    expect(namesFor('concepts.json', ['AKPK', 'Maybank'], ['akpk'])).toEqual(['Maybank']);
  });

  it('other real brands stay banned inside concepts.json', () => {
    expect(scanText('Buka akaun Maybank', 'concepts.json', namesFor('concepts.json', banned, allowed))).toHaveLength(1);
  });
});

describe('rateMarkerProblems (CLAUDE.md rule 11)', () => {
  it('passes objects with a % figure or rate that carry verify or a source', () => {
    const ok = [
      { code: 'kompaun', contoh: { ms: 'Contoh: 5% setahun', verify: 'TODO-VERIFY' } },
      { contoh: { ms: 'Contoh: 4 % setahun', source: 'KWSP 2025', year: 2025 } },
      { band: { rate: 0.04, verify: 'TODO-VERIFY' } },
      { apa: { ms: 'Tiada kadar di sini, cuma RM50 sebulan.' } },
    ];
    expect(rateMarkerProblems(ok, 'concepts.json')).toEqual([]);
  });

  it('flags a % figure or a rate field without a marker, with its path', () => {
    const bad = [{ code: 'risiko', contoh: { ms: 'Contoh: 30% seminggu', en: 'e.g. 30% a week' } }];
    const p = rateMarkerProblems(bad, 'concepts.json');
    expect(p).toHaveLength(1);
    expect(p[0]).toMatch(/concepts\.json: 0\.contoh/);
    expect(rateMarkerProblems({ bands: { rate: 0.04 } }, 'concepts.json')[0]).toMatch(/bands/);
    expect(rateMarkerProblems({ x: { ms: '5%', verify: 'maybe' } }, 'concepts.json')).toHaveLength(1);
    expect(rateMarkerProblems({ x: { ms: '5%', source: '' } }, 'concepts.json')).toHaveLength(1);
  });
});

describe('rateMarkerProblems: words for per cent (Task 11 review)', () => {
  it.each(['Contoh: 5 peratus setahun', 'Contoh: 4.5 Peratus', 'e.g. 5 percent a year', 'e.g. 5 PERCENT', 'Contoh: 5peratus'])(
    'flags "%s" without a marker', (s) => {
      expect(rateMarkerProblems({ x: { ms: s } }, 'concepts.json')).toHaveLength(1);
      expect(rateMarkerProblems({ x: { ms: s, verify: 'TODO-VERIFY' } }, 'concepts.json')).toEqual([]);
    },
  );
  it('does not flag "peratus" without a figure', () => {
    expect(rateMarkerProblems({ x: { ms: 'Berapa peratus pulangan?' } }, 'concepts.json')).toEqual([]);
  });
});

describe('todoVerifyKeys (M5)', () => {
  it('lists every _todoVerify key of ms.json; the Penal Code line stays until the Act text is read (V1)', async () => {
    const { todoVerifyKeys } = await import('./check-content');
    const path = fileURLToPath(new URL('../src/shell/i18n/ms.json', import.meta.url));
    const listed = (JSON.parse(readFileSync(path, 'utf8')) as { _todoVerify: string[] })._todoVerify;
    expect(todoVerifyKeys(path)).toEqual(listed);
    expect(listed).toContain('legal.penalCode');
  });
});

describe('notes in the content folder', () => {
  it('does not scan a README, which names files like raya_duit.ink', () => {
    const dir = mkdtempSync(join(tmpdir(), 'celik-'));
    mkdirSync(join(dir, 'scenarios'));
    mkdirSync(join(dir, 'drafts'));
    writeFileSync(join(dir, 'banned-names.txt'), 'Maybank');
    writeFileSync(join(dir, 'drafts', 'README.md'), 'Move raya_duit.ink later.');
    expect(loadCelikContent(dir).problems).toEqual([]);
  });

  it('still scans a draft scenario', () => {
    const dir = mkdtempSync(join(tmpdir(), 'celik-'));
    mkdirSync(join(dir, 'scenarios'));
    mkdirSync(join(dir, 'drafts'));
    writeFileSync(join(dir, 'banned-names.txt'), 'Maybank');
    writeFileSync(join(dir, 'drafts', 'x.ink'), 'Maybank');
    expect(loadCelikContent(dir).problems.join()).toContain('Maybank');
  });
});

describe('finalist content against balance.ts', () => {
  const tempDir = () => {
    const dir = mkdtempSync(join(tmpdir(), 'celik-'));
    mkdirSync(join(dir, 'scenarios'));
    writeFileSync(join(dir, 'banned-names.txt'), 'Maybank');
    return dir;
  };

  it('fails when a goal measures something balance.ts does not', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'goals.json'), JSON.stringify([{ id: 'raya', measure: 'labur', name: { ms: 'x' } }]));
    expect(loadCelikContent(dir).problems.join()).toContain('measure');
  });

  it('fails when the wrong item lowers transport', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'shop.json'), JSON.stringify([{ id: 'buku', name: { ms: 'x' }, pot: 'keperluan', effect: 'transport', tip: { ms: 'x' } }]));
    expect(loadCelikContent(dir).problems.join()).toContain('transport');
  });
});
