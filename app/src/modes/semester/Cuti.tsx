// Week 7: mid-semester break. No scenario and no XP: one reflection card that points at Mesin Masa.
import { motion } from 'framer-motion';
import { Hourglass } from 'lucide-react';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useSettings } from '../../state/settings';
import { Kancil } from '../../ui/Kancil';
import { loc, weekDef } from './weeks';

export function Cuti() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const def = weekDef(7);
  return (
    <div data-screen="cuti" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-indigo">
      <div className="songket px-5 pb-10 pt-4 text-paper">
        <h1 className="pr-14 font-display text-[34px] font-extrabold leading-[1.05]">{t('cuti.title')}</h1>
        {def && <p className="mt-4 text-lg leading-snug">{loc(def.context, lang)}</p>}
      </div>
      <motion.div
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="-mt-5 flex flex-1 flex-col rounded-t-[24px] bg-paper px-4 pt-5 shadow-[0_-8px_24px_rgba(28,27,58,.12)]"
      >
        <div className="flex items-end gap-2">
          <Kancil mood="smile" size={72} decorative className="shrink-0" />
          <p className="flex-1 rounded-[18px] rounded-bl-[4px] bg-kancil-soft px-4 py-3 text-lg font-semibold leading-snug text-ink">
            {t('cuti.prompt')}
          </p>
        </div>
        <p className="mt-4 flex items-start gap-2 px-1 text-base leading-snug text-ink-soft">
          <Hourglass aria-hidden size={20} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          {t('cuti.note')}
        </p>
        <div className="mt-auto flex flex-col gap-2 pb-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/kalkulator/masa?preset=labur50')}
            className="min-h-12 rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
          >
            {t('cuti.calc')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="min-h-12 rounded-2xl bg-white px-4 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98]"
          >
            {t('cuti.next')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
