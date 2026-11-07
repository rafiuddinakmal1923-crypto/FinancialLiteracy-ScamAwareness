// W5 Papan Markah (FR-84, D39): the player's semester score so far, ranked offline among 9 fictional classmates
// (rankClassmates). No network and no typed names: classmates come from content/classmates.json.
import { ArrowLeft, Flame } from 'lucide-react';
import { classmates } from 'virtual:celik-content';
import { rankClassmates } from '../../engine/papan';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { Avatar } from '../../ui/Avatar';
import { useReport } from '../kongsi/useReport';

export function Papan() {
  const t = useT();
  const name = useGame((s) => s.name);
  const streak = useGame((s) => s.swipe.streak);
  const { score, finished } = useReport();
  const rows = rankClassmates(score);
  const nameOf = (id: string) => classmates?.find((c) => c.id === id)?.name ?? id;
  const place = rows.findIndex((r) => r.player) + 1;
  return (
    <div data-screen="papan" className="flex min-h-0 flex-1 flex-col bg-paper">
      <header className="flex items-center gap-1 px-4 pt-1">
        <button type="button" aria-label={t('common.back')} onClick={() => navigate('/home')} className="-ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink">
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <div className="min-w-0 pr-16">
          <h1 className="font-display text-xl font-extrabold text-ink">{t('papan.title')}</h1>
          <p className="text-base text-ink-soft">{t(finished ? 'papan.subtitle.final' : 'papan.subtitle.sofar')}</p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <p className="mt-3 rounded-2xl bg-kancil-soft px-4 py-3 text-base font-semibold text-ink">
          {t('papan.place', { place, total: rows.length })}
        </p>
        <ol aria-label={t('papan.listLabel')} className="mt-3 flex flex-col gap-2">
          {rows.map((r, i) => {
            const label = r.player ? t('papan.you', { name }) : nameOf(r.id);
            return (
              <li
                key={r.id}
                data-row={r.id}
                aria-current={r.player ? 'true' : undefined}
                className={`flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 ${r.player ? 'bg-indigo text-paper shadow-[0_2px_8px_rgba(28,27,58,.2)]' : 'bg-white text-ink shadow-[0_2px_8px_rgba(28,27,58,.08)]'}`}
              >
                <span className={`w-7 shrink-0 text-center font-mono text-base font-semibold ${r.player ? 'text-paper' : 'text-ink-soft'}`}>{i + 1}</span>
                <Avatar name={r.player ? name : label} size={40} />
                <span className="min-w-0 flex-1 truncate text-base font-semibold">{label}</span>
                <span className="shrink-0 font-mono text-base font-semibold">{t('papan.score', { score: Math.round(r.grade) })}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 flex items-center gap-2 text-base text-ink">
          <Flame aria-hidden size={22} strokeWidth={1.75} className="shrink-0 text-kancil" />
          {t('papan.streak', { n: streak })}
        </p>
        <p className="mt-2 text-base text-ink-soft">{t('papan.note')}</p>
      </div>
    </div>
  );
}
