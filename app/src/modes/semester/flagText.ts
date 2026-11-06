// Flag hunt text helpers: which tactics a transcript lets the player find, and how a bubble splits into
// tappable pieces (flagged phrases as one piece each, every other word on its own).
import type { ChatMessage, Flag, Tactic } from '../../engine/types';

export type Segment =
  | { kind: 'space'; text: string }
  | { kind: 'word'; text: string; key: string }
  | { kind: 'flag'; text: string; key: string; tactic: Tactic };

/** Distinct tactics flagged in the incoming bubbles of a transcript, in order of first appearance. */
export function huntTactics(transcript: ChatMessage[]): Tactic[] {
  const out: Tactic[] = [];
  for (const m of transcript) {
    if (m.from !== 'them') continue;
    for (const f of m.flags) if (!out.includes(f.tactic)) out.push(f.tactic);
  }
  return out;
}

function words(text: string, offset: number, prefix: string): Segment[] {
  const out: Segment[] = [];
  for (const m of text.matchAll(/(\s+)|(\S+)/g)) {
    const at = offset + (m.index ?? 0);
    if (m[1]) out.push({ kind: 'space', text: m[1] });
    else out.push({ kind: 'word', text: m[2], key: `${prefix}:${at}` });
  }
  return out;
}

/**
 * Splits `text` into flag phrases (matched case-insensitively, first occurrence, non-overlapping), words and
 * whitespace. Keys are `<prefix>:<character offset>` so they are stable across renders.
 */
export function segmentText(text: string, flags: Flag[], prefix: string): Segment[] {
  const lower = text.toLowerCase();
  const ranges: { start: number; end: number; tactic: Tactic }[] = [];
  for (const f of flags) {
    const start = lower.indexOf(f.phrase.toLowerCase());
    if (start < 0 || f.phrase === '') continue;
    const end = start + f.phrase.length;
    if (ranges.some((r) => start < r.end && end > r.start)) continue;
    ranges.push({ start, end, tactic: f.tactic });
  }
  ranges.sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let last = 0;
  for (const r of ranges) {
    out.push(...words(text.slice(last, r.start), last, prefix));
    out.push({ kind: 'flag', text: text.slice(r.start, r.end), key: `${prefix}:${r.start}`, tactic: r.tactic });
    last = r.end;
  }
  out.push(...words(text.slice(last), last, prefix));
  return out;
}
