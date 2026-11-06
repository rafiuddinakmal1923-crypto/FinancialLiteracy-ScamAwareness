import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import kadIcon from '../../../../assets/app-kad.svg';
import { BALANCE } from '../../engine/balance';
import type { ChatMessage, Tactic } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { ChatBubble } from '../../ui/ChatBubble';
import { Kancil } from '../../ui/Kancil';
import { useTactic } from '../../ui/tactics';
import { toast } from '../../ui/Toast';
import { huntTactics, segmentText, type Segment } from './flagText';
import { useEnded } from './aftermath';

interface Flyer { key: number; from: DOMRect; to: DOMRect }

/** The little red card that flies from a found phrase to the Kad counter (fades in place with reduced motion). */
function CardFlyer({ f, onDone }: { f: Flyer; onDone(): void }) {
  const dx = f.to.left + f.to.width / 2 - (f.from.left + f.from.width / 2);
  const dy = f.to.top + f.to.height / 2 - (f.from.top + f.from.height / 2);
  return (
    <motion.div
      aria-hidden="true"
      initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: -6 }}
      animate={{ x: dx, y: dy, scale: 0.45, opacity: [1, 1, 0], rotate: 8 }}
      transition={{ duration: 0.75, ease: 'easeInOut' }}
      onAnimationComplete={onDone}
      style={{ left: f.from.left + f.from.width / 2 - 22, top: f.from.top + f.from.height / 2 - 30 }}
      className="pointer-events-none fixed z-[60] flex h-[60px] w-11 items-center justify-center rounded-lg bg-danger shadow-[0_6px_16px_rgba(229,72,77,.45)] ring-2 ring-paper"
    >
      <Flag size={20} strokeWidth={2} className="fill-paper text-paper" />
    </motion.div>
  );
}

type PieceState = 'idle' | 'found' | 'revealed';

/** The flag phrase in `root` nearest to (x, y), if any of its line boxes is within `slop` px; else null. */
export function nearestFlag(root: HTMLElement, x: number, y: number, slop: number): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestD = slop;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-piece="flag"]'))) {
    for (const r of Array.from(el.getClientRects())) {
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const d = Math.hypot(dx, dy);
      if (d <= bestD) { bestD = d; best = el; }
    }
  }
  return best;
}

/**
 * Invisible tap zones (D31): each piece keeps its inline text layout but gets an absolutely positioned ::after
 * of at least 48 x 48 px, centred on the word. Zones sit below every visible piece (negative z inside the
 * bubble's `isolate` wrapper), so a tap on a word's own text is always that word; where zones overlap, a flag
 * phrase's zone (6 px wider each side) lies above a plain word's.
 */
const ZONE = "after:absolute after:left-1/2 after:top-1/2 after:h-12 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";
const ZONE_WORD = `${ZONE} after:-z-20 after:w-[max(100%,48px)]`;
const ZONE_FLAG = `${ZONE} after:-z-10 after:w-[max(100%_+_12px,48px)]`;

/**
 * One tappable piece of a bubble. It has no click handler of its own: the transcript handles every tap (and
 * Enter/Space on a focused piece) in one place, so a tap just beside a flag phrase can count as that flag.
 */
function Piece({ seg, state, shake, label }: {
  seg: Exclude<Segment, { kind: 'space' }>; state: PieceState; shake: number; label?: string;
}) {
  const cls =
    state === 'found' ? 'bg-danger-soft font-semibold text-danger underline decoration-danger decoration-2 underline-offset-4'
      : state === 'revealed' ? 'text-ink underline decoration-danger decoration-dashed decoration-2 underline-offset-4'
        : 'active:bg-indigo-soft';
  const flag = seg.kind === 'flag';
  return (
    <button
      key={shake}
      type="button"
      data-piece={seg.kind}
      data-key={seg.key}
      data-tactic={flag ? seg.tactic : undefined}
      className={`relative inline rounded-md px-0.5 -mx-0.5 text-left align-baseline ${flag ? ZONE_FLAG : ZONE_WORD} ${shake ? 'flag-shake' : ''} ${cls}`}
    >
      {state === 'found' && <Flag aria-hidden size={15} strokeWidth={2.25} className="mr-0.5 inline -translate-y-px fill-danger text-danger" />}
      {seg.text}
      {label && <span className="sr-only"> ({label})</span>}
    </button>
  );
}

/** S06 flag hunt: tap the red flags in the transcript to collect Red Flag cards. */
export function FlagHunt({ params }: { params: Record<string, string> }) {
  const id = params.id ?? '';
  const t = useT();
  const tn = useTactic();
  const { ended, scenario } = useEnded(id);
  const cards = useGame((s) => s.cards.length);
  const transcript: ChatMessage[] = ended?.transcript ?? [];
  const targets = huntTactics(transcript);
  const found = ended?.found ?? [];
  const max = BALANCE.aftermath.wrongTaps;

  // Which phrase was tapped for each found tactic (on re-entry, the first phrase of that tactic).
  const [tapped, setTapped] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const tac of found) {
      for (const m of transcript) {
        if (m.from !== 'them') continue;
        const seg = segmentText(m.text, m.flags, String(m.id)).find((x) => x.kind === 'flag' && x.tactic === tac);
        if (seg && seg.kind === 'flag') { s.add(seg.key); break; }
      }
    }
    return s;
  });
  const [wrong, setWrong] = useState(0);
  const [shakes, setShakes] = useState<Record<string, number>>({});
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const kadRef = useRef<HTMLSpanElement>(null);
  const flyKey = useRef(0);

  const done = !!ended && (ended.huntDone || targets.every((x) => found.includes(x)) || wrong >= max);
  useEffect(() => {
    if (done && ended && !ended.huntDone) useGame.getState().finishHunt();
  }, [done, ended]);

  if (!ended || !scenario) return null;
  const { meta } = scenario;
  const name = meta.contact || meta.number || '';
  // A family can have its own hint (`bendera.hint.<family>`); otherwise the general one.
  const familyHint = t(`bendera.hint.${meta.family}`);
  const huntHint = familyHint === `bendera.hint.${meta.family}` ? t('bendera.hint') : familyHint;

  const tapFlag = (key: string, tactic: Tactic, el: HTMLElement) => {
    if (done || tapped.has(key)) return;
    setTapped((s) => new Set(s).add(key));
    if (found.includes(tactic)) return;
    useGame.getState().huntFlag(tactic, meta);
    // Only a scam's flags award Imuniti and a card (M6); other hunts just count.
    if (meta.type !== 'scam') return;
    toast(t('bendera.toast', { n: BALANCE.imuniti.flag, tactic: tn(tactic) }), 'success');
    const to = kadRef.current?.getBoundingClientRect();
    if (to) setFlyers((fs) => [...fs, { key: ++flyKey.current, from: el.getBoundingClientRect(), to }]);
  };
  const tapWord = (key: string) => {
    if (done) return;
    setWrong((w) => w + 1);
    setShakes((s) => ({ ...s, [key]: (s[key] ?? 0) + 1 }));
  };

  /**
   * One handler for every tap in the transcript (D31). A pointer tap within `flagSlopPx` of a flag phrase is
   * that flag, even when it lands on a neighbouring word or the space between; otherwise a tapped plain word
   * is a wrong tap. Keyboard activation (detail 0, no pointer position) counts the focused piece only.
   */
  const onLogClick = (e: ReactMouseEvent<HTMLElement>) => {
    if (done) return;
    const piece = (e.target as HTMLElement).closest<HTMLElement>('[data-piece]');
    let flag = piece?.dataset.piece === 'flag' ? piece : null;
    if (!flag && e.detail > 0) flag = nearestFlag(e.currentTarget, e.clientX, e.clientY, BALANCE.aftermath.flagSlopPx);
    if (flag) tapFlag(flag.dataset.key!, flag.dataset.tactic as Tactic, flag);
    else if (piece) tapWord(piece.dataset.key!);
  };

  const render = (m: ChatMessage): ReactNode => {
    const segs = segmentText(m.text, m.flags, String(m.id));
    // `isolate` keeps the pieces' negative-z tap zones above the bubble background (see ZONE).
    return (
      <span className="isolate">
        {segs.map((seg, i) => {
          // Spaces let taps through to the tap zones underneath.
          if (seg.kind === 'space') return <span key={`s${i}`} className="pointer-events-none">{seg.text}</span>;
          if (seg.kind === 'word') return <Piece key={seg.key} seg={seg} state="idle" shake={shakes[seg.key] ?? 0} />;
          const state: PieceState = tapped.has(seg.key) ? 'found' : done ? 'revealed' : 'idle';
          const label = state === 'found' ? t('bendera.flag', { tactic: tn(seg.tactic) })
            : state === 'revealed' ? t('bendera.missed', { tactic: tn(seg.tactic) }) : undefined;
          return <Piece key={seg.key} seg={seg} state={state} shake={0} label={label} />;
        })}
      </span>
    );
  };

  const n = targets.length;
  const foundCount = targets.filter((x) => found.includes(x)).length;

  return (
    <div data-screen="bendera" className="flex min-h-0 flex-1 flex-col">
      <div className="relative z-10 flex items-center gap-3 bg-white py-2 pl-4 pr-24 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-bold leading-tight text-ink">{t('bendera.title')}</h1>
          <p className="truncate text-base leading-tight text-ink-soft">{name}</p>
        </div>
        <span
          ref={kadRef}
          role="status"
          aria-label={t('bendera.kad', { n: cards })}
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-danger-soft py-1 pl-1.5 pr-3"
        >
          <img src={kadIcon} alt="" width={36} height={36} className="h-9 w-9" draggable={false} />
          <motion.span
            key={cards}
            data-testid="kad-count"
            aria-hidden="true"
            initial={{ scale: 1.6 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.55 }}
            className="min-w-[1ch] font-mono text-lg font-semibold text-danger"
          >
            {cards}
          </motion.span>
        </span>
      </div>

      <div role="log" aria-label={t('sembang.logLabel', { name })} className="sembang-wall min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {/* Instruction stays pinned while the transcript scrolls underneath (a paper strip hides the gap above it). */}
        <div className="sticky top-0 z-10 -mx-3 mb-1 bg-paper/95 px-3 pb-2 pt-3">
          <div className="flex items-start gap-2 rounded-2xl bg-kancil-soft p-3 shadow-[0_2px_8px_rgba(28,27,58,.08)] ring-1 ring-kancil/40">
            <Kancil mood={done ? 'proud' : 'neutral'} size={40} decorative className="-my-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug text-ink">
                {n > 0 ? t('bendera.instruction', { n }) : t('bendera.none')}
              </p>
              {n > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1" aria-label={t('bendera.progress', { found: foundCount, n })} role="img">
                    {targets.map((x) => (
                      <span
                        key={x}
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${found.includes(x) ? 'bg-danger text-paper' : 'bg-white text-ink-soft/40 ring-1 ring-ink-soft/30'}`}
                      >
                        <Flag aria-hidden size={14} strokeWidth={2.25} className={found.includes(x) ? 'fill-paper' : ''} />
                      </span>
                    ))}
                  </span>
                  <span className="text-base text-ink-soft">{t('bendera.tries', { wrong: Math.min(wrong, max), max })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Delegated taps; the pieces themselves are buttons, so keyboard users activate them directly. */}
        <ol onClick={onLogClick}>
          {transcript.map((m, i) => {
            const prev = transcript[i - 1];
            const same = !!prev && prev.from === m.from && prev.speaker === m.speaker;
            return (
              <li key={m.id} className={i === 0 ? '' : same ? 'mt-1.5' : 'mt-3'}>
                <ChatBubble
                  from={m.from}
                  text={m.text}
                  first={!same}
                  sender={m.from === 'system' ? undefined : m.from === 'me' ? t('sembang.you') : m.speaker ?? name}
                  content={m.from === 'them' ? render(m) : undefined}
                />
              </li>
            );
          })}
        </ol>
      </div>

      <div className="relative z-10 shrink-0 rounded-t-[24px] bg-white px-3 pb-3 pt-3 shadow-[0_-8px_24px_rgba(28,27,58,.12)]">
        {done ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
            <p className="text-base font-semibold text-ink">{t('bendera.result', { found: foundCount, n })}</p>
            {foundCount < n && <p className="mt-0.5 text-base leading-snug text-ink-soft">{t('bendera.revealed')}</p>}
            <button
              type="button"
              onClick={() => navigate(`/semester/debrief/${id}`)}
              className="mt-3 min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
            >
              {t('bendera.done')}
            </button>
          </motion.div>
        ) : (
          <p className="flex min-h-12 items-center text-base leading-snug text-ink-soft">{huntHint}</p>
        )}
      </div>

      {createPortal(
        <>{flyers.map((f) => <CardFlyer key={f.key} f={f} onDone={() => setFlyers((fs) => fs.filter((x) => x.key !== f.key))} />)}</>,
        document.body,
      )}
    </div>
  );
}
