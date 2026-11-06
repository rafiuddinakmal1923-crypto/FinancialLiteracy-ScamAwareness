import { useCallback, useEffect } from 'react';
import { ArrowLeft, Info, MessageCircle } from 'lucide-react';
import { calcPresets } from 'virtual:celik-content';
import type { CalcPreset } from '../../engine/schemas';
import type { CalcTab } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate, replaceRoute, useRoute } from '../../shell/router';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { toast } from '../../ui/Toast';
import { KosSebenar } from './KosSebenar';
import { MesinMasa } from './MesinMasa';
import { SemakPulangan } from './SemakPulangan';

export const CALC_TABS: CalcTab[] = ['masa', 'pulangan', 'kos'];
export const KALKULATOR_PATH = '/kalkulator';
const isTab = (s: string | undefined): s is CalcTab => CALC_TABS.includes(s as CalcTab);

/**
 * S19 Kalkulator: Mesin Masa | Semak Pulangan | Kos Sebenar. Opened from the home tile it is a plain tool. Opened by a
 * chat ("Kira dulu", `?preset=<id>`) it is in scenario mode: inputs come from the preset, the first use gives +10 XP,
 * an unrealistic Semak Pulangan result counts as a found greed flag, and Kembali ke perbualan returns to the chat.
 */
export function Kalkulator({ params }: { params: Record<string, string> }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const { query } = useRoute();
  const resume = useGame((s) => s.calcResume);
  const tab: CalcTab = isTab(params.tab) ? params.tab : 'masa';
  const badTab = params.tab !== undefined && !isTab(params.tab);
  // Scenario mode needs a waiting chat and a hand-off from it (the preset, kept across tab changes as chat=1).
  const scenarioId = resume && (query.preset !== undefined || query.chat === '1') ? resume.id : null;
  const preset = (calcPresets ?? []).find((p) => p.id === query.preset && p.tab === tab) as CalcPreset | undefined;

  useEffect(() => {
    if (badTab) replaceRoute(KALKULATOR_PATH + '/masa');
  }, [badTab]);

  useEffect(() => {
    if (scenarioId && useGame.getState().calcUse(scenarioId)) toast(t('kalkulator.xp'), 'success');
  }, [scenarioId, t]);

  const flagGreed = useCallback(() => {
    if (scenarioId) useGame.getState().calcFlag('greed');
  }, [scenarioId]);

  const goTab = (next: CalcTab) => navigate(`${KALKULATOR_PATH}/${next}${scenarioId ? '?chat=1' : ''}`);
  const backToChat = () => {
    if (!resume) return;
    useGame.getState().calcReturn();
    navigate(`/sembang/${resume.id}`);
  };

  return (
    <div data-screen="kalkulator" className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-6">
        <div className="songket bg-indigo px-4 pb-4 text-paper">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t('common.back')}
              onClick={() => navigate(scenarioId ? `/sembang/${scenarioId}` : '/home')}
              className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full"
            >
              <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
            </button>
            <h1 className="font-display text-2xl font-bold">{t('kalkulator.title')}</h1>
          </div>
          <div role="tablist" aria-label={t('kalkulator.tabs')} className="mt-1 grid grid-cols-3 gap-1 rounded-2xl bg-ink/40 p-1">
            {CALC_TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`kalkulator-tab-${id}`}
                aria-selected={id === tab}
                aria-controls="kalkulator-panel"
                onClick={() => goTab(id)}
                className={`min-h-12 rounded-xl px-1 text-base font-bold leading-tight transition-colors duration-150 ${
                  id === tab ? 'bg-paper text-ink' : 'text-paper'
                }`}
              >
                {t(`kalkulator.tab.${id}`)}
              </button>
            ))}
          </div>
        </div>

        <p className="flex items-center gap-2 border-y-2 border-kancil bg-kancil-soft px-4 py-2 text-base font-semibold text-ink">
          <Info aria-hidden size={20} strokeWidth={2} className="shrink-0" />
          {t('kalkulator.strip')}
        </p>

        <div id="kalkulator-panel" role="tabpanel" aria-labelledby={`kalkulator-tab-${tab}`}>
          {preset && (
            <p className="mx-4 mt-4 flex items-start gap-2 text-base leading-snug text-ink">
              <MessageCircle aria-hidden size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-indigo" />
              {t('kalkulator.preset', { label: (lang === 'en' ? preset.label.en : undefined) ?? preset.label.ms })}
            </p>
          )}
          {/* Keyed so a different tab or preset starts from its own numbers. */}
          {tab === 'masa' && <MesinMasa key={`masa-${preset?.id ?? ''}`} preset={preset?.tab === 'masa' ? preset : undefined} />}
          {tab === 'pulangan' && (
            <SemakPulangan
              key={`pulangan-${preset?.id ?? ''}`}
              preset={preset?.tab === 'pulangan' ? preset : undefined}
              onUnrealistic={flagGreed}
            />
          )}
          {tab === 'kos' && <KosSebenar key={`kos-${preset?.id ?? ''}`} preset={preset?.tab === 'kos' ? preset : undefined} />}
        </div>
      </div>

      {scenarioId && (
        <div className="shrink-0 bg-paper/95 px-4 pb-4 pt-3 shadow-[0_-8px_24px_rgba(28,27,58,.12)]">
          <button
            type="button"
            onClick={backToChat}
            className="min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
          >
            {t('kalkulator.back')}
          </button>
        </div>
      )}
    </div>
  );
}
