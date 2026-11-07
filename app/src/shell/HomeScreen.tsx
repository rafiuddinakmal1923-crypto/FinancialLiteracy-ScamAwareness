import { useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Flame, GraduationCap, Lock, Newspaper, Presentation, Settings as Gear, Store, Trophy, VenetianMask, type LucideIcon } from 'lucide-react';
import sembang from '../../../assets/app-sembang.svg';
import bankku from '../../../assets/app-bankku.svg';
import dompet from '../../../assets/app-dompet.svg';
import kalkulator from '../../../assets/app-kalkulator.svg';
import kad from '../../../assets/app-kad.svg';
import latihan from '../../../assets/app-latihan.svg';
import { BALANCE } from '../engine/balance';
import { localDate } from '../engine/dates';
import { netWorth } from '../engine/meters';
import { CONCEPTS, TACTICS } from '../engine/types';
import { levelForXp } from '../engine/xp';
import { useGame } from '../state/game';
import { CoachSheet } from '../ui/CoachSheet';
import { formatRM } from '../ui/format';
import { MeterBar } from '../ui/MeterBar';
import { meanScore, ScoreRing } from '../ui/ScoreRing';
import { toast } from '../ui/Toast';
import { useT } from './i18n';
import { isKnownPath, navigate } from './router';
import { homeTile, loopState, nextStep } from '../modes/semester/loop';

/**
 * Paths the home tiles open. A later task only adds a matching entry to ROUTE_TABLE (shell/routes.tsx);
 * until then the tile shows an "Akan datang" toast. Tetapan stays on the grid (ruling R7).
 */
export const APP_TILES: { id: string; path: string; icon: string | LucideIcon; label?: string }[] = [
  { id: 'sembang', path: '/sembang', icon: sembang },
  { id: 'bankku', path: '/bankku', icon: bankku },
  { id: 'dompet', path: '/dompet', icon: dompet },
  { id: 'kalkulator', path: '/kalkulator', icon: kalkulator },
  { id: 'kad', path: '/kad', icon: kad },
  { id: 'latihan', path: '/latihan', icon: latihan },
  { id: 'suapan', path: '/suapan', icon: Newspaper, label: 'suapan.app' },
  { id: 'kedai', path: '/kedai', icon: Store, label: 'kedai.app' },
  { id: 'papan', path: '/papan', icon: Trophy, label: 'papan.app' },
  { id: 'tetapan', path: '/settings', icon: Gear },
];
export const MODE_PATHS = { semester: '/semester/minggu', harian: '/harian', kelas: '/kelas', sindiket: '/sindiket' } as const;

const TIPS = 5;

function useOpen() {
  const t = useT();
  return (path: string) => (isKnownPath(path) ? navigate(path) : toast(t('common.comingSoon'), 'info'));
}

function WeekTrack({ week }: { week: number }) {
  return (
    <div aria-hidden className="mt-1.5 flex gap-1">
      {Array.from({ length: BALANCE.semesterWeeks }, (_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < week ? 'bg-kancil' : 'bg-indigo-soft'}`} />
      ))}
    </div>
  );
}

/** "Nilai bersih RM2,000" with the amount in the numbers face (the copy stays one i18n string). */
function NetWorth({ amount }: { amount: number }) {
  const t = useT();
  const MARK = '\u0000';
  const [before, after = ''] = t('home.netWorth', { amount: MARK }).split(MARK);
  return (
    <p className="text-base font-semibold text-ink">
      {before}
      <span className="font-mono font-semibold text-ink">{formatRM(amount)}</span>
      {after}
    </p>
  );
}

function AppTile({ id, path, icon: Icon, label }: (typeof APP_TILES)[number]) {
  const t = useT();
  const open = useOpen();
  return (
    <button type="button" onClick={() => open(path)} className="flex min-h-12 min-w-0 flex-col items-center gap-1 rounded-2xl py-1 active:scale-95">
      {typeof Icon === 'string' ? (
        <img src={Icon} alt="" width={56} height={56} className="h-14 w-14 drop-shadow-[0_2px_4px_rgba(28,27,58,.15)]" draggable={false} />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-ink-soft text-paper drop-shadow-[0_2px_4px_rgba(28,27,58,.15)]">
          <Icon aria-hidden size={28} strokeWidth={1.75} />
        </span>
      )}
      <span className="max-w-full text-base font-medium text-ink">{t(label ?? `app.${id}`)}</span>
    </button>
  );
}

const TILE = 'flex min-h-[88px] flex-col justify-between gap-1 rounded-[20px] p-3 text-left shadow-[0_2px_8px_rgba(28,27,58,.08)]';

function TileBody({ title, sub, icon: Icon, iconCls, extra }: {
  title: string; sub: string; icon: LucideIcon; iconCls: string; extra?: ReactNode;
}) {
  return (
    <>
      <span className="flex items-start justify-between gap-1">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
          <Icon aria-hidden size={22} strokeWidth={1.75} />
        </span>
        {extra}
      </span>
      <span>
        <span className="block text-balance font-display text-base font-extrabold leading-tight">{title}</span>
        <span className="mt-0.5 block text-balance text-base leading-tight opacity-85">{sub}</span>
      </span>
    </>
  );
}

function ModeTile({ path, cls, ...body }: {
  title: string; sub: string; icon: LucideIcon; path: string; cls: string; iconCls: string; extra?: ReactNode;
}) {
  const open = useOpen();
  return (
    <button type="button" onClick={() => open(path)} className={`${TILE} active:scale-[.98] ${cls}`}>
      <TileBody {...body} />
    </button>
  );
}

/** A mode that is not built yet (Mod Sindiket until the stretch build, D26): shown, locked, not tappable. */
function LockedTile({ title, icon }: { title: string; icon: LucideIcon }) {
  const t = useT();
  return (
    <div
      data-locked=""
      role="group"
      aria-disabled="true"
      aria-label={t('mode.locked', { mode: title })}
      className={`${TILE} bg-sindiket-bg/90 text-paper/80 shadow-none ring-1 ring-inset ring-paper/10`}
    >
      <TileBody
        title={title} sub={t('common.comingSoon')} icon={icon} iconCls="bg-paper/10 text-sindiket-neon/70"
        extra={<Lock aria-hidden size={20} strokeWidth={1.75} className="mt-1 text-paper/70" />}
      />
    </div>
  );
}

/** S03 v2: the fake phone home screen. */
export function HomeScreen() {
  const t = useT();
  // Week 0 (before the first week intro) reads as week 1.
  const week = useGame((s) => Math.max(1, s.week));
  const name = useGame((s) => s.name);
  const meters = useGame((s) => s.meters);
  const harian = useGame((s) => s.harian);
  const loop = useGame(useShallow(loopState));
  const [tipOpen, setTipOpen] = useState(true);
  const lvl = levelForXp(meters.xp);
  const nextName = lvl.next !== null ? levelForXp(lvl.next).name : null;
  // Cek Harian: "today" is the device's local date, never UTC.
  const playedToday = harian.lastPlayed === localDate();
  const tile = homeTile(loop);
  const tileSub = tile.kind === 'pending' ? t('mode.semester.pending') : tile.kind === 'report' ? t('mode.semester.report')
    : loop.week === 0 ? t('mode.semester.start') : t('mode.semester.next', { week: tile.week });
  // After a finished week the next one is one clear tap away (D20).
  const cta = tile.kind === 'report' ? t('home.cta.report') : tile.kind === 'next' && loop.week >= 1 && !loop.weekIntroOpen ? t('home.cta.next') : null;
  const tipIndex = (week - 1 + new Date().getDate()) % TIPS;

  return (
    <div data-screen="home" className="flex flex-1 flex-col">
      <div className="songket relative bg-indigo px-4 pb-14">
        <p className="font-display text-[22px] font-extrabold leading-tight text-paper">{t('home.greeting', { name })}</p>
      </div>

      <section aria-label={t('home.scores')} className="relative z-10 -mt-11 mx-4 rounded-2xl bg-white px-4 pb-3 pt-3 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <div className="grid grid-cols-2 gap-2">
          <ScoreRing
            name={t('celik.word')} tone="kancil"
            score={meanScore(meters.celik, CONCEPTS)} parts={CONCEPTS.map((c) => meters.celik[c])}
          />
          <ScoreRing
            name={t('imuniti.word')} tone="indigo"
            score={meanScore(meters.imuniti, TACTICS)} parts={TACTICS.map((k) => meters.imuniti[k])}
          />
        </div>

        <div className="mt-2.5 border-t border-indigo-soft pt-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-xl font-extrabold leading-tight text-indigo">{t(`level.${lvl.name}`)}</p>
            {nextName && <p className="truncate text-base text-ink-soft">{t('home.nextLevel', { level: t(`level.${nextName}`) })}</p>}
          </div>
          <MeterBar
            className="mt-1"
            label={t('home.xpLabel')}
            value={meters.xp - lvl.min}
            max={lvl.next !== null ? lvl.next - lvl.min : 1}
            display={lvl.next !== null ? t('home.xp', { xp: meters.xp, next: lvl.next }) : t('home.xpMax', { xp: meters.xp })}
            tone="kancil"
          />
        </div>

        <div className="mt-2.5 border-t border-indigo-soft pt-2">
          <p className="text-base font-semibold text-ink">{t('home.week', { week, total: BALANCE.semesterWeeks })}</p>
          <WeekTrack week={week} />
          <div className="mt-2">
            <NetWorth amount={netWorth(meters)} />
          </div>
        </div>
      </section>

      {cta && (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => navigate(nextStep(loop))}
            className="min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
          >
            {cta}
          </button>
        </div>
      )}

      <nav aria-label={t('home.apps')} className="grid grid-cols-4 gap-y-1 px-2 pt-3">
        {APP_TILES.map((a) => <AppTile key={a.id} {...a} />)}
      </nav>

      <section aria-label={t('home.modes')} className="grid grid-cols-2 gap-2.5 px-4 pb-4 pt-3">
        <ModeTile
          title={t('mode.semester')} sub={tileSub} icon={GraduationCap}
          // The loop decides: Dompet first, a pending scenario or aftermath, the report, else the next week intro.
          path={nextStep(loop)}
          cls="bg-kancil text-ink" iconCls="bg-paper/60"
        />
        <ModeTile
          title={t('mode.harian')}
          sub={t('mode.harian.today', { status: t(playedToday ? 'mode.harian.done' : 'mode.harian.todo') })}
          icon={Flame} path={MODE_PATHS.harian}
          cls="bg-white text-ink ring-1 ring-indigo-soft"
          iconCls={harian.streak > 0 ? 'bg-danger-soft text-danger' : 'bg-indigo-soft text-ink-soft'}
          extra={harian.streak > 0 ? (
            <span className="flex items-center gap-0.5 rounded-full bg-danger-soft px-2 py-0.5 font-mono text-base font-semibold text-danger">
              <Flame aria-hidden size={16} strokeWidth={2} className="fill-danger" />
              {harian.streak}
              <span className="sr-only">{t('mode.harian.streak', { n: harian.streak })}</span>
            </span>
          ) : undefined}
        />
        <ModeTile
          title={t('mode.kelas')} sub={t('mode.kelas.sub')} icon={Presentation} path={MODE_PATHS.kelas}
          cls="bg-indigo text-paper" iconCls="bg-paper/15"
        />
        <LockedTile title={t('mode.sindiket')} icon={VenetianMask} />
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
