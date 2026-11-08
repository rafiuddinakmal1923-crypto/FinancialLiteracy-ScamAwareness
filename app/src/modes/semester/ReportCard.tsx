// S13: the semester report card. All counting lives in engine/report.ts; this file only lays it out.
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CircleCheck, CircleX, Dumbbell, Trophy } from 'lucide-react';
import { scenarios } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import type { GradeLetter } from '../../engine/grade';
import { reportModel } from '../../engine/report';
import { FINALIST } from '../../shell/features';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { flushNow } from '../../state/persist';
import { useGame } from '../../state/game';
import { formatMoney } from '../../ui/format';
import { Kancil, type KancilMood } from '../../ui/Kancil';
import { MeterBar } from '../../ui/MeterBar';
import { PORTRAIT } from '../../ui/portraits';
import { useTactic } from '../../ui/tactics';
import { useConceptName } from '../harian/shared';
import { GoalResult } from '../matlamat/GoalResult';

// A8: Kad Keputusan brings html-to-image, so it loads as its own chunk.
const ShareButton = lazy(() => import('../kongsi/ShareButton').then((m) => ({ default: m.ShareButton })));

const MOOD: Record<GradeLetter, KancilMood> = { A: 'proud', B: 'proud', C: 'smile', D: 'worried' };
/** Stamp colours; the letter itself is always printed, so colour is never the only signal. */
const STAMP: Record<GradeLetter, string> = {
  A: 'border-safe text-safe bg-safe-soft', B: 'border-indigo text-indigo bg-indigo-soft',
  C: 'border-kancil text-ink bg-kancil-soft', D: 'border-danger text-danger-ink bg-danger-soft',
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-indigo-soft py-2 last:border-b-0">
      <dt className="text-base text-ink">{label}</dt>
      <dd className="text-right font-mono text-base font-semibold text-ink">{children}</dd>
    </div>
  );
}

export function ReportCard() {
  const t = useT();
  const tactic = useTactic();
  const conceptName = useConceptName();
  const week = useGame((s) => s.week);
  const results = useGame((s) => s.results);
  const meters = useGame((s) => s.meters);
  const incomeTotal = useGame((s) => s.incomeTotal);
  const goal = useGame((s) => s.goal);
  const character = useGame((s) => s.character);
  const name = useGame((s) => s.name);
  const [confirming, setConfirming] = useState(false);

  const m = useMemo(
    () => reportModel({ week, results, meters, incomeTotal, goal }, BALANCE.start.duit, scenarios),
    [week, results, meters, incomeTotal, goal],
  );
  useEffect(() => { useGame.getState().claimGoalXp(); }, []);
  const weakestName = m.weakest.kind === 'concept' ? conceptName(m.weakest.code as never) : tactic(m.weakest.code as never);
  const money = (n: number) => formatMoney(n);

  const startNew = async () => {
    useGame.getState().reset();
    try { await flushNow(); } catch { /* the in-memory game is already reset */ }
    navigate('/');
  };

  return (
    <div data-screen="rapor" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-indigo">
      <div className="songket px-4 pb-10 pt-1 text-paper">
        <div className="flex items-center gap-3 pt-1">
          <img src={PORTRAIT[character]} alt={name} width={44} height={44} draggable={false} className="mt-3 h-11 w-11 shrink-0 rounded-full bg-paper object-cover ring-2 ring-kancil" />
          <h1 className="flex-1 pt-3 font-display text-2xl font-extrabold">{t('rapor.title')}</h1>
        </div>
      </div>

      <div className="-mt-5 flex flex-1 flex-col gap-4 rounded-t-[24px] bg-paper px-4 pb-6 pt-5 shadow-[0_-8px_24px_rgba(28,27,58,.12)]">
        {!m.finished && (
          <p role="status" className="rounded-2xl bg-kancil-soft px-4 py-3 text-base leading-snug text-ink">{t('rapor.unfinished')}</p>
        )}

        <section className="flex items-center gap-4">
          <div
            role="img"
            aria-label={t('rapor.gradeAria', { grade: m.grade, score: m.score })}
            className={`flex h-24 w-24 shrink-0 -rotate-6 flex-col items-center justify-center rounded-[22px] border-[5px] border-double ${STAMP[m.grade]}`}
          >
            <span aria-hidden className="font-display text-[56px] font-extrabold leading-none">{m.grade}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-extrabold leading-tight text-ink">{t('rapor.grade', { grade: m.grade })}</p>
            <p className="whitespace-nowrap font-mono text-base font-semibold text-ink-soft">{t('rapor.score', { score: m.score })}</p>
          </div>
          <Kancil mood={MOOD[m.grade]} size={64} className="shrink-0" />
        </section>

        <dl className="rounded-2xl bg-white px-4 py-1 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          <Row label={t('rapor.duit')}>{money(m.duit)}</Row>
          <Row label={t('rapor.labur')}>{money(m.laburValue)}</Row>
          <Row label={t('rapor.net')}>{money(m.netWorth)}</Row>
          <Row label={t('rapor.emergency')}>
            <span className={`inline-flex items-center gap-1 ${m.emergencyReached ? 'text-safe' : 'text-danger-ink'}`}>
              {m.emergencyReached ? <CircleCheck aria-hidden size={18} /> : <CircleX aria-hidden size={18} />}
              <span className="text-ink">
                {m.emergencyReached
                  ? t('rapor.emergency.yes', { target: money(m.emergencyTarget) })
                  : t('rapor.emergency.no', { amount: money(m.simpanan), target: money(m.emergencyTarget) })}
              </span>
            </span>
          </Row>
          <Row label={t('rapor.scams')}>{t('rapor.scams.value', { avoided: m.scamsAvoided, fell: m.scamsFellFor })}</Row>
          <Row label={t('rapor.flags')}>{m.flagsFound} / {m.flagsTotal}</Row>
          <Row label={t('rapor.judgement')}>{m.judgementPct}%</Row>
        </dl>

        <section role="group" aria-label={t('rapor.celik')} className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          <h2 className="font-display text-lg font-bold text-ink">{t('rapor.celik')}</h2>
          <div className="mt-2 flex flex-col gap-3">
            {m.celik.map((c) => (
              <MeterBar key={c.code} label={conceptName(c.code)} value={c.value} max={100} tone="kancil" display={`${Math.round(c.value)}%`} />
            ))}
          </div>
        </section>

        <section role="group" aria-label={t('rapor.imuniti')} className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          <h2 className="font-display text-lg font-bold text-ink">{t('rapor.imuniti')}</h2>
          <div className="mt-2 flex flex-col gap-3">
            {m.imuniti.map((c) => (
              <MeterBar key={c.code} label={tactic(c.code)} value={c.value} max={100} tone="indigo" display={`${Math.round(c.value)}%`} />
            ))}
          </div>
        </section>

        {FINALIST && <GoalResult />}
        {FINALIST && <Suspense fallback={<div className="min-h-12" />}><ShareButton /></Suspense>}
        {FINALIST && (
          <button
            type="button" onClick={() => navigate('/papan')}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98]"
          >
            <Trophy aria-hidden size={20} strokeWidth={1.75} />
            {t('rapor.papan')}
          </button>
        )}

        <section className="flex flex-col gap-3 rounded-2xl bg-kancil-soft p-4">
          <p className="flex items-start gap-2 text-base font-semibold leading-snug text-ink">
            <Dumbbell aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0" />
            {t('rapor.weakest', { name: weakestName })}
          </p>
          <button
            type="button" onClick={() => navigate('/harian')}
            className="min-h-12 rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
          >
            {t('rapor.train')}
          </button>
        </section>

        {m.rekod !== 'Bersih' && (
          <p className="rounded-2xl bg-danger-soft px-4 py-3 text-base leading-snug text-ink">
            {t(m.rekodCapped ? 'rapor.rekod.capped' : 'rapor.rekod.note', { rekod: m.rekod })}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {!confirming ? (
            <button
              type="button" onClick={() => setConfirming(true)}
              className="min-h-12 rounded-2xl bg-white px-4 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98]"
            >
              {t('rapor.newSemester')}
            </button>
          ) : (
            <div role="alertdialog" aria-label={t('rapor.newSemester')} className="rounded-2xl bg-danger-soft p-4">
              <p className="text-base text-ink">{t('rapor.newConfirm')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="min-h-12 rounded-2xl bg-white px-3 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25">
                  {t('rapor.newNo')}
                </button>
                <button type="button" onClick={() => void startNew()} className="min-h-12 rounded-2xl bg-danger px-3 text-base font-semibold text-white">
                  {t('rapor.newYes')}
                </button>
              </div>
            </div>
          )}
          <button
            type="button" onClick={() => navigate('/home')}
            className="min-h-12 rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    </div>
  );
}
