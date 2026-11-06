// UI-SPEC S09 MoneyChain (mule outcome): where the money went. Coins hop Mangsa -> Akaun anda -> Akaun lapis ->
// Sindiket, then a police icon traces the money back and stops at "Akaun anda", which keeps a slow pulse.
// Every node keeps its icon and word at all times, so a still frame (or a screenshot) reads on its own.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Coins, Layers, ShieldUser, UserRound, VenetianMask } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import { useT } from '../../shell/i18n';
import { useSettings } from '../../state/settings';
import { BankKuLogo } from './BankKu';

/** 0 = before the first hop; 1..3 = coin on its way to node n; then the police trace; then the end state. */
export type ChainPhase = 0 | 1 | 2 | 3 | 'trace' | 'done';

const NODES = ['mangsa', 'anda', 'lapis', 'sindiket'] as const;
const HOPS = NODES.length - 1;
/** Column centres of the four-column grid, as a share of its width. */
const X = NODES.map((_, i) => `${(i * 2 + 1) * (100 / (NODES.length * 2))}%`);
/** The node circle; the overlay rails sit at its vertical middle. */
const NODE_PX = 56;
const EASE = 'easeInOut';

/** How far along the chain the money is (0..3 nodes reached). */
function reached(p: ChainPhase): number {
  return p === 'trace' || p === 'done' ? HOPS : Math.max(0, p - 1);
}

function NodeIcon({ id }: { id: (typeof NODES)[number] }) {
  const common = { 'aria-hidden': true, size: 26, strokeWidth: 1.75 } as const;
  switch (id) {
    case 'mangsa': return <UserRound {...common} />;
    case 'anda': return <BankKuLogo size={34} />;
    case 'lapis': return <Layers {...common} />;
    case 'sindiket': return <VenetianMask {...common} />;
  }
}

const NODE_STYLE: Record<(typeof NODES)[number], string> = {
  mangsa: 'bg-indigo-soft text-ink',
  anda: 'bg-white text-ink ring-2 ring-indigo',
  lapis: 'bg-indigo-soft text-indigo',
  sindiket: 'bg-ink text-paper',
};

/** The RM coin that travels one hop (decorative: the words carry the meaning). */
function Coin({ from, to, ms, reduced }: { from: number; to: number; ms: number; reduced: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute top-0 z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-kancil text-ink shadow-[0_2px_6px_rgba(28,27,58,.25)] ring-2 ring-white"
      initial={{ left: X[from], opacity: reduced ? 0 : 1 }}
      animate={{ left: X[to], opacity: 1 }}
      transition={reduced ? { duration: BALANCE.moneyChain.reducedMs / 1000 } : { duration: ms / 1000, ease: EASE }}
    >
      <Coins size={18} strokeWidth={2} />
    </motion.span>
  );
}

/** A fade-in for reduced motion (each under 200 ms, one after another); a no-op wrapper otherwise. */
function Fade({ i, reduced, children, className = '' }: { i: number; reduced: boolean; children: ReactNode; className?: string }) {
  if (!reduced) return <div className={className}>{children}</div>;
  const ms = BALANCE.moneyChain.reducedMs;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ms / 1000, delay: (i * ms) / 1000 }}
    >
      {children}
    </motion.div>
  );
}

export function MoneyChain({ onDone }: { onDone?: () => void }) {
  const t = useT();
  const reduced = useSettings((s) => s.reducedMotion);
  const { startMs, hopMs, traceMs, pulseMs, reducedMs } = BALANCE.moneyChain;
  const [phase, setPhase] = useState<ChainPhase>(reduced ? 'done' : 0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (reduced) {
      // The end state is drawn at once; report done when the last fade has landed.
      setPhase('done');
      const id = setTimeout(() => doneRef.current?.(), reducedMs * 6);
      return () => clearTimeout(id);
    }
    if (phase === 'done') {
      doneRef.current?.();
      return;
    }
    const wait = phase === 0 ? startMs : phase === 'trace' ? traceMs : hopMs;
    const next: ChainPhase = phase === 'trace' ? 'done' : phase === HOPS ? 'trace' : ((phase as number) + 1) as ChainPhase;
    const id = setTimeout(() => setPhase(next), wait);
    return () => clearTimeout(id);
  }, [phase, reduced, startMs, hopMs, traceMs, reducedMs]);

  const at = reached(phase);
  const tracing = phase === 'trace' || phase === 'done';
  const done = phase === 'done';
  const labels = NODES.map((n) => t(`moneyChain.${n}`));

  return (
    <figure
      data-testid="money-chain"
      data-phase={String(phase)}
      aria-labelledby="money-chain-title"
      className="rounded-2xl bg-white px-3 pb-4 pt-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]"
    >
      <figcaption id="money-chain-title" className="px-1 font-display text-xl font-bold text-ink">
        {t('moneyChain.title')}
      </figcaption>

      <div className="relative mt-4">
        {/* Rails, arrows and the coin, at the circles' middle line. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0" style={{ top: NODE_PX / 2 }}>
          {Array.from({ length: HOPS }, (_, i) => {
            const filled = at > i;
            const moving = phase === i + 1;
            return (
              <div key={i} className="absolute top-0 h-0" style={{ left: X[i], right: `calc(100% - ${X[i + 1]})` }}>
                <span className="absolute inset-x-0 -top-px border-t-2 border-dashed border-ink/25" />
                <motion.span
                  className="absolute inset-x-0 -top-[2px] h-1 origin-left rounded-full bg-kancil"
                  initial={false}
                  animate={{ scaleX: filled ? 1 : moving ? 1 : 0 }}
                  transition={moving ? { duration: hopMs / 1000, ease: EASE } : { duration: reduced ? reducedMs / 1000 : 0 }}
                />
                <span className="absolute left-1/2 top-0 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink ring-1 ring-ink/15">
                  <ChevronRight size={14} strokeWidth={2.5} />
                </span>
              </div>
            );
          })}
          {typeof phase === 'number' && phase > 0 && <Coin key={phase} from={phase - 1} to={phase} ms={hopMs} reduced={false} />}
          {tracing && (
            <motion.span
              className="absolute top-0 z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-[calc(50%+22px)] items-center justify-center rounded-full bg-kancil text-ink shadow-[0_2px_6px_rgba(28,27,58,.25)] ring-2 ring-white"
              style={{ left: `calc(${X[HOPS]} + 18px)` }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? reducedMs / 1000 : 0.25 }}
            >
              <Coins size={18} strokeWidth={2} />
            </motion.span>
          )}
        </div>

        <ol aria-label={t('moneyChain.list', { nodes: labels.join(', ') })} className="relative grid grid-cols-4">
          {NODES.map((n, i) => {
            const lit = at >= i || (n === 'mangsa' && phase !== 0);
            const traced = n === 'anda' && done;
            return (
              <li key={n} {...(traced ? { 'data-traced': '' } : {})} className="flex min-w-0 flex-col items-center">
                <Fade i={i} reduced={reduced} className="relative flex flex-col items-center">
                  {n === 'anda' && tracing && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full ring-4 ring-danger"
                      style={{ width: NODE_PX, height: NODE_PX }}
                      initial={{ opacity: 0, scale: 1 }}
                      animate={reduced || !done ? { opacity: done ? 0.9 : 0, scale: 1 } : { opacity: [0.9, 0.25, 0.9], scale: [1, 1.14, 1] }}
                      transition={reduced || !done ? { duration: reducedMs / 1000 } : { duration: pulseMs / 1000, ease: EASE, repeat: Infinity }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center justify-center rounded-full transition-[filter,opacity] duration-300 ${NODE_STYLE[n]} ${lit ? '' : 'opacity-60 saturate-50'}`}
                    style={{ width: NODE_PX, height: NODE_PX }}
                  >
                    <NodeIcon id={n} />
                  </span>
                </Fade>
                <Fade i={i} reduced={reduced} className="mt-2 px-0.5 text-center">
                  <span className={`block text-base font-semibold leading-tight ${n === 'anda' ? 'text-indigo' : 'text-ink'}`}>
                    {labels[i]}
                  </span>
                </Fade>
              </li>
            );
          })}
        </ol>

        {/* The police trace: from Sindiket back to Akaun anda (right to left), under the labels. */}
        <div aria-hidden="true" className="relative mt-3 h-12">
          {tracing && (
            <>
              <motion.span
                className="absolute top-1/2 h-0 origin-right border-t-2 border-dashed border-danger"
                style={{ left: X[1], right: `calc(100% - ${X[HOPS]})` }}
                initial={{ scaleX: reduced ? 1 : 0, opacity: reduced ? 0 : 1 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={reduced ? { duration: reducedMs / 1000, delay: (4 * reducedMs) / 1000 } : { duration: traceMs / 1000, ease: EASE }}
              />
              <motion.span
                className="absolute top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-indigo text-paper shadow-[0_2px_8px_rgba(28,27,58,.25)] ring-2 ring-white"
                initial={{ left: reduced ? X[1] : X[HOPS], opacity: reduced ? 0 : 1 }}
                animate={{ left: X[1], opacity: 1 }}
                transition={reduced ? { duration: reducedMs / 1000, delay: (4 * reducedMs) / 1000 } : { duration: traceMs / 1000, ease: EASE }}
              >
                <ShieldUser size={24} strokeWidth={1.75} />
              </motion.span>
            </>
          )}
        </div>
      </div>

      {tracing && (
        <motion.p
          data-testid="police-trace"
          role="status"
          className="mt-1 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2 text-base font-medium leading-snug text-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? reducedMs / 1000 : 0.25, delay: reduced ? (5 * reducedMs) / 1000 : 0 }}
        >
          <ShieldUser aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-indigo" />
          <span>{t('moneyChain.trace')}</span>
        </motion.p>
      )}
    </figure>
  );
}
