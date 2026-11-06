import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { scanText, readBannedNames } from './check-content';

const banned = readBannedNames(fileURLToPath(new URL('../../content/banned-names.txt', import.meta.url)));

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
