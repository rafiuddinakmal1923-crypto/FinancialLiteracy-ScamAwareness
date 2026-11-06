import { useState, type ReactNode } from 'react';
import { Flame, GraduationCap, Presentation, Settings as Gear, VenetianMask, type LucideIcon } from 'lucide-react';
import sembang from '../../../assets/app-sembang.svg';
import bankku from '../../../assets/app-bankku.svg';
import dompet from '../../../assets/app-dompet.svg';
import kad from '../../../assets/app-kad.svg';
import latihan from '../../../assets/app-latihan.svg';
import { BALANCE } from '../engine/balance';
import { levelForXp } from '../engine/xp';
import { useGame } from '../state/game';
import { CoachSheet } from '../ui/CoachSheet';
import { ImunitiRing } from '../ui/ImunitiRing';
import { MeterBar } from '../ui/MeterBar';
import { toast } from '../ui/Toast';
import { useT } from './i18n';
import { isKnownPath, navigate } from './router';

/**
 * Paths the home tiles open. A later task only adds a matching entry to ROUTE_TABLE (shell/routes.tsx);
 * until then the tile shows an "Akan datang" toast.
 */
export const APP_TILES: { id: string; path: string; icon: string | LucideIcon }[] = [
  { id: 'sembang', path: '/sembang', icon: sembang },
  { id: 'bankku', path: '/bankku', icon: bankku },
  { id: 'dompet', path: '/dompet', icon: dompet },
  { id: 'kad', path: '/kad', icon: kad },
  { id: 'latihan', path: '/latihan', icon: latihan },
  { id: 'tetapan', path: '/settings', icon: Gear },
];
export const MODE_PATHS = { semester: '/semester', sindiket: '/sindiket', swipe: '/swipe', kelas: '/kelas' } as const;

const TIPS = 5;

function useOpen() {
  const t = useT();
  return (path: string) => (isKnownPath(path) ? navigate(path) : toast(t('common.comingSoon'), 'info'));
}

function WeekTrack({ week }: { week: number }) {
  return (
    <div aria-hidden className="mt-2 flex gap-1">
      {Array.from({ length: BALANCE.semesterWeeks }, (_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < week ? 'bg-kancil' : 'bg-indigo-soft'}`} />
      ))}
    </div>
  );
}

function AppTile({ id, path, icon: Icon }: (typeof APP_TILES)[number]) {
  const t = useT();
  const open = useOpen();
  return (
    <button type="button" onClick={() => open(path)} className="flex min-h-12 flex-col items-center gap-1 rounded-2xl py-1 active:scale-95">
      {typeof Icon === 'string' ? (
        <img src={Icon} alt="" width={56} height={56} className="h-14 w-14 drop-shadow-[0_2px_4px_rgba(28,27,58,.15)]" draggable={false} />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-ink-soft text-paper drop-shadow-[0_2px_4px_rgba(28,27,58,.15)]">
          <Icon aria-hidden size={28} strokeWidth={1.75} />
        </span>
      )}
      <span className="text-base font-medium text-ink">{t(`app.${id}`)}</span>
    </button>
  );
}

function ModeTile({ title, sub, icon: Icon, path, cls, iconCls, extra }: {
  title: string; sub: string; icon: LucideIcon; path: string; cls: string; iconCls: string; extra?: ReactNode;
}) {
  const open = useOpen();
  return (
    <button
      type="button"
      onClick={() => open(path)}
      className={`flex min-h-[92px] flex-col justify-between gap-1 rounded-[20px] p-3 text-left shadow-[0_2px_8px_rgba(28,27,58,.08)] active:scale-[.98] ${cls}`}
    >
      <span className="flex items-start justify-between gap-1">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconCls}`}>
          <Icon aria-hidden size={22} strokeWidth={1.75} />
        </span>
        {extra}
      </span>
      <span>
        <span className="block text-balance font-display text-base font-extrabold leading-tight">{title}</span>
        <span className="mt-0.5 block text-balance text-base leading-tight opacity-85">{sub}</span>
      </span>
    </button>
  );
}

/** S03: the fake phone home screen. */
export function HomeScreen() {
  const t = useT();
  const week = useGame((s) => s.week);
  const name = useGame((s) => s.name);
  const meters = useGame((s) => s.meters);
  const swipe = useGame((s) => s.swipe);
  const [tipOpen, setTipOpen] = useState(true);
  const lvl = levelForXp(meters.xp);
  const nextName = lvl.next !== null ? levelForXp(lvl.next).name : null;
  const today = new Date().toISOString().slice(0, 10);
  const playedToday = swipe.lastPlayed === today;
  const tipIndex = (Math.max(1, week) - 1 + new Date().getDate()) % TIPS;

  return (
    <div data-screen="home" className="flex flex-1 flex-col">
      <div className="songket relative bg-indigo px-4 pb-14">
        <p className="font-display text-[22px] font-extrabold leading-tight text-paper">{t('home.greeting', { name })}</p>
      </div>

      <section aria-label={t('imuniti.word')} className="relative z-10 -mt-11 mx-4 rounded-2xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <div className="flex items-center gap-4">
          <ImunitiRing imuniti={meters.imuniti} level={lvl.name} size={112} />
          <div className="min-w-0 flex-1">
            <MeterBar
              label="XP"
              value={meters.xp - lvl.min}
              max={lvl.next !== null ? lvl.next - lvl.min : 1}
              display={lvl.next !== null ? t('home.xp', { xp: meters.xp, next: lvl.next }) : t('home.xpMax', { xp: meters.xp })}
              tone="kancil"
            />
            {nextName && <p className="mt-2 text-base text-ink-soft">{t('home.nextLevel', { level: nextName })}</p>}
          </div>
        </div>
        <div className="mt-2">
          <p className="text-base font-semibold text-ink">{t('home.week', { week, total: BALANCE.semesterWeeks })}</p>
          <WeekTrack week={week} />
        </div>
      </section>

      <nav aria-label={t('home.apps')} className="grid grid-cols-3 gap-x-2 gap-y-1 px-4 pt-3">
        {APP_TILES.map((a) => <AppTile key={a.id} {...a} />)}
      </nav>

      <section aria-label={t('home.modes')} className="grid grid-cols-2 gap-2.5 px-4 pb-4 pt-3">
        <ModeTile
          title={t('mode.semester')} sub={t('mode.semester.sub', { week })} icon={GraduationCap} path={MODE_PATHS.semester}
          cls="bg-kancil text-ink" iconCls="bg-paper/60"
        />
        <ModeTile
          title={t('mode.sindiket')} sub={t('mode.sindiket.sub')} icon={VenetianMask} path={MODE_PATHS.sindiket}
          cls="bg-sindiket-bg text-paper" iconCls="bg-sindiket-neon text-sindiket-bg"
        />
        <ModeTile
          title={t('mode.swipe')}
          sub={swipe.streak > 0 ? t('mode.swipe.streak', { n: swipe.streak }) : t(playedToday ? 'mode.swipe.done' : 'mode.swipe.todo')}
          icon={Flame} path={MODE_PATHS.swipe}
          cls="bg-white text-ink ring-1 ring-indigo-soft" iconCls={swipe.streak > 0 ? 'bg-danger-soft text-danger' : 'bg-indigo-soft text-ink-soft'}
        />
        <ModeTile
          title={t('mode.kelas')} sub={t('mode.kelas.sub')} icon={Presentation} path={MODE_PATHS.kelas}
          cls="bg-indigo text-paper" iconCls="bg-paper/15"
        />
      </section>

      {tipOpen && (
        <div className="mt-auto pt-6">
          <CoachSheet
            mood="smile"
            peek
            text={t(`tips.daily.${tipIndex}`)}
            button={t('coach.ok')}
            onButton={() => setTipOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
