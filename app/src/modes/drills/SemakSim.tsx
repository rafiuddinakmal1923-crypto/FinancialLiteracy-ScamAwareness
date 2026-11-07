// S16: the simulated account check. A generic search box in the game's own look (never the official portal's), for
// the fictional accounts only. The real portal opens from one clearly labelled link that says it leaves the game.
import { useState } from 'react';
import { ExternalLink, Info, Search, ShieldAlert } from 'lucide-react';
import { drills } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { useT } from '../../shell/i18n';
import { useGame } from '../../state/game';
import { SimulasiBanner } from '../../ui/SimulasiBanner';
import { toast } from '../../ui/Toast';
import { useLoc } from '../harian/shared';
import { DrillHeader } from './parts';

/** The only address this game ever opens (CLAUDE.md rule 1). */
export const SEMAK_MULE_URL = 'https://semakmule.rmp.gov.my';
const MAX_LEN = 20;
const digits = (s: string) => s.replace(/\D/g, '');

export function SemakSim() {
  const t = useT();
  const loc = useLoc();
  const accounts = drills?.semak.accounts ?? [];
  const [value, setValue] = useState('');
  const [result, setResult] = useState<{ number: string; reports: number } | null>(null);

  const search = (raw: string) => {
    const number = raw.trim();
    if (!number) return;
    const found = accounts.find((a) => digits(a.number) === digits(number));
    const reports = found?.reports ?? 0;
    setResult({ number: found?.number ?? number, reports });
    if (reports > 0 && useGame.getState().completeDrill('semak')) toast(t('latihan.semak.xp', { xp: BALANCE.xp.drill }), 'success');
  };

  return (
    <div data-screen="latihan-semak" className="relative flex min-h-0 flex-1 flex-col bg-paper">
      <DrillHeader title={t('latihan.semak.title')} back="/latihan" />
      <SimulasiBanner />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {drills && <p className="text-base leading-snug text-ink-soft">{loc(drills.semak.hint)}</p>}
        <form
          onSubmit={(e) => { e.preventDefault(); search(value); }}
          className="mt-3 rounded-[24px] bg-indigo-soft p-4"
        >
          <h2 className="font-display text-lg font-extrabold text-indigo">{t('latihan.semak.boxTitle')}</h2>
          <label htmlFor="semak-no" className="mt-2 block text-base font-semibold text-ink">{t('latihan.semak.label')}</label>
          <div className="mt-1 flex gap-2">
            <input
              id="semak-no" type="text" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={MAX_LEN}
              value={value} placeholder="0000-0000-0000"
              onChange={(e) => setValue(e.target.value.replace(/[^0-9-]/g, ''))}
              className="min-h-12 min-w-0 flex-1 rounded-xl bg-white px-3 font-mono text-lg font-semibold text-ink ring-1 ring-indigo/30"
            />
            <button type="submit" disabled={value.trim() === ''} className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl bg-indigo px-4 text-base font-semibold text-paper disabled:opacity-50">
              <Search aria-hidden size={20} strokeWidth={2} />
              {t('latihan.semak.go')}
            </button>
          </div>
          <p className="mt-2 text-base leading-snug text-ink">{t('latihan.semak.helper')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a.number} type="button" onClick={() => { setValue(a.number); setResult(null); }}
                className="min-h-12 rounded-full bg-white px-3.5 font-mono text-base font-semibold text-indigo ring-1 ring-indigo/30"
              >
                {t('latihan.semak.try', { number: a.number })}
              </button>
            ))}
          </div>
        </form>

        {result && (
          <div role="status" aria-live="polite" className="mt-4">
            {result.reports > 0 ? (
              <div className="rounded-2xl bg-danger-soft p-4 ring-1 ring-danger">
                <p className="flex items-center gap-2 font-display text-xl font-extrabold text-danger-ink">
                  <ShieldAlert aria-hidden size={26} strokeWidth={2} />
                  {t('latihan.semak.reported', { n: result.reports })}
                </p>
                <p className="mt-1 font-mono text-base font-semibold text-ink">{result.number}</p>
                <p className="mt-1 text-base leading-snug text-ink">{t('latihan.semak.reportedBody')}</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/25">
                <p className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
                  <Info aria-hidden size={26} strokeWidth={2} className="text-ink-soft" />
                  {t('latihan.semak.clean')}
                </p>
                <p className="mt-1 font-mono text-base font-semibold text-ink">{result.number}</p>
                <p className="mt-1 text-base leading-snug text-ink">{t('latihan.semak.cleanBody')}</p>
              </div>
            )}
          </div>
        )}

        <section aria-labelledby="semak-real" className="mt-6 border-t border-ink/15 pt-4">
          <h2 id="semak-real" className="font-display text-lg font-extrabold text-ink">{t('latihan.semak.realTitle')}</h2>
          <a
            href={SEMAK_MULE_URL} target="_blank" rel="noopener noreferrer"
            className="mt-2 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-kancil px-4 text-base font-bold text-ink active:scale-[.98]"
          >
            {t('latihan.semak.realButton')}
            <ExternalLink aria-hidden size={20} strokeWidth={2} />
          </a>
          <p className="mt-2 text-base leading-snug text-ink-soft">{t('latihan.semak.realNote')}</p>
        </section>
      </div>
    </div>
  );
}
