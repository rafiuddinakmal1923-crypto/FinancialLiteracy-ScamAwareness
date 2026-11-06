import { describe, expect, it } from 'vitest';
import { availableChats, chatIds, CHAT_WEEKS } from './ChatList';

describe('availableChats (simple rule until Task 25)', () => {
  it('keeps the table of opening weeks in one place', () => {
    expect(CHAT_WEEKS).toEqual({ kerja_sambilan: 0, sewa_akaun: 3, kawan_labur: 5, crypto_naga: 8, bayar_nanti: 9 });
  });

  it('offers kerja_sambilan always and the others from their own week (newest first)', () => {
    expect(availableChats(0)).toEqual(['kerja_sambilan']);
    expect(availableChats(2)).toEqual(['kerja_sambilan']);
    expect(availableChats(3)).toEqual(['sewa_akaun', 'kerja_sambilan']);
    expect(availableChats(5)).toEqual(['kawan_labur', 'sewa_akaun', 'kerja_sambilan']);
    expect(availableChats(7)).toEqual(['kawan_labur', 'sewa_akaun', 'kerja_sambilan']);
    expect(availableChats(8)).toEqual(['crypto_naga', 'kawan_labur', 'sewa_akaun', 'kerja_sambilan']);
    expect(availableChats(9)).toEqual(['bayar_nanti', 'crypto_naga', 'kawan_labur', 'sewa_akaun', 'kerja_sambilan']);
  });

  it('lists the newest unread chat first', () => {
    expect(chatIds([], null, availableChats(3))).toEqual(['sewa_akaun', 'kerja_sambilan']);
    expect(chatIds([{ id: 'kerja_sambilan' }], null, availableChats(3))).toEqual(['sewa_akaun', 'kerja_sambilan']);
  });
});
