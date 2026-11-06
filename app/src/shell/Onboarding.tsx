import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { BALANCE } from '../engine/balance';
import { useGame } from '../state/game';
import { formatRM } from '../ui/format';
import { Kancil } from '../ui/Kancil';
import { PORTRAIT, type CharacterId } from '../ui/portraits';
import { useT } from './i18n';
import { navigate } from './router';

const STEPS = 3;
const CHARACTERS: CharacterId[] = ['aina', 'amir'];
const CARD_BG: Record<CharacterId, string> = { aina: 'bg-[#FBE3E7]', amir: 'bg-[#DDF0EC]' };

function Dots({ step }: { step: number }) {
  const t = useT();
  return (
    <div role="img" aria-label={t('onboarding.progress', { n: step + 1, total: STEPS })} className="flex items-center gap-2">
      {Array.from({ length: STEPS }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 rounded-full transition-all duration-200 ${
            i === step ? 'w-8 bg-kancil' : i < step ? 'w-2.5 bg-indigo' : 'w-2.5 bg-indigo-soft'
          }`}
        />
      ))}
    </div>
  );
}

function ChooseStep({ choice, onChoose }: { choice: CharacterId | null; onChoose(c: CharacterId): void }) {
  const t = useT();
  return (
    <>
      <h1 className="font-display text-[28px] font-extrabold leading-tight text-ink">{t('onboarding.choose.title')}</h1>
      <p className="mt-2 text-base text-ink-soft">{t('onboarding.choose.body')}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {CHARACTERS.map((c) => {
          const on = choice === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => onChoose(c)}
              className={`relative flex flex-col items-center rounded-2xl bg-white p-3 pb-4 text-center shadow-[0_2px_8px_rgba(28,27,58,.08)] transition-[box-shadow,transform] duration-150 active:scale-[.98] ${
                on ? 'ring-[3px] ring-kancil' : 'ring-1 ring-indigo-soft'
              }`}
            >
              <span className={`flex w-full justify-center overflow-hidden rounded-xl ${CARD_BG[c]}`}>
                <img src={PORTRAIT[c]} alt="" className="mt-3 h-auto w-[78%]" draggable={false} />
              </span>
              <span className="mt-3 font-display text-xl font-bold text-ink">{t(`character.${c}`)}</span>
              <span className="text-base text-ink-soft">{t(`character.${c}.course`)}</span>
              {on && (
                <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-kancil text-ink">
                  <Check aria-hidden size={20} strokeWidth={2.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-indigo-soft px-4 py-3">
        <span className="text-base text-ink-soft">{t('onboarding.choose.name')}</span>
        {choice ? (
          <span data-testid="chosen-name" className="font-display text-lg font-bold text-ink">{t(`character.${choice}`)}</span>
        ) : (
          <span className="text-base text-ink-soft">{t('onboarding.choose.none')}</span>
        )}
      </div>
    </>
  );
}

function SituationStep({ choice }: { choice: CharacterId }) {
  const t = useT();
  const facts = [
    { label: t('onboarding.money.semester'), value: formatRM(BALANCE.start.duit) },
    { label: t('onboarding.money.job'), value: t('onboarding.money.perMonth', { amount: formatRM(BALANCE.income) }) },
    { label: t('onboarding.money.weeks'), value: t('onboarding.money.weeksValue', { n: BALANCE.semesterWeeks }) },
  ];
  return (
    <>
      <h1 className="font-display text-[28px] font-extrabold leading-tight text-ink">{t('onboarding.situation.title')}</h1>
      <div className="mt-5 overflow-hidden rounded-2xl bg-indigo text-paper shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <div className="flex items-center justify-between gap-2 bg-kancil px-4 py-2 text-ink">
          <span className="font-display text-base font-bold">{t('onboarding.card.uni')}</span>
          <span className="font-mono text-base font-semibold">{t('onboarding.card.uniShort')}</span>
        </div>
        <div className="flex items-center gap-4 p-4">
          <span className={`flex h-24 w-20 shrink-0 items-end justify-center overflow-hidden rounded-lg ${CARD_BG[choice]}`}>
            <img src={PORTRAIT[choice]} alt="" className="w-full" draggable={false} />
          </span>
          <div className="min-w-0">
            <p className="text-base opacity-80">{t('onboarding.card.label')}</p>
            <p className="font-display text-2xl font-bold">{t(`character.${choice}`)}</p>
            <p className="text-base">{t('onboarding.card.year', { course: t(`character.${choice}.course`) })}</p>
          </div>
        </div>
      </div>
      <p className="mt-5 text-lg leading-snug text-ink">
        {t('onboarding.situation.body', { duit: formatRM(BALANCE.start.duit), income: formatRM(BALANCE.income) })}
      </p>
      <dl className="mt-4 divide-y divide-indigo-soft rounded-2xl bg-white px-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        {facts.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="text-base text-ink-soft">{f.label}</dt>
            <dd className="font-mono text-base font-semibold text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function KancilStep() {
  const t = useT();
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-[28px] font-extrabold leading-tight text-ink">{t('onboarding.kancil.title')}</h1>
      <div className="mt-6 rounded-[18px] rounded-bl-[4px] bg-kancil-soft p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <p className="text-lg leading-snug text-ink">{t('onboarding.kancil.body')}</p>
      </div>
      <Kancil mood="smile" size={170} className="mt-3" />
      <p className="mt-3 text-base text-ink-soft">{t('onboarding.kancil.note')}</p>
    </div>
  );
}

/** S02: choose Aina or Amir (name fixed, ruling R1), the situation, meet Sang Kancil. */
export function Onboarding() {
  const t = useT();
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<CharacterId | null>(null);

  const enter = () => {
    if (!choice) return;
    // Week stays 0: the first Semester Pertama week intro opens week 1 (FR-21: costs arrive every week).
    useGame.getState().set({ character: choice, name: t(`character.${choice}`), onboarded: true });
    navigate('/home');
  };
  const last = step === STEPS - 1;

  return (
    <div data-screen="onboarding" className="flex flex-1 flex-col px-4 pb-6 pt-2">
      <div className="flex h-12 items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            aria-label={t('onboarding.back')}
            onClick={() => setStep(step - 1)}
            className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-ink"
          >
            <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
          </button>
        ) : (
          <span className="w-12" />
        )}
        <Dots step={step} />
        <span className="w-12" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="mt-4 flex flex-1 flex-col"
        >
          {step === 0 && <ChooseStep choice={choice} onChoose={setChoice} />}
          {step === 1 && choice && <SituationStep choice={choice} />}
          {step === 2 && <KancilStep />}
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        disabled={!choice}
        onClick={last ? enter : () => setStep(step + 1)}
        className="mt-6 min-h-14 w-full shrink-0 rounded-2xl bg-kancil px-6 font-display text-xl font-extrabold text-ink shadow-[0_4px_0_#D9822B] transition-opacity duration-150 disabled:opacity-40 disabled:shadow-none"
      >
        {last ? t('onboarding.enter') : t('onboarding.next')}
      </button>
    </div>
  );
}
