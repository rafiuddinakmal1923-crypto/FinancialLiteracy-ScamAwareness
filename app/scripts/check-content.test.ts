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

  it('reports the file and line number', () => {
    const [p] = scanText('ok\nCall saya 012-345 6789', 'kerja.ink', []);
    expect(p).toMatch(/kerja\.ink:2/);
  });
});
