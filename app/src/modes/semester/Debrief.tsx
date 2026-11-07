import { Flag } from 'lucide-react';
import { cardId } from '../../engine/cards';
import { isRight } from '../../engine/meters';
import type { Tactic } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { CardTile } from '../../ui/CardTile';
import { CoachSheet } from '../../ui/CoachSheet';
import type { KancilMood } from '../../ui/Kancil';
import { useTactic } from '../../ui/tactics';
import { toast } from '../../ui/Toast';
import { useConceptName } from '../harian/shared';
import { huntTactics } from './flagText';
import { outcomeTone, useEnded } from './aftermath';

const PILL = {
  danger: 'bg-danger-soft text-danger',
  safe: 'bg-safe-soft text-safe',
  warning: 'bg-kancil-soft text-ink',
} as const;

/** S10: Sang Kancil's debrief. Closing it records the result (finishScenario, once) and goes home. */
export function Debrief({ params }: { params: Record<string, string> }) {
  const id = params.id ?? '';
  const t = useT();
  const tn = useTactic();
  const { ended, scenario, leave } = useEnded(id);
  const owned = useGame((s) => s.cards);
  const conceptName = useConceptName();
  if (!ended || !scenario) return null;

  const { meta } = scenario;
  const targets = huntTactics(ended.transcript);
  const flagsFound = targets.filter((x) => ended.found.includes(x)).length;
  const scam = meta.type === 'scam';
  const tone = outcomeTone(ended.outcome);
  const praise = isRight(ended.outcome);
  const mood: KancilMood = praise ? 'proud' : tone === 'warning' ? 'smile' : 'worried';
  // Cards this chat offers, in the order the flags appear (found ones collected, the rest still locked).
  const cardTactics: Tactic[] = scam ? targets : [];

  const close = () => leave(() => {
    const s = useGame.getState();
    if (s.lastEnded?.id !== id) { navigate('/home'); return; }
    const before = s.active?.id === id ? s.active.snapshot.xp : s.meters.xp;
    s.finishScenario(meta, ended.outcome, flagsFound, targets.length);
    const gained = useGame.getState().meters.xp - before;
    toast(t('debrief.xp', { n: `${gained >= 0 ? '+' : ''}${gained}` }), 'success');
    // Kad Ilmu (Task 25): a finance or legit scenario's concepts are earned once, when its debrief closes.
    if (meta.type !== 'scam') {
      for (const c of useGame.getState().awardKadIlmu(meta.concepts)) toast(t('debrief.kadIlmu', { name: conceptName(c) }), 'success');
    }
    navigate('/home');
  });

  return (
    <div data-screen="debrief" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <section className="px-4 pb-10 pt-3">
        <div className="flex flex-wrap items-center gap-2 pr-16">
          <span className={`rounded-full px-3 py-1 text-base font-semibold ${PILL[tone]}`}>{t(`outcome.${ended.outcome}`)}</span>
          {targets.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-base font-semibold text-ink ring-1 ring-indigo-soft">
              <Flag aria-hidden size={18} strokeWidth={2} className="fill-danger text-danger" />
              {t('debrief.flags', { found: flagsFound, n: targets.length })}
            </span>
          )}
        </div>
        {cardTactics.length > 0 && (
          <>
            <h1 className="mt-4 font-display text-xl font-bold text-ink">{t('debrief.cards')}</h1>
            <ul className="mt-2 grid grid-cols-3 gap-2">
              {cardTactics.map((tac) => (
                <li key={tac} className="flex">
                  <CardTile
                    tactic={tac}
                    family={meta.family}
                    state={ended.found.includes(tac) ? 'new' : owned.includes(cardId(tac, meta.family)) ? 'collected' : 'locked'}
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="mt-auto">
        <CoachSheet
          mood={mood}
          title={t(scam ? 'debrief.title' : 'debrief.titleLegit')}
          tone={praise ? 'praise' : 'tip'}
        >
          <div className="mt-2 space-y-4">
            {meta.tactics.length > 0 ? (
              <p className="text-base leading-snug text-ink">
                {t('debrief.tactics')}{' '}
                <strong className="font-semibold">{meta.tactics.map((x) => tn(x)).join(' + ')}</strong>
              </p>
            ) : (
              <p className="text-base leading-snug text-ink">{t('debrief.noTactics')}</p>
            )}
            {meta.tactics.length > 0 && (
              <div>
                <h2 className="font-display text-base font-bold text-ink">{t('debrief.tips')}</h2>
                <ul className="mt-1.5 space-y-2">
                  {meta.tactics.map((x) => (
                    <li key={x} className="flex gap-2 text-base leading-snug text-ink">
                      <Flag aria-hidden size={18} strokeWidth={2} className="mt-0.5 shrink-0 fill-danger text-danger" />
                      <span><strong className="font-semibold">{tn(x)}.</strong> {tn(x, 'tip')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {meta.apaPatut.length > 0 && (
              <div>
                <h2 className="font-display text-base font-bold text-ink">{t('debrief.apaPatut')}</h2>
                <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-base leading-snug text-ink marker:text-kancil">
                  {meta.apaPatut.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            )}
          </div>
        </CoachSheet>
        {/* The one button stays in the thumb zone while the debrief scrolls. */}
        <div className={`sticky bottom-0 z-10 px-4 pb-3 pt-2 ${praise ? 'bg-safe-soft' : 'bg-kancil-soft'}`}>
          <button
            type="button"
            onClick={close}
            className="min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
          >
            {t('debrief.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
