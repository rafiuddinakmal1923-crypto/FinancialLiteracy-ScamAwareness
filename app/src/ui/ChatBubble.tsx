import type { ReactNode } from 'react';

/** In-game links are always `<name>.test/<path>` (no scheme). */
const LINK_RE = /([a-z0-9-]+\.test(?:\/[^\s]*)?)/gi;
const TRAILING = /[.,!?;:)]+$/;

/** Splits text into plain parts and `.test` links (underlined spans; Task 12 makes them open a fake page). */
export function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const raw = m[0];
    const link = raw.replace(TRAILING, '');
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    out.push(
      <span key={start} data-link={link} className="break-all font-medium text-indigo underline decoration-2 underline-offset-2">
        {link}
      </span>,
    );
    last = start + link.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export type BubbleFrom = 'them' | 'me' | 'system';

/**
 * One chat bubble. `first` marks the first bubble of a run from the same sender: it gets the 4 px tail
 * corner. `sender` is read by screen readers before the text ("Kak Mira (HR): ..."). `content` replaces the
 * linkified text (the flag hunt passes tappable words).
 */
export function ChatBubble({ from, text, first = true, sender, content }: {
  from: BubbleFrom; text: string; first?: boolean; sender?: string; content?: ReactNode;
}) {
  if (from === 'system') {
    return (
      <div className="flex justify-center px-6">
        <p className="rounded-xl bg-indigo-soft/80 px-3 py-1.5 text-center text-base leading-snug text-ink-soft">
          {linkify(text)}
        </p>
      </div>
    );
  }
  const me = from === 'me';
  const tail = first ? (me ? 'rounded-tr-[4px]' : 'rounded-tl-[4px]') : '';
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[82%] whitespace-pre-wrap break-words rounded-[18px] ${tail} px-3.5 py-2 text-base leading-[1.4] text-ink shadow-[0_1px_1.5px_rgba(28,27,58,.12)] ${me ? 'bg-chat-out' : 'bg-chat-in'}`}
      >
        {sender && <span className="sr-only">{sender}: </span>}
        {content ?? linkify(text)}
      </p>
    </div>
  );
}
