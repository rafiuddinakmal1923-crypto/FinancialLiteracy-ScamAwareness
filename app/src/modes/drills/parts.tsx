// Pieces shared by the Latihan screens (S16): the indigo header and the confetti burst.
import { ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { drills } from 'virtual:celik-content';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { useReducedMotion } from '../harian/shared';

/** Songket header with a back button; `back` is the route it returns to. */
export function DrillHeader({ title, back, children }: { title: string; back: string; children?: React.ReactNode }) {
  const t = useT();
  return (
    <div className="songket bg-indigo px-4 pb-4 text-paper">
      <div className="flex items-center gap-1">
        <button type="button" aria-label={t('common.back')} onClick={() => navigate(back)} className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full">
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <h1 className="flex-1 pr-16 font-display text-2xl font-extrabold leading-tight">{title}</h1>
      </div>
      {children}
    </div>
  );
}

/** Stars earned from ticked actions, and how many of the drills and actions are done. */
export function useLatihanProgress(): { stars: number; done: number; total: number } {
  const actions = useGame((s) => s.actions);
  const doneDrills = useGame((s) => s.drills);
  const defs = drills?.actions ?? [];
  const stars = defs.filter((a) => actions.includes(a.id)).reduce((n, a) => n + a.stars, 0);
  const ticked = defs.filter((a) => actions.includes(a.id)).length;
  const drillCount = ['997', 'semak'].filter((d) => doneDrills.includes(d)).length;
  return { stars, done: drillCount + ticked, total: 2 + defs.length };
}

const COLORS = ['#f4a340', '#e5484d', '#30a46c', '#2d2a6e', '#fff1dc'];

/** A short confetti burst from the centre of its (relative) parent. Nothing at all under reduced motion. */
export function Burst({ n = 14 }: { n?: number }) {
  const settingReduced = useReducedMotion();
  const osReduced = useFramerReducedMotion();
  if (settingReduced || osReduced) return null;
  return (
    <span aria-hidden data-testid="burst" className="pointer-events-none absolute left-6 top-1/2 z-10 h-0 w-0">
      {Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
        const dist = 38 + (i % 4) * 14;
        return (
          <motion.span
            key={i}
            className="absolute left-0 top-0 block"
            style={{ width: 8 + (i % 3) * 3, height: i % 2 ? 6 : 10, backgroundColor: COLORS[i % COLORS.length], borderRadius: i % 3 === 0 ? 999 : 2 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 10, opacity: 0, scale: 1, rotate: 180 + i * 40 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        );
      })}
    </span>
  );
}
