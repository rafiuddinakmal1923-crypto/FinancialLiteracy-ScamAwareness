import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useGame } from '../state/game';
import { useT } from './i18n';
import { LangToggle } from './LangToggle';
import { Logo } from './Logo';
import { navigate } from './router';

export const DISCLAIMER_DELAY_MS = 1500;

/** S01: logo, tagline, then the fictional-names disclaimer and Mula. */
export function Splash() {
  const t = useT();
  const onboarded = useGame((s) => s.week >= 1);
  const [card, setCard] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setCard(true), DISCLAIMER_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div data-screen="splash" className="flex flex-1 flex-col px-4 pb-6 pt-11">
      <div className="flex justify-end">
        <LangToggle />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center pb-6 pt-10 text-center">
        <Logo size={84} />
        <p className="mt-4 font-display text-xl font-bold text-ink-soft">{t('app.tagline')}</p>
      </div>

      <div className="min-h-[236px]">
        {card && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="flex gap-3 rounded-2xl bg-indigo-soft p-4">
              <ShieldCheck aria-hidden size={24} strokeWidth={1.75} className="mt-0.5 shrink-0 text-indigo" />
              <p className="text-base leading-snug text-ink">{t('splash.disclaimer')}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(onboarded ? '/home' : '/onboarding')}
              className="mt-4 min-h-14 w-full rounded-2xl bg-kancil px-6 font-display text-xl font-extrabold text-ink shadow-[0_4px_0_#D9822B] active:translate-y-0.5 active:shadow-[0_2px_0_#D9822B]"
            >
              {t('splash.start')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
