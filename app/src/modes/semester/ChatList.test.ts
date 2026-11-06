import { describe, expect, it } from 'vitest';
import { availableChats, chatIds } from './ChatList';

describe('availableChats (simple rule until Task 25)', () => {
  it('offers kerja_sambilan always and sewa_akaun from week 3', () => {
    expect(availableChats(0)).toEqual(['kerja_sambilan']);
    expect(availableChats(2)).toEqual(['kerja_sambilan']);
    expect(availableChats(3)).toEqual(['sewa_akaun', 'kerja_sambilan']);
    expect(availableChats(7)).toContain('sewa_akaun');
  });

  it('lists the newest unread chat first', () => {
    expect(chatIds([], null, availableChats(3))).toEqual(['sewa_akaun', 'kerja_sambilan']);
    expect(chatIds([{ id: 'kerja_sambilan' }], null, availableChats(3))).toEqual(['sewa_akaun', 'kerja_sambilan']);
  });
});
