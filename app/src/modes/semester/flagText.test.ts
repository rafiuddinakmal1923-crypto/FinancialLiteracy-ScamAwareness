import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../../engine/types';
import { huntTactics, segmentText } from './flagText';

describe('segmentText', () => {
  it('keeps flag phrases whole (case-insensitive) and splits the rest into words', () => {
    const segs = segmentText('Tapi slot tinggal 3 je, cepat!', [{ tactic: 'urgency', phrase: 'Slot tinggal 3' }], 'm1');
    expect(segs).toEqual([
      { kind: 'word', text: 'Tapi', key: 'm1:0' },
      { kind: 'space', text: ' ' },
      { kind: 'flag', text: 'slot tinggal 3', key: 'm1:5', tactic: 'urgency' },
      { kind: 'space', text: ' ' },
      { kind: 'word', text: 'je,', key: 'm1:20' },
      { kind: 'space', text: ' ' },
      { kind: 'word', text: 'cepat!', key: 'm1:24' },
    ]);
    expect(segs.map((s) => s.text).join('')).toBe('Tapi slot tinggal 3 je, cepat!');
  });

  it('handles several flags in one line and ignores missing or overlapping phrases', () => {
    const segs = segmentText('RM300 sehari, top-up RM100 dulu', [
      { tactic: 'payfirst', phrase: 'top-up RM100 dulu' },
      { tactic: 'greed', phrase: 'RM300 sehari' },
      { tactic: 'greed', phrase: 'sehari' },
      { tactic: 'fear', phrase: 'tiada' },
    ], 'x');
    expect(segs.filter((s) => s.kind === 'flag').map((s) => s.text)).toEqual(['RM300 sehari', 'top-up RM100 dulu']);
  });
});

describe('huntTactics', () => {
  it('lists distinct tactics from incoming bubbles only', () => {
    const msg = (id: number, from: ChatMessage['from'], flags: ChatMessage['flags']): ChatMessage =>
      ({ id, from, speaker: null, text: '', flags });
    expect(huntTactics([
      msg(1, 'them', [{ tactic: 'greed', phrase: 'a' }]),
      msg(2, 'them', [{ tactic: 'urgency', phrase: 'b' }, { tactic: 'greed', phrase: 'c' }]),
      msg(3, 'me', [{ tactic: 'fear', phrase: 'd' }]),
      msg(4, 'them', [{ tactic: 'payfirst', phrase: 'e' }, { tactic: 'urgency', phrase: 'f' }]),
    ])).toEqual(['greed', 'urgency', 'payfirst']);
  });
});
