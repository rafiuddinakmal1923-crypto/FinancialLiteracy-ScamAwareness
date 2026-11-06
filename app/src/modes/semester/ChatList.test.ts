import { describe, expect, it } from 'vitest';
import { availableChats, chatIds, CHAT_WEEKS } from './ChatList';

describe('availableChats (simple rule until Task 25)', () => {
  it('keeps the table of opening weeks in one place', () => {
    expect(CHAT_WEEKS).toEqual({
      kerja_sambilan: 0, dompet_minggu0: 2, sewa_akaun: 3, gaji_pertama: 4, kawan_labur: 5, alert_bankku: 6,
      crypto_naga: 8, bayar_nanti: 9, buku_terpakai: 10, panggilan_mahkamah: 11,
    });
  });

  it('offers kerja_sambilan always and the others from their own week (newest first)', () => {
    expect(availableChats(0)).toEqual(['kerja_sambilan']);
    expect(availableChats(1)).toEqual(['kerja_sambilan']);
    expect(availableChats(2)).toEqual(['dompet_minggu0', 'kerja_sambilan']);
    expect(availableChats(3)).toEqual(['sewa_akaun', 'dompet_minggu0', 'kerja_sambilan']);
    expect(availableChats(5)).toEqual(['kawan_labur', 'gaji_pertama', 'sewa_akaun', 'dompet_minggu0', 'kerja_sambilan']);
    expect(availableChats(7)[0]).toBe('alert_bankku');
    expect(availableChats(9)[0]).toBe('bayar_nanti');
    expect(availableChats(10)[0]).toBe('buku_terpakai');
    expect(availableChats(11)).toEqual([
      'panggilan_mahkamah', 'buku_terpakai', 'bayar_nanti', 'crypto_naga', 'alert_bankku', 'kawan_labur',
      'gaji_pertama', 'sewa_akaun', 'dompet_minggu0', 'kerja_sambilan',
    ]);
  });

  it('lists the newest unread chat first', () => {
    expect(chatIds([], null, availableChats(3))).toEqual(['sewa_akaun', 'dompet_minggu0', 'kerja_sambilan']);
    expect(chatIds([{ id: 'kerja_sambilan' }], null, availableChats(3))).toEqual(['sewa_akaun', 'dompet_minggu0', 'kerja_sambilan']);
  });

  it('keeps the call scenario out of the chat list until the call screen exists (Task 25)', () => {
    expect(chatIds([], null, availableChats(11))).not.toContain('panggilan_mahkamah');
  });
});
