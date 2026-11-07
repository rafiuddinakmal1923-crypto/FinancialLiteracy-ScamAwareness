// S20 Cek Harian: the 2-minute daily booster. Five cards (three messages, two money cards), no timer, a one-line
// reason after each answer, then results. Once a day: replays show "Datang lagi esok" and change nothing.
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Snowflake } from 'lucide-react';
import { cards, moneyCards } from 'virtual:celik-content';
import { dailyDeck, type DeckCard } from '../../engine/harian';
import { isoWeek, localDate } from '../../engine/dates';
import type { Tactic } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { Kancil } from '../../ui/Kancil';
import { useTactic } from '../../ui/tactics';
import { MoneyBack, MoneyButtons, MoneyFront, type MoneyChoice } from './MoneyCard';
import { SwipeBack, SwipeButtons, SwipeFront, type SwipeChoice } from './SwipeCard';
import { BTN_PRIMARY, BTN_SECONDARY, FlipCard, GameHeader, PANEL, Unavailable, useConceptName, useLoc, useReducedMotion } from './shared';

export const DECK_SIZE = 5;
type Phase = 'play' | 'results' | 'done';
type Choice = SwipeChoice | MoneyChoice;

/** Is `choice` the right answer for this card? */
function isRight(dc: DeckCard, choice: Choice): boolean {
  if (dc.kind === 'swipe') return choice === dc.card.answer;
  return dc.card.kind === 'truefalse' ? choice === dc.card.answer : choice === dc.card.better;
}

/** "YYYY-MM-DD" shifted by `n` days (local calendar maths). */
function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + n));
}

function dowOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** The last 7 days as dots, ending today; a day is lit when it falls in the streak that ends on `lastPlayed`. */
export function streakDays(today: string, lastPlayed: string | null, streak: number): { date: string; played: boolean }[] {
  const lit = new Set<string>();
  if (lastPlayed) for (let i = 0; i < streak; i++) lit.add(addDays(lastPlayed, -i));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return { date, played: lit.has(date) };
  });
}

function StreakCalendar({ today }: { today: string }) {
  const t = useT();
  const { lastPlayed, streak } = useGame((s) => s.harian);
  const days = streakDays(today, lastPlayed, streak);
  return (
    <div role="group" aria-label={t('harian.calendar')} className="flex justify-between gap-1">
      {days.map((d) => {
        const dow = t(`harian.dow.${dowOf(d.date)}`);
        return (
          <div key={d.date} data-testid="streak-day" aria-label={t(d.played ? 'harian.day.played' : 'harian.day.missed', { day: dow })} role="img" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${d.played ? 'bg-danger-soft text-danger ring-2 ring-danger' : 'bg-indigo-soft text-ink-soft'}`}>
              {d.played ? <Flame aria-hidden size={22} strokeWidth={2} className="fill-danger" /> : <span aria-hidden className="h-2 w-2 rounded-full bg-ink-soft/50" />}
            </span>
            <span aria-hidden className="text-base text-ink-soft">{dow}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Hours and minutes to the next local midnight. */
function untilMidnight(now = new Date()): { h: number; m: number } {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const mins = Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 60_000));
  return { h: Math.floor(mins / 60), m: mins % 60 };
}

function useCountdown() {
  const [left, setLeft] = useState(() => untilMidnight());
  useEffect(() => {
    const id = setInterval(() => setLeft(untilMidnight()), 30_000);
    return () => clearInterval(id);
  }, []);
  return left;
}

function HeaderInfo({ today }: { today: string }) {
  const t = useT();
  const harian = useGame((s) => s.harian);
  const freezeFree = harian.freezeWeek !== isoWeek(today);
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex items-center gap-1 rounded-full bg-paper/15 px-2.5 py-1 font-mono text-base font-semibold">
        <Flame aria-hidden size={18} strokeWidth={2} className="fill-kancil text-kancil" />
        {t('harian.streakDays', { n: harian.streak })}
      </span>
      <span aria-label={t(freezeFree ? 'harian.freeze.ok' : 'harian.freeze.used')} className="flex items-center gap-1 text-base">
        <Snowflake aria-hidden size={18} strokeWidth={2} className={freezeFree ? 'text-sky-200' : 'text-paper/50'} />
        <span aria-hidden>{t(freezeFree ? 'harian.freeze.short.ok' : 'harian.freeze.short.used')}</span>
      </span>
      <p className="basis-full text-base text-paper/85">{t('harian.sub')}</p>
    </div>
  );
}

function ComeBack({ today, onNewDay }: { today: string; onNewDay: (day: string) => void }) {
  const t = useT();
  const left = useCountdown();
  // The countdown ends at midnight: the new day's cards open without a reload.
  useEffect(() => {
    const check = () => { if (localDate() !== today) onNewDay(localDate()); };
    const id = setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [today, onNewDay]);
  const { lastScore } = useGame((s) => s.harian);
  return (
    <div data-screen="harian" className="flex min-h-0 flex-1 flex-col">
      <GameHeader title={t('harian.title')}><HeaderInfo today={today} /></GameHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <div className={`${PANEL} flex flex-col items-center gap-2 px-4 py-5 text-center`}>
          <Kancil mood="smile" size={80} decorative />
          <h2 className="font-display text-[28px] font-extrabold leading-tight text-ink">{t('harian.comeBack')}</h2>
          <p className="text-lg text-ink-soft">{t('harian.comeBackIn', { h: left.h, m: left.m })}</p>
          {lastScore !== null && (
            <p className="mt-1 text-base font-semibold text-ink">
              {t('harian.todayScore')}: <span className="font-mono">{t('harian.score', { n: lastScore, total: DECK_SIZE })}</span>
            </p>
          )}
        </div>
        <div className={`${PANEL} p-4`}><StreakCalendar today={today} /></div>
      </div>
      <div className="grid shrink-0 gap-2.5 px-4 pb-5 pt-2">
        <button type="button" className={BTN_PRIMARY} onClick={() => navigate('/swipe')}>{t('harian.play60')}</button>
        <button type="button" className={BTN_SECONDARY} onClick={() => navigate('/home')}>{t('harian.done')}</button>
      </div>
    </div>
  );
}

function Results({ deck, answers, today }: { deck: DeckCard[]; answers: boolean[]; today: string }) {
  const t = useT();
  const reduced = useReducedMotion();
  const tactic = useTactic();
  const concept = useConceptName();
  const streak = useGame((s) => s.harian.streak);
  const score = answers.filter(Boolean).length;
  const band = score >= 4 ? 'high' : score >= 2 ? 'mid' : 'low';
  const misses = deck.map((dc, i) => ({ dc, i })).filter(({ i }) => !answers[i]);
  const label = (dc: DeckCard): string[] => {
    if (dc.kind === 'money') return [concept(dc.card.concept)];
    return dc.card.answer === 'scam' ? dc.card.tactics.map((k: Tactic) => tactic(k)) : [t('harian.missedLegit')];
  };
  return (
    <div data-screen="harian" className="flex min-h-0 flex-1 flex-col">
      <GameHeader title={t('harian.results')}><HeaderInfo today={today} /></GameHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <div className={`${PANEL} flex flex-col items-center gap-2 px-4 py-5 text-center`}>
          <p className="font-display text-[56px] font-extrabold leading-none text-indigo" aria-live="polite">{t('harian.score', { n: score, total: DECK_SIZE })}</p>
          <motion.div
            data-testid="streak-up"
            initial={reduced ? { opacity: 0 } : { scale: 0.4, rotate: -12, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
            transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 320, damping: 14, delay: 0.25 }}
            className="mt-1 flex flex-col items-center gap-0.5 rounded-3xl bg-danger-soft px-6 py-2 ring-2 ring-danger"
          >
            <span className="flex items-center gap-2">
              <Flame aria-hidden size={26} strokeWidth={2} className="fill-danger text-danger" />
              <span className="font-display text-xl font-extrabold text-danger-ink">{t('harian.streakUp')}</span>
            </span>
            <span className="font-mono text-base font-semibold text-ink">{t('harian.streakNow', { n: streak })}</span>
          </motion.div>
          <div className="mt-2 flex items-center gap-3 text-left">
            <Kancil mood={band === 'high' ? 'proud' : band === 'mid' ? 'smile' : 'neutral'} size={64} decorative />
            <p className="text-lg text-ink">{t(`harian.kancil.${band}`)}</p>
          </div>
        </div>
        {misses.length > 0 && (
          <section aria-label={t('harian.missed')} className="flex flex-col gap-2.5">
            <h2 className="font-display text-xl font-extrabold text-ink">{t('harian.missed')}</h2>
            {misses.map(({ dc, i }) => (
              <div key={i} data-testid="miss" className="rounded-2xl bg-white p-3 ring-1 ring-indigo-soft">
                <ul className="flex flex-wrap gap-1.5">
                  {label(dc).map((l) => (
                    <li key={l} className="rounded-full bg-kancil-soft px-3 py-1 text-base font-semibold text-ink ring-1 ring-kancil/50">{l}</li>
                  ))}
                </ul>
                <MissWhy dc={dc} />
              </div>
            ))}
          </section>
        )}
      </div>
      <div className="grid shrink-0 gap-2.5 px-4 pb-5 pt-2">
        <button type="button" className={BTN_PRIMARY} onClick={() => navigate('/swipe')}>{t('harian.play60')}</button>
        <button type="button" className={BTN_SECONDARY} onClick={() => navigate('/home')}>{t('harian.done')}</button>
      </div>
    </div>
  );
}

function MissWhy({ dc }: { dc: DeckCard }) {
  const loc = useLoc();
  return <p className="mt-2 text-base leading-snug text-ink">{loc(dc.card.why)}</p>;
}

export function CekHarian(_props: { params: Record<string, string> }) {
  const [today, setToday] = useState(() => localDate());
  return <Round key={today} today={today} onNewDay={setToday} />;
}

function Round({ today, onNewDay }: { today: string; onNewDay: (day: string) => void }) {
  const t = useT();
  const deck = useMemo(() => (cards && moneyCards ? dailyDeck(today, cards, moneyCards) : []), [today]);
  const [phase, setPhase] = useState<Phase>(() => {
    const lp = useGame.getState().harian.lastPlayed;
    // Played today (or the clock moved back behind the last play): no cards, no scoring.
    return lp !== null && lp >= today ? 'done' : 'play';
  });
  const [answers, setAnswers] = useState<boolean[]>(() => {
    const p = useGame.getState().harianProgress;
    return p && p.date === today ? p.answers.slice(0, DECK_SIZE) : [];
  });
  const [chosen, setChosen] = useState<Choice | null>(null);
  const [revealed, setRevealed] = useState(false);
  const lock = useRef(false);
  const finished = useRef(false);

  const finish = (all: boolean[]) => {
    if (finished.current) return;
    finished.current = true;
    useGame.getState().playHarian(all.filter(Boolean).length, today);
    useGame.getState().setHarianProgress(null);
    setPhase('results');
  };

  // A reload after the fifth answer but before "Lihat keputusan": finish straight away.
  useEffect(() => {
    if (phase === 'play' && deck.length === DECK_SIZE && answers.length >= DECK_SIZE && !revealed) finish(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (deck.length < DECK_SIZE) return <Unavailable title={t('harian.title')} />;
  if (phase === 'done') return <ComeBack today={today} onNewDay={onNewDay} />;
  if (phase === 'results') return <Results deck={deck} answers={answers} today={today} />;

  const index = revealed ? answers.length - 1 : answers.length;
  const dc = deck[Math.min(index, DECK_SIZE - 1)];
  const isLast = index >= DECK_SIZE - 1;

  const answer = (choice: Choice) => {
    if (revealed || lock.current || index >= DECK_SIZE) return;
    lock.current = true;
    const right = isRight(dc, choice);
    const st = useGame.getState();
    // XP / Imuniti / Celik only inside a round that is still unplayed today (the phase is 'play' only then).
    if (dc.kind === 'swipe') st.answerCard('swipe', right, dc.card.tactics);
    else st.answerCard('money', right, [], dc.card.concept);
    const next = [...answers, right];
    st.setHarianProgress({ date: today, answers: next });
    setAnswers(next);
    setChosen(choice);
    setRevealed(true);
  };

  const advance = () => {
    if (!revealed || !lock.current) return;
    lock.current = false;
    if (isLast) {
      // Keep the lock closed: a second tap on the finish button must not count again.
      lock.current = true;
      finish(answers);
      return;
    }
    setRevealed(false);
    setChosen(null);
  };

  return (
    <div data-screen="harian" className="flex min-h-0 flex-1 flex-col">
      <GameHeader title={t('harian.title')}><HeaderInfo today={today} /></GameHeader>
      <div className="flex shrink-0 items-center gap-3 px-4 pb-1 pt-3">
        <ol aria-hidden className="flex flex-1 gap-1.5">
          {deck.map((_, i) => (
            <li key={i} className={`h-2 flex-1 rounded-full ${i < answers.length ? (answers[i] ? 'bg-safe' : 'bg-danger') : i === index ? 'bg-kancil' : 'bg-indigo-soft'}`} />
          ))}
        </ol>
        <p className="shrink-0 text-base font-semibold text-ink">{t('harian.cardOf', { n: index + 1, total: DECK_SIZE })}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2">
        <FlipCard
          key={index}
          flipped={revealed}
          front={dc.kind === 'swipe'
            ? <SwipeFront card={dc.card} onAnswer={answer} disabled={revealed} />
            : <MoneyFront card={dc.card} />}
          back={dc.kind === 'swipe'
            ? <SwipeBack card={dc.card} choice={(chosen ?? dc.card.answer) as SwipeChoice} />
            : <MoneyBack card={dc.card} right={revealed && isRight(dc, chosen as MoneyChoice)} />}
        />
      </div>
      <div className="shrink-0 px-4 pb-5 pt-3">
        {revealed ? (
          <button type="button" className={BTN_PRIMARY} onClick={advance}>{t(isLast ? 'harian.finish' : 'harian.next')}</button>
        ) : dc.kind === 'swipe' ? (
          <>
            <SwipeButtons onAnswer={answer} />
            <p className="mt-2 hidden text-center text-base text-ink-soft [@media(hover:none)]:block">{t('harian.swipeHint')}</p>
          </>
        ) : (
          <MoneyButtons card={dc.card} onAnswer={answer} />
        )}
      </div>
    </div>
  );
}
