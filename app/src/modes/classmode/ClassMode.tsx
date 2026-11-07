// Mod Kelas (S17): a projector card battle for 2-6 teams, driven from one laptop. No phone frame, no student devices.
import { useEffect, useReducer, useState, type ReactNode } from 'react';
import { Minus, Plus, Presentation, Trophy, X } from 'lucide-react';
import { cards, moneyCards } from 'virtual:celik-content';
import {
  classReducer, currentCard, deckFor, initialClassState, ranked, totalRounds, winners,
  type CardSet, TEAM_DEFAULTS } from '../../engine/classmode';
import { BALANCE } from '../../engine/balance';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useTactic } from '../../ui/tactics';
import { useLoc } from '../harian/shared';
import {
  BigCard, Confetti, correctLabel, onColor, ScoreRows, TeamPanel, TeamShape, VerdictPanel,
} from './parts';

const BIG_BTN =
  'flex min-h-[88px] items-center justify-center gap-3 rounded-3xl px-12 font-display text-[40px] font-extrabold shadow-[0_6px_0_rgba(0,0,0,.3)] active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,.3)]';
const BTN_AMBER = `${BIG_BTN} bg-kancil text-ink`;
const BTN_PAPER = `${BIG_BTN} bg-paper text-indigo`;
const SETS: CardSet[] = ['scam', 'duit', 'campur'];

function ExitDialog({ onStay, onLeave }: { onStay(): void; onLeave(): void }) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onStay(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStay]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-6">
      <div role="alertdialog" aria-modal="true" aria-labelledby="kelas-exit-title" aria-describedby="kelas-exit-body"
        className="flex w-full max-w-[860px] flex-col gap-6 rounded-[40px] bg-paper p-10 text-ink shadow-2xl">
        <h2 id="kelas-exit-title" className="font-display text-[44px] font-extrabold leading-tight">{t('kelas.exit.title')}</h2>
        <p id="kelas-exit-body" className="text-[32px] leading-snug">{t('kelas.exit.body')}</p>
        <div className="flex flex-wrap gap-4">
          <button type="button" autoFocus onClick={onStay} className={`${BIG_BTN} bg-indigo text-paper`}>{t('kelas.exit.stay')}</button>
          <button type="button" onClick={onLeave} className={`${BIG_BTN} bg-white text-indigo ring-4 ring-indigo`}>{t('kelas.exit.confirm')}</button>
        </div>
      </div>
    </div>
  );
}

function Pips({ round, total }: { round: number; total: number }) {
  return (
    <span aria-hidden className="hidden items-center gap-2 lg:flex">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-4 w-4 rounded-full ${i < round ? 'bg-kancil' : i === round ? 'bg-paper' : 'bg-paper/25'}`} />
      ))}
    </span>
  );
}

export function ClassMode(_props: { params: Record<string, string> }) {
  const t = useT();
  const loc = useLoc();
  const tactic = useTactic();
  const [state, dispatch] = useReducer(classReducer, undefined, initialClassState);
  // A team still on its default name shows it in the current language; a name the class typed stays as typed.
  const s = { ...state, teams: state.teams.map((x, i) => (x.name === TEAM_DEFAULTS[i]?.name ? { ...x, name: t(`kelas.team.default.${i}`) } : x)) };
  const [leaving, setLeaving] = useState(false);
  const card = currentCard(s);
  const total = totalRounds(s);
  const ready = (set: CardSet) => !!cards && cards.length > 0 && (set === 'scam' || (!!moneyCards && moneyCards.length > 0));
  const indexOf = (id: string) => s.teams.findIndex((x) => x.id === id);

  const start = () => {
    if (!cards || !ready(s.cardSet)) return;
    dispatch({ type: 'start', deck: deckFor(s.cardSet, Date.now() >>> 0, cards, moneyCards ?? []) });
  };

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 lg:pl-10 lg:pr-28">
      <div className="flex items-center gap-4">
        <Presentation aria-hidden size={40} className="text-kancil" />
        <h1 className="font-display text-[32px] font-extrabold leading-none text-paper">{t('kelas.title')}</h1>
      </div>
      {(s.phase === 'question' || s.phase === 'reveal' || s.phase === 'scores') && (
        <div className="flex items-center gap-6">
          <p className="font-display text-[40px] font-extrabold leading-none text-paper">{t('kelas.round', { n: s.round + 1, total })}</p>
          <Pips round={s.round} total={total} />
        </div>
      )}
      <button type="button" onClick={() => setLeaving(true)}
        className="flex min-h-[72px] items-center gap-3 rounded-2xl bg-paper/10 px-6 font-display text-[32px] font-extrabold text-paper ring-2 ring-paper/50">
        <X aria-hidden size={32} />{t('kelas.exit')}
      </button>
    </header>
  );

  let body: ReactNode = null;
  if (s.phase === 'lobby') {
    body = (
      <div className="mx-auto grid w-full max-w-[1700px] flex-1 content-center grid-cols-[minmax(0,1fr)] gap-10 px-6 pb-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:px-10">
        <section className="flex flex-col gap-6" aria-labelledby="kelas-teams">
          <p className="text-[32px] leading-snug text-paper/90">{t('kelas.lobby.sub')}</p>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] bg-paper/10 p-4 ring-2 ring-paper/30">
            <h2 id="kelas-teams" className="font-display text-[32px] font-extrabold text-paper">{t('kelas.teams')}</h2>
            <div className="flex items-center gap-4">
              <button type="button" aria-label={t('kelas.teams.less')} disabled={s.teams.length <= BALANCE.kelas.minTeams}
                onClick={() => dispatch({ type: 'setTeams', count: s.teams.length - 1 })}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-paper text-indigo disabled:opacity-40"><Minus aria-hidden size={36} strokeWidth={3} /></button>
              <span aria-live="polite" className="w-16 text-center font-display text-[56px] font-extrabold leading-none text-paper">{s.teams.length}</span>
              <button type="button" aria-label={t('kelas.teams.more')} disabled={s.teams.length >= BALANCE.kelas.maxTeams}
                onClick={() => dispatch({ type: 'setTeams', count: s.teams.length + 1 })}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-paper text-indigo disabled:opacity-40"><Plus aria-hidden size={36} strokeWidth={3} /></button>
            </div>
          </div>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
            {s.teams.map((team, i) => (
              <li key={team.id} className="flex items-center gap-3">
                <span aria-hidden className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl ring-2 ring-paper/60" style={{ backgroundColor: team.color, color: onColor(team.color) }}>
                  <TeamShape index={i} size={36} />
                </span>
                <input
                  type="text" maxLength={20} value={team.name} aria-label={t('kelas.teamName', { n: i + 1 })}
                  onChange={(e) => dispatch({ type: 'renameTeam', id: team.id, name: e.target.value })}
                  className="h-[72px] min-w-0 flex-1 rounded-2xl bg-white px-5 font-display text-[32px] font-bold text-ink"
                />
              </li>
            ))}
          </ul>
        </section>
        <section className="flex flex-col gap-5" aria-labelledby="kelas-set">
          <h2 id="kelas-set" className="font-display text-[32px] font-extrabold text-paper">{t('kelas.set')}</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
            {SETS.map((set) => (
              <button key={set} type="button" aria-pressed={s.cardSet === set}
                onClick={() => dispatch({ type: 'setCardSet', cardSet: set })}
                className={`flex min-h-[96px] flex-col items-start justify-center gap-1 rounded-[28px] border-4 px-7 py-3 text-left ${s.cardSet === set ? 'border-kancil bg-kancil text-ink' : 'border-paper/40 bg-paper/10 text-paper'}`}>
                <span className="font-display text-[40px] font-extrabold leading-none">{t(`kelas.set.${set}`)}</span>
                <span className="text-[32px] leading-snug">{t(`kelas.set.${set}.sub`)}</span>
              </button>
            ))}
          </div>
          {!ready(s.cardSet) && <p role="alert" className="text-[32px] font-semibold text-kancil">{t('kelas.unavailable')}</p>}
          <button type="button" disabled={!ready(s.cardSet)} onClick={start} className={`${BTN_PAPER} disabled:opacity-40`}>{t('kelas.start')}</button>
        </section>
      </div>
    );
  } else if ((s.phase === 'question' || s.phase === 'reveal') && card) {
    const revealed = s.phase === 'reveal';
    const answered = s.teams.filter((x) => x.answer).length;
    const tactics = card.kind === 'swipe' ? card.card.tactics.map((k) => tactic(k)) : [];
    body = (
      <>
        <p role="status" className="sr-only">{revealed ? t('kelas.announce', { answer: correctLabel(card, t, loc) }) : ''}</p>
        <div className="mx-auto flex w-full max-w-[1700px] flex-1 flex-col items-center justify-center gap-6 px-6 lg:px-10">
          <div className={`grid w-full grid-cols-[minmax(0,1fr)] items-start gap-6 ${revealed ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : 'mx-auto max-w-[1300px]'}`}>
            <BigCard card={card} reveal={revealed} />
            {revealed && <div className="lg:pt-[52px]"><VerdictPanel card={card} tactics={tactics} /></div>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {revealed ? (
              <button type="button" autoFocus onClick={() => dispatch({ type: 'next' })} className={BTN_AMBER}>{t('kelas.toScores')}</button>
            ) : (
              <>
                <button type="button" onClick={() => dispatch({ type: 'reveal' })} className={BTN_AMBER}>{t('kelas.reveal')}</button>
                <p className="text-[32px] font-semibold text-paper">{t('kelas.answered', { n: answered, total: s.teams.length })}</p>
              </>
            )}
          </div>
        </div>
        <div
          className="grid w-full grid-cols-[minmax(0,1fr)] gap-4 px-6 pb-8 pt-6 sm:grid-cols-2 lg:px-10 lg:[grid-template-columns:repeat(var(--lg),minmax(0,1fr))] 2xl:[grid-template-columns:repeat(var(--teams),minmax(0,1fr))]"
          style={{ ['--teams' as string]: s.teams.length, ['--lg' as string]: Math.min(s.teams.length, 3) }}
        >
          {s.teams.map((team, i) => (
            <TeamPanel key={team.id} team={team} index={i} card={card} phase={s.phase as 'question' | 'reveal'}
              gain={s.lastGain[team.id] ?? 0} onAnswer={(a) => dispatch({ type: 'answer', teamId: team.id, answer: a })} />
          ))}
        </div>
      </>
    );
  } else if (s.phase === 'scores') {
    const last = s.round >= total - 1;
    body = (
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center gap-10 px-6 pb-12 lg:px-10">
        <h2 className="font-display text-[56px] font-extrabold leading-none text-paper">{t('kelas.scores')}</h2>
        <ScoreRows teams={ranked(s)} indexOf={indexOf} gains={s.lastGain} />
        <div>
          <button type="button" autoFocus onClick={() => dispatch({ type: 'next' })} className={BTN_AMBER}>
            {t(last ? 'kelas.toWinner' : 'kelas.next')}
          </button>
        </div>
      </div>
    );
  } else if (s.phase === 'winner') {
    const top = winners(s);
    const names = top.map((x) => x.name).join(', ');
    body = (
      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center gap-8 px-6 pb-12 lg:px-10">
        <Confetti colors={s.teams.map((x) => x.color)} />
        <div className="relative z-10 flex flex-col gap-6">
          <Trophy aria-hidden size={96} className="text-kancil" strokeWidth={1.75} />
          <h2 className="break-words font-display text-[48px] font-extrabold leading-tight text-paper lg:text-[72px]">
            {t(top.length > 1 ? 'kelas.winner.tie' : 'kelas.winner.one', { names })}
          </h2>
          <p className="text-[32px] text-paper/90">{t('kelas.points', { n: top[0].score })}. {t('kelas.winner.sub')}</p>
          <div className="rounded-[32px] bg-ink/60 p-6 ring-2 ring-paper/20">
            <ScoreRows teams={ranked(s)} indexOf={indexOf} gains={{}} />
          </div>
          <div className="flex flex-wrap gap-6">
            <button type="button" autoFocus onClick={() => dispatch({ type: 'lobby' })} className={BTN_AMBER}>{t('kelas.again')}</button>
            <button type="button" onClick={() => navigate('/home')} className={BTN_PAPER}>{t('kelas.done')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main data-screen="kelas" data-phase={s.phase} className="songket relative flex min-h-dvh w-full flex-col bg-indigo text-paper">
      <div className="relative z-10 flex min-h-dvh flex-col">
        {header}
        {body}
      </div>
      {leaving && <ExitDialog onStay={() => setLeaving(false)} onLeave={() => navigate('/home')} />}
    </main>
  );
}
