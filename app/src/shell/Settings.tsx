import { useId, useState, type ReactNode } from 'react';
import { ArrowLeft, Languages, MonitorPlay, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { useGame } from '../state/game';
import { flushNow } from '../state/persist';
import { useSettings } from '../state/settings';
import { useT } from './i18n';
import { LangToggle } from './LangToggle';
import { navigate } from './router';

const VERSION = '0.1.0';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 font-display text-lg font-bold text-ink">{title}</h2>
      <div className="divide-y divide-indigo-soft rounded-2xl bg-white shadow-[0_2px_8px_rgba(28,27,58,.08)]">{children}</div>
    </section>
  );
}

function Switch({ label, hint, icon: Icon, on, onToggle }: {
  label: string; hint: string; icon: typeof Volume2; on: boolean; onToggle(): void;
}) {
  const hintId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-describedby={hintId}
      onClick={onToggle}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
    >
      <Icon aria-hidden size={24} strokeWidth={1.75} className="shrink-0 text-indigo" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-ink">{label}</span>
        <span id={hintId} className="block text-base text-ink-soft">{hint}</span>
      </span>
      <span aria-hidden className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-150 ${on ? 'bg-safe' : 'bg-indigo-soft'}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-150 ${on ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  );
}

/** S18: language, sound, reduced motion, DEMO watermark, reset progress, credits. */
export function Settings() {
  const t = useT();
  const s = useSettings();
  const [confirming, setConfirming] = useState(false);

  const reset = async () => {
    useGame.getState().reset();
    await flushNow();
    navigate('/');
  };

  return (
    <div data-screen="settings" className="flex flex-1 flex-col px-4 pb-10">
      <div className="flex items-center gap-1 pt-1">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={() => navigate('/home')}
          className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-ink"
        >
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-2xl font-bold text-ink">{t('settings.title')}</h1>
      </div>

      <Section title={t('settings.language')}>
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <span className="flex items-center gap-3 text-base font-semibold text-ink">
            <Languages aria-hidden size={24} strokeWidth={1.75} className="text-indigo" />
            {t(s.lang === 'ms' ? 'lang.msName' : 'lang.enName')}
          </span>
          <LangToggle />
        </div>
      </Section>

      <Section title={t('settings.prefs')}>
        <Switch label={t('settings.sound')} hint={t('settings.soundHint')} icon={Volume2} on={s.sound} onToggle={() => s.toggle('sound')} />
        <Switch
          label={t('settings.reducedMotion')} hint={t('settings.reducedMotionHint')} icon={Sparkles}
          on={s.reducedMotion} onToggle={() => s.toggle('reducedMotion')}
        />
        <Switch label={t('settings.demo')} hint={t('settings.demoHint')} icon={MonitorPlay} on={s.demo} onToggle={() => s.toggle('demo')} />
      </Section>

      <Section title={t('settings.progress')}>
        <div className="p-4">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-danger px-4 text-base font-semibold text-danger"
            >
              <RotateCcw aria-hidden size={20} strokeWidth={1.75} />
              {t('settings.reset')}
            </button>
          ) : (
            <div role="alertdialog" aria-label={t('settings.reset')} className="rounded-2xl bg-danger-soft p-4">
              <p className="text-base text-ink">{t('settings.resetConfirm')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="min-h-12 rounded-2xl bg-white px-3 text-base font-semibold text-ink">
                  {t('settings.resetNo')}
                </button>
                <button type="button" onClick={() => void reset()} className="min-h-12 rounded-2xl bg-danger px-3 text-base font-semibold text-white">
                  {t('settings.resetYes')}
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title={t('settings.credits')}>
        <div className="space-y-2 p-4 text-base leading-snug text-ink">
          <p>{t('settings.creditsBody')}</p>
          <p>{t('settings.sources')}</p>
          <p className="text-ink-soft">{t('settings.version', { v: VERSION })}</p>
        </div>
      </Section>
    </div>
  );
}
