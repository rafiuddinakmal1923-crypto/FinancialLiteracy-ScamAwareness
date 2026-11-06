import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BatteryLow, CircleCheck, Coins, CreditCard, Flag, House, Landmark, Lock, MessageCircleX, Network, Phone,
  Search, Send, ShieldCheck, Clock, UserX, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import { BALANCE } from '../engine/balance';
import { useSettings } from '../state/settings';

/** Icon names usable in the `akibat.<outcome>.<n>.icon` copy keys. */
export const STEP_ICONS: Record<string, LucideIcon> = {
  send: Send, 'message-x': MessageCircleX, 'user-x': UserX, wallet: Wallet, phone: Phone, coins: Coins,
  network: Network, lock: Lock, landmark: Landmark, card: CreditCard, home: House, battery: BatteryLow,
  'shield-check': ShieldCheck, users: Users, flag: Flag, search: Search, check: CircleCheck, clock: Clock,
};

export interface TimelineStep { icon: string; time: string; text: string }
export type TimelineTone = 'danger' | 'safe' | 'warning';

const NODE: Record<TimelineTone, string> = {
  danger: 'bg-danger-soft text-danger ring-danger/30',
  safe: 'bg-safe-soft text-safe ring-safe/30',
  warning: 'bg-kancil-soft text-ink ring-kancil/50',
};
const RAIL: Record<TimelineTone, string> = { danger: 'bg-danger/40', safe: 'bg-safe/40', warning: 'bg-kancil/60' };

/** Vertical steps that appear one by one (600-1200 ms apart; quicker fades with reduced motion). */
export function ConsequenceTimeline({ steps, tone, label, onDone }: {
  steps: TimelineStep[]; tone: TimelineTone; label: string; onDone?: () => void;
}) {
  const reduced = useSettings((s) => s.reducedMotion);
  const [shown, setShown] = useState(1);
  const every = reduced ? BALANCE.aftermath.stepMsReduced : BALANCE.aftermath.stepMs;

  useEffect(() => {
    if (shown >= steps.length) { onDone?.(); return; }
    const id = setTimeout(() => setShown((n) => n + 1), every);
    return () => clearTimeout(id);
  }, [shown, steps.length, every, onDone]);

  return (
    <ol aria-label={label} className="relative">
      {steps.slice(0, shown).map((s, i) => {
        const Icon = STEP_ICONS[s.icon] ?? Clock;
        const last = i === steps.length - 1;
        return (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {!last && (
              <motion.span
                aria-hidden="true"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: i < shown - 1 ? 1 : 0 }}
                transition={{ duration: every / 1000, ease: 'easeInOut' }}
                className={`absolute left-[19px] top-11 bottom-1 w-0.5 origin-top rounded-full ${RAIL[tone]}`}
              />
            )}
            <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${NODE[tone]}`}>
              <Icon aria-hidden size={20} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-base font-semibold leading-tight text-ink-soft">{s.time}</p>
              <p className="mt-1 text-base leading-snug text-ink">{s.text}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
