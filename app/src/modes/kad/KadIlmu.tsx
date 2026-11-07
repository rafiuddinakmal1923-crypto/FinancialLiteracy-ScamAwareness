// S21: one Kad Ilmu in full. Real scheme names come from content/concepts.json (D27); every figure carries its year.
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { concepts } from 'virtual:celik-content';
import type { ConceptInfo } from '../../engine/schemas';
import { FINALIST } from '../../shell/features';
import { useT } from '../../shell/i18n';
import { navigate, replaceRoute } from '../../shell/router';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { CONCEPT_ART } from '../../ui/cardArt';
import { ExplainerSlot } from '../tonton/ExplainerSlot';

function Section({ title, text, alwaysTag = false }: { title: string; text: ConceptInfo['apa']; alwaysTag?: boolean }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const body = (lang === 'en' ? text.en : undefined) ?? text.ms;
  // A figure shows where it comes from: a named source, else "contoh, <year>, perlu disahkan".
  const needsTag = alwaysTag || text.verify !== undefined || text.year !== undefined || text.source !== undefined;
  const tag = text.source
    ? (text.year !== undefined ? `${text.source}, ${text.year}` : text.source)
    : text.year !== undefined ? t('ilmu.figure', { year: text.year }) : t('ilmu.figureNoYear');
  return (
    <section className="mt-4">
      <h2 className="font-display text-lg font-extrabold text-ink">{title}</h2>
      <p className="mt-1 text-base leading-relaxed text-ink">{body}</p>
      {needsTag && <p className="mt-1 inline-block rounded-full bg-kancil-soft px-3 py-0.5 text-base text-ink-soft">{tag}</p>}
    </section>
  );
}

export function KadIlmu({ params }: { params: Record<string, string> }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const earned = useGame((s) => s.kadIlmu);
  const info = concepts?.find((c) => c.code === params.code);
  const ok = !!info && earned.includes(info.code);

  useEffect(() => {
    if (!ok) replaceRoute('/kad');
  }, [ok]);
  if (!info || !ok) return null;

  const name = (lang === 'en' ? info.name.en : undefined) ?? info.name.ms;
  return (
    <div data-screen="kad-ilmu" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-paper px-4 pb-6">
      <div className="flex items-center gap-1 pt-1">
        <button type="button" aria-label={t('common.back')} onClick={() => navigate('/kad')} className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-ink">
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
      </div>
      <article className="rounded-[24px] border-4 border-kancil bg-white px-4 pb-5 pt-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <header className="flex items-center gap-3">
          <img src={CONCEPT_ART[info.code]} alt="" width={64} height={64} draggable={false} className="h-16 w-16 shrink-0 rounded-2xl bg-kancil-soft p-1.5" />
          <h1 className="font-display text-2xl font-extrabold leading-tight text-ink">{name}</h1>
        </header>
        <Section title={t('ilmu.apa')} text={info.apa} />
        <Section title={t('ilmu.contoh')} text={info.contoh} alwaysTag />
        <Section title={t('ilmu.dunia')} text={info.duniaSebenar} />
        <Section title={t('ilmu.semak')} text={info.caraSemak} />
        <p className="mt-5 border-t border-kancil/50 pt-3 text-base italic text-ink-soft">{t('ilmu.footer')}</p>
      </article>
      {FINALIST && <ExplainerSlot concept={info.code} />}
    </div>
  );
}
