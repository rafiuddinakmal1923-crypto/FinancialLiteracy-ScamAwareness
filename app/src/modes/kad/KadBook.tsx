// S11: the Kad book. Bendera Merah (Red Flag cards, by tactic) and Kad Ilmu (one knowledge card per finance concept).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { concepts, scenarios } from 'virtual:celik-content';
import { deriveCards, type RedFlagCard } from '../../engine/cards';
import { CONCEPTS, TACTICS, type Tactic } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { CardTile } from '../../ui/CardTile';
import { TACTIC_ART } from '../../ui/cardArt';
import { firstSentence, KadTile } from '../../ui/KadTile';
import { useTactic } from '../../ui/tactics';
import { useLoc } from '../harian/shared';
import { localScenario } from '../semester/localScenario';

type Top = 'flags' | 'ilmu';

/** The big card for one collected Red Flag: the picture, the example line, how to spot it, what to do. */
function FlagSheet({ card, onClose }: { card: RedFlagCard; onClose: () => void }) {
  const t = useT();
  const tactic = useTactic();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button type="button" tabIndex={-1} aria-hidden onClick={onClose} className="absolute inset-0 bg-ink/50" />
      <div
        role="dialog" aria-modal="true" aria-label={t('card.label', { tactic: tactic(card.tactic), family: t(`family.${card.family}`) })}
        className="relative max-h-[88%] overflow-y-auto rounded-t-[24px] bg-paper px-4 pb-6 pt-4 shadow-[0_-8px_24px_rgba(28,27,58,.2)]"
      >
        <div className="flex items-center gap-3">
          <img src={TACTIC_ART[card.tactic]} alt="" width={56} height={56} draggable={false} className="h-14 w-14 shrink-0 rounded-2xl bg-danger-soft p-1.5" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold leading-tight text-ink">{tactic(card.tactic)}</h2>
            <p className="text-base text-ink-soft">{t(`family.${card.family}`)}</p>
          </div>
          <button ref={closeRef} type="button" aria-label={t('kad.detail.close')} onClick={onClose} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-ink/20">
            <X aria-hidden size={24} strokeWidth={1.75} />
          </button>
        </div>
        <h3 className="mt-4 font-display text-base font-bold text-ink">{t('kad.detail.example')}</h3>
        <p className="mt-1 rounded-2xl rounded-bl-[4px] bg-white px-4 py-3 text-base leading-snug text-ink ring-1 ring-danger/40">“{card.cue}”</p>
        <h3 className="mt-4 font-display text-base font-bold text-ink">{t('kad.detail.spot')}</h3>
        <p className="mt-1 text-base leading-snug text-ink">{tactic(card.tactic, 'does')}</p>
        <h3 className="mt-4 font-display text-base font-bold text-ink">{t('kad.detail.do')}</h3>
        <p className="mt-1 text-base leading-snug text-ink">{tactic(card.tactic, 'tip')}</p>
      </div>
    </div>
  );
}

function Flags() {
  const t = useT();
  const tactic = useTactic();
  const owned = useGame((s) => s.cards);
  const lang = useSettings((s) => s.lang);
  const all = useMemo(() => deriveCards(Object.values(scenarios).map((s) => localScenario(s, lang))), [lang]);
  const have = (c: RedFlagCard) => owned.includes(c.id);
  const byTactic = (k: Tactic) => all.filter((c) => c.tactic === k);
  const first = TACTICS.find((k) => byTactic(k).some(have)) ?? TACTICS[0];
  const [active, setActive] = useState<Tactic>(first);
  const [open, setOpen] = useState<RedFlagCard | null>(null);
  const list = byTactic(active);

  return (
    <>
      <div role="tablist" aria-label={t('kad.tactics')} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TACTICS.map((k) => {
          const cards = byTactic(k);
          const on = k === active;
          return (
            <button
              key={k} type="button" role="tab" id={`kad-sub-${k}`} aria-selected={on} aria-controls="kad-flags-panel"
              onClick={() => setActive(k)}
              className={`flex min-h-12 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-base font-semibold ${on ? 'bg-ink text-paper' : 'bg-white text-ink ring-1 ring-inset ring-ink/20'}`}
            >
              <img src={TACTIC_ART[k]} alt="" aria-hidden width={24} height={24} className="h-6 w-6" draggable={false} />
              {tactic(k)}
              <span className="font-mono">{cards.filter(have).length}/{cards.length}</span>
            </button>
          );
        })}
      </div>
      <div id="kad-flags-panel" role="tabpanel" aria-labelledby={`kad-sub-${active}`} className="mt-3">
        {list.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-base text-ink">{t('kad.empty')}</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {list.map((c) => (
              <li key={c.id} className="flex">
                {have(c) ? (
                  <button
                    type="button" onClick={() => setOpen(c)}
                    aria-label={t('card.label', { tactic: tactic(c.tactic), family: t(`family.${c.family}`) })}
                    className="flex w-full rounded-2xl text-left active:scale-[.97]"
                  >
                    <CardTile tactic={c.tactic} family={c.family} cue={c.cue} className="w-full" />
                  </button>
                ) : (
                  <CardTile tactic={c.tactic} family={c.family} state="locked" className="w-full" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {open && <FlagSheet card={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Ilmu() {
  const t = useT();
  const loc = useLoc();
  const earned = useGame((s) => s.kadIlmu);
  return (
    <ul id="kad-ilmu-panel" role="tabpanel" aria-labelledby="kad-top-ilmu" className="grid grid-cols-2 gap-3">
      {CONCEPTS.map((code) => {
        const info = concepts?.find((c) => c.code === code);
        const name = info ? loc(info.name) : code;
        const has = earned.includes(code) && !!info;
        return (
          <li key={code} className="flex">
            {has && info ? (
              <button
                type="button" onClick={() => navigate(`/kad/ilmu/${code}`)}
                aria-label={t('kad.ilmu.label', { name })}
                className="flex w-full rounded-2xl text-left active:scale-[.97]"
              >
                <KadTile concept={code} name={name} apa={firstSentence(loc(info.apa))} className="w-full" />
              </button>
            ) : (
              <KadTile concept={code} name={name} locked className="w-full" />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function KadBook() {
  const t = useT();
  const owned = useGame((s) => s.cards);
  const earned = useGame((s) => s.kadIlmu);
  const [top, setTop] = useState<Top>('flags');
  const all = useMemo(() => deriveCards(Object.values(scenarios)), []);
  const ids = useMemo(() => new Set(all.map((c) => c.id)), [all]);
  const found = top === 'flags' ? new Set(owned.filter((id) => ids.has(id))).size : earned.filter((c) => CONCEPTS.includes(c)).length;
  const total = top === 'flags' ? all.length : CONCEPTS.length;
  const TABS: [Top, string][] = [['flags', t('kad.tab.flags')], ['ilmu', t('kad.tab.ilmu')]];

  return (
    <div data-screen="kad" className="relative flex min-h-0 flex-1 flex-col bg-paper">
      <div className="songket bg-indigo px-4 pb-4 text-paper">
        <div className="flex items-center gap-1">
          <button type="button" aria-label={t('common.back')} onClick={() => navigate('/home')} className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full">
            <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
          </button>
          <h1 className="flex-1 font-display text-2xl font-extrabold">{t('kad.title')}</h1>
        </div>
        <p className="ml-1 mt-1 inline-block rounded-full bg-paper/15 px-3 py-1 font-mono text-base font-semibold">{t('kad.count', { found, total })}</p>
        <div role="tablist" aria-label={t('kad.tabs')} className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-paper/15 p-1">
          {TABS.map(([id, label]) => (
            <button
              key={id} type="button" role="tab" id={`kad-top-${id}`} aria-selected={top === id}
              onClick={() => setTop(id)}
              className={`min-h-12 rounded-xl px-2 text-base font-semibold ${top === id ? 'bg-paper text-ink' : 'text-paper'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {top === 'flags' ? <Flags /> : <Ilmu />}
      </div>
    </div>
  );
}
