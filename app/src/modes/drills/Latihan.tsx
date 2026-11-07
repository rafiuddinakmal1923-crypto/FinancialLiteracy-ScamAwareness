// S16: Latihan Tindakan menu. Three tiles: the simulated 997 call, the simulated account check, the real-action checklist.
import { ChevronRight, CircleCheck, ListChecks, PhoneCall, SearchCheck, Star, type LucideIcon } from 'lucide-react';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { DrillHeader, useLatihanProgress } from './parts';

interface Tile { id: '997' | 'semak' | 'senarai'; path: string; icon: LucideIcon; tone: string; done: boolean }

export function Latihan() {
  const t = useT();
  const drillsDone = useGame((s) => s.drills);
  const { stars, done, total } = useLatihanProgress();
  const TILES: Tile[] = [
    { id: '997', path: '/latihan/997', icon: PhoneCall, tone: 'bg-danger-soft text-danger-ink', done: drillsDone.includes('997') },
    { id: 'semak', path: '/latihan/semak', icon: SearchCheck, tone: 'bg-indigo-soft text-indigo', done: drillsDone.includes('semak') },
    { id: 'senarai', path: '/latihan/senarai', icon: ListChecks, tone: 'bg-safe-soft text-ink', done: false },
  ];
  return (
    <div data-screen="latihan" className="relative flex min-h-0 flex-1 flex-col bg-paper">
      <DrillHeader title={t('latihan.title')} back="/home">
        <div className="ml-1 mt-1 flex flex-wrap gap-2">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-paper/15 px-3 py-1 font-mono text-base font-semibold">
            <Star aria-hidden size={18} strokeWidth={2} className="fill-kancil text-kancil" />
            {t('latihan.stars', { n: stars })}
          </p>
          <p className="inline-flex items-center rounded-full bg-paper/15 px-3 py-1 font-mono text-base font-semibold">{t('latihan.done', { n: done, total })}</p>
        </div>
      </DrillHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <p className="text-base leading-snug text-ink-soft">{t('latihan.menu.note')}</p>
        <ul className="mt-3 flex flex-col gap-3">
          {TILES.map(({ id, path, icon: Icon, tone, done: finished }) => (
            <li key={id}>
              <button
                type="button" onClick={() => navigate(path)}
                className="flex min-h-[88px] w-full items-center gap-3 rounded-[24px] bg-white p-3 text-left shadow-[0_4px_14px_rgba(28,27,58,.1)] ring-1 ring-indigo-soft active:scale-[.98]"
              >
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon aria-hidden size={30} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-extrabold leading-tight text-ink">{t(`latihan.menu.${id}.title`)}</span>
                  <span className="mt-0.5 block text-base leading-snug text-ink-soft">{t(`latihan.menu.${id}.sub`)}</span>
                  {finished && (
                    <span className="mt-1 inline-flex items-center gap-1 text-base font-semibold text-ink">
                      <CircleCheck aria-hidden size={18} strokeWidth={2} className="text-safe" />
                      {t('latihan.menu.finished')}
                    </span>
                  )}
                </span>
                <ChevronRight aria-hidden size={24} strokeWidth={1.75} className="shrink-0 text-ink-soft" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
