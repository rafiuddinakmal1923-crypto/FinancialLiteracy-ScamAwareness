// S16: the real-action checklist. Self-reported: each first tick gives a star, a confetti burst and +25 XP.
import { useEffect, useState } from 'react';
import { Check, Heart, Star } from 'lucide-react';
import { drills } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { useT } from '../../shell/i18n';
import { useGame } from '../../state/game';
import { toast } from '../../ui/Toast';
import { useLoc } from '../harian/shared';
import { Burst, DrillHeader, useLatihanProgress } from './parts';

export function Checklist() {
  const t = useT();
  const loc = useLoc();
  const actions = useGame((s) => s.actions);
  const { stars } = useLatihanProgress();
  const defs = drills?.actions ?? [];
  const [burst, setBurst] = useState<string | null>(null);

  useEffect(() => {
    if (!burst) return;
    const id = setTimeout(() => setBurst(null), BALANCE.drill.burstMs);
    return () => clearTimeout(id);
  }, [burst]);

  const toggle = (id: string) => {
    const g = useGame.getState();
    if (g.actions.includes(id)) { g.untickAction(id); return; }
    const paid = g.tickAction(id);
    setBurst(id);
    if (paid) toast(t('latihan.senarai.xp', { xp: BALANCE.xp.action }), 'success');
  };

  return (
    <div data-screen="latihan-senarai" className="relative flex min-h-0 flex-1 flex-col bg-paper">
      <DrillHeader title={t('latihan.senarai.title')} back="/latihan">
        <div className="ml-1 mt-1 flex flex-wrap gap-2">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-paper/15 px-3 py-1 font-mono text-base font-semibold">
            <Star aria-hidden size={18} strokeWidth={2} className="fill-kancil text-kancil" />
            {t('latihan.senarai.stars', { n: stars })}
          </p>
          <p className="inline-flex items-center rounded-full bg-paper/15 px-3 py-1 font-mono text-base font-semibold">
            {t('latihan.senarai.progress', { n: defs.filter((a) => actions.includes(a.id)).length, total: defs.length })}
          </p>
        </div>
      </DrillHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <p className="text-base leading-snug text-ink">{t('latihan.senarai.intro')}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {defs.map((a) => {
            const on = actions.includes(a.id);
            const where = a.id === 'check-licence' ? t(`latihan.senarai.where.${a.id}`) : null;
            return (
              <li key={a.id} className="relative">
                <button
                  type="button" role="checkbox" aria-checked={on} aria-label={loc(a.label)} onClick={() => toggle(a.id)}
                  className={`flex min-h-16 w-full items-start gap-3 rounded-2xl px-3 py-3 text-left ring-1 active:scale-[.99] ${on ? 'bg-safe-soft ring-safe' : 'bg-white ring-ink/20'}`}
                >
                  <span aria-hidden className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${on ? 'bg-safe text-white' : 'bg-white ring-2 ring-ink/40'}`}>
                    {on && <Check size={22} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base leading-snug text-ink">{loc(a.label)}</span>
                    {where && <span className="mt-1 block text-base font-semibold leading-snug text-indigo">{where}</span>}
                  </span>
                  <span aria-hidden className="flex shrink-0 items-center gap-0.5 pt-1">
                    {Array.from({ length: a.stars }, (_, i) => (
                      <Star key={i} size={20} strokeWidth={2} className={on ? 'fill-kancil text-kancil' : 'text-ink-soft/50'} />
                    ))}
                  </span>
                </button>
                {burst === a.id && <Burst />}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-kancil-soft px-3 py-3 text-base leading-snug text-ink">
          <Heart aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          {t('latihan.senarai.honesty')}
        </p>
      </div>
    </div>
  );
}
