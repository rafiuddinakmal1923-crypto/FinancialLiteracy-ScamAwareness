import { useEffect, useRef, useState, type ReactNode } from 'react';
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

/** One tappable piece of a bubble. Inline targets (WCAG 2.5.8 exception), so they sit inside the sentence. */
function Piece({ seg, state, shake, onTap, label }: {
  seg: Exclude<Segment, { kind: 'space' }>; state: PieceState; shake: number; onTap(el: HTMLElement): void; label?: string;
}) {
  const cls =
    state === 'found' ? 'bg-danger-soft font-semibold text-danger underline decoration-danger decoration-2 underline-offset-4'
      : state === 'revealed' ? 'text-ink underline decoration-danger decoration-dashed decoration-2 underline-offset-4'
        : 'active:bg-indigo-soft';
  return (
    <button
      key={shake}
      type="button"
      data-inline-target=""
      onClick={(e) => onTap(e.currentTarget)}
      className={`inline rounded-md px-0.5 -mx-0.5 text-left align-baseline ${shake ? 'flag-shake' : ''} ${cls}`}
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

  const tapFlag = (key: string, tactic: Tactic, el: HTMLElement) => {
    if (done || tapped.has(key)) return;
    setTapped((s) => new Set(s).add(key));
    if (found.includes(tactic)) return;
    useGame.getState().huntFlag(tactic, meta.family);
    toast(t('bendera.toast', { n: BALANCE.imuniti.flag, tactic: tn(tactic) }), 'success');
    const to = kadRef.current?.getBoundingClientRect();
    if (to) setFlyers((fs) => [...fs, { key: ++flyKey.current, from: el.getBoundingClientRect(), to }]);
  };
  const tapWord = (key: string) => {
    if (done) return;
    setWrong((w) => w + 1);
    setShakes((s) => ({ ...s, [key]: (s[key] ?? 0) + 1 }));
  };

  const render = (m: ChatMessage): ReactNode => {
    const segs = segmentText(m.text, m.flags, String(m.id));
    return segs.map((seg, i) => {
      if (seg.kind === 'space') return <span key={`s${i}`}>{seg.text}</span>;
      if (seg.kind === 'word') {
        return <Piece key={seg.key} seg={seg} state="idle" shake={shakes[seg.key] ?? 0} onTap={() => tapWord(seg.key)} />;
      }
      const state: PieceState = tapped.has(seg.key) ? 'found' : done ? 'revealed' : 'idle';
      const label = state === 'found' ? t('bendera.flag', { tactic: tn(seg.tactic) })
        : state === 'revealed' ? t('bendera.missed', { tactic: tn(seg.tactic) }) : undefined;
      return <Piece key={seg.key} seg={seg} state={state} shake={0} label={label} onTap={(el) => tapFlag(seg.key, seg.tactic, el)} />;
    });
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
        <ol>
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
          <p className="flex min-h-12 items-center text-base leading-snug text-ink-soft">{t('bendera.hint')}</p>
        )}
      </div>

      {createPortal(
        <>{flyers.map((f) => <CardFlyer key={f.key} f={f} onDone={() => setFlyers((fs) => fs.filter((x) => x.key !== f.key))} />)}</>,
        document.body,
      )}
    </div>
  );
}
