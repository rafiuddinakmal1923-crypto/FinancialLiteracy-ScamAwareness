// S15 Sahih atau Scam?: 10 cards in 60 seconds. The clock pauses while the one-line reason shows (D5).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, Pause, Trophy } from 'lucide-react';
import { cards } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { localDate } from '../../engine/dates';
import { pickRound } from '../../engine/harian';
import type { SwipeCard } from '../../engine/schemas';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { Kancil } from '../../ui/Kancil';
import { useTactic } from '../../ui/tactics';
import { SwipeBack, SwipeButtons, SwipeFront, type SwipeChoice } from './SwipeCard';
import { BTN_PRIMARY, BTN_SECONDARY, FlipCard, GameHeader, PANEL, Unavailable, useLoc } from './shared';

type Phase = 'ready' | 'play' | 'results';
interface Played { card: SwipeCard; choice: SwipeChoice; right: boolean }

const TICK_MS = 100;

/** Timer bar: remaining seconds (whole, rounded up) and a bar that drains. */
function TimerBar({ remainingMs, paused }: { remainingMs: number; paused: boolean }) {
  const t = useT();
  const total = BALANCE.swipe.seconds * 1000;
  const secs = Math.max(0, Math.ceil(remainingMs / 1000));
  const pct = Math.max(0, Math.min(100, (remainingMs / total) * 100));
  const low = secs <= 10;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-base font-semibold text-ink">
          {t('swipe.time')}
          {paused && (
            <span className="flex items-center gap-1 rounded-full bg-kancil-soft px-2 py-0.5 text-base font-semibold text-ink ring-1 ring-kancil/60">
              <Pause aria-hidden size={14} strokeWidth={2.5} />
              {t('swipe.paused')}
            </span>
          )}
        </span>
        <span className={`font-mono text-xl font-semibold ${low ? 'text-danger-ink' : 'text-ink'}`}>
          <span data-testid="seconds">{secs}</span> s
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t('swipe.time')}
        aria-valuemin={0}
        aria-valuemax={BALANCE.swipe.seconds}
        aria-valuenow={secs}
        className="mt-1.5 h-3 overflow-hidden rounded-full bg-indigo-soft"
      >
        <div className={`h-full rounded-full ${low ? 'bg-danger' : 'bg-kancil'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Results({ played, reason, onAgain }: { played: Played[]; reason: 'time' | 'cards'; onAgain(): void }) {
  const t = useT();
  const loc = useLoc();
  const tactic = useTactic();
  const swipe = useGame((s) => s.swipe);
  const score = played.filter((p) => p.right).length;
  const missed = played.filter((p) => !p.right);
  const unanswered = BALANCE.swipe.cards - played.length;
  return (
    <div data-screen="swipe" className="flex min-h-0 flex-1 flex-col">
      <GameHeader title={t('swipe.title')} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <div className={`${PANEL} flex flex-col items-center gap-2 px-4 py-5 text-center`}>
          <h2 className="font-display text-xl font-extrabold text-ink">{t(reason === 'time' ? 'swipe.timeUp' : 'swipe.allDone')}</h2>
          <p className="font-display text-[56px] font-extrabold leading-none text-indigo">{t('harian.score', { n: score, total: BALANCE.swipe.cards })}</p>
          {unanswered > 0 && <p className="text-base text-ink-soft">{t('swipe.unanswered', { n: unanswered })}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-kancil-soft px-3 py-1 text-base font-semibold text-ink ring-1 ring-kancil/60">
              <Trophy aria-hidden size={18} strokeWidth={2} />
              {score >= swipe.best && score > 0 ? t('swipe.newBest') : t('swipe.best', { n: swipe.best })}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-base font-semibold text-ink ring-1 ring-danger/60">
              <Flame aria-hidden size={18} strokeWidth={2} className="fill-danger text-danger" />
              {t('swipe.streak', { n: swipe.streak })}
            </span>
          </div>
        </div>
        {missed.length > 0 && (
          <section aria-label={t('swipe.missedTitle')} className="flex flex-col gap-2.5">
            <h2 className="font-display text-xl font-extrabold text-ink">{t('swipe.missedTitle')}</h2>
            {missed.map(({ card }) => (
              <div key={card.id} data-testid="missed" className="rounded-2xl bg-white p-3 ring-1 ring-indigo-soft">
                <p className="break-words text-base text-ink-soft">{card.sender}</p>
                <p className="mt-0.5 break-words text-base font-semibold text-ink">{loc(card.text)}</p>
                <p className="mt-2 text-base leading-snug text-ink">{loc(card.why)}</p>
                {card.tactics.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {card.tactics.map((k) => (
                      <li key={k} className="rounded-full bg-kancil-soft px-3 py-1 text-base font-semibold text-ink ring-1 ring-kancil/50">{tactic(k)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
      <div className="grid shrink-0 gap-2.5 px-4 pb-5 pt-2">
        <button type="button" className={BTN_PRIMARY} onClick={onAgain}>{t('swipe.again')}</button>
        <button type="button" className={BTN_SECONDARY} onClick={() => navigate('/home')}>{t('harian.done')}</button>
      </div>
    </div>
  );
}

export function SwipeGame(_props: { params: Record<string, string> }) {
  const t = useT();
  const best = useGame((s) => s.swipe.best);
  const enough = !!cards && cards.length >= BALANCE.swipe.cards;
  const [phase, setPhase] = useState<Phase>('ready');
  const [round, setRound] = useState<SwipeCard[]>([]);
  const [played, setPlayed] = useState<Played[]>([]);
  const [remaining, setRemaining] = useState(BALANCE.swipe.seconds * 1000);
  const [revealing, setRevealing] = useState(false);
  const [reason, setReason] = useState<'time' | 'cards'>('cards');
  const xpOn = useRef(false);
  const lock = useRef(false);
  const ended = useRef(false);
  const attempt = useRef(0);

  const end = useCallback((why: 'time' | 'cards', list: Played[]) => {
    if (ended.current) return;
    ended.current = true;
    useGame.getState().recordSwipe(list.filter((p) => p.right).length, localDate());
    setReason(why);
    setPhase('results');
  }, []);

  const begin = () => {
    if (!cards) return;
    attempt.current += 1;
    const seed = (Date.now() ^ (attempt.current * 0x9e3779b1)) >>> 0;
    setRound(pickRound(cards, BALANCE.swipe.cards, seed));
    setPlayed([]);
    setRemaining(BALANCE.swipe.seconds * 1000);
    setRevealing(false);
    lock.current = false;
    ended.current = false;
    // XP only in the first round of the local day; Imuniti moves every round.
    xpOn.current = useGame.getState().claimSwipeXp(localDate());
    setPhase('play');
  };

  // The clock: runs only while playing and not showing a reason (D5). Measured against Date.now so a throttled tab stays honest.
  useEffect(() => {
    if (phase !== 'play' || revealing) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      setRemaining((r) => Math.max(0, r - dt));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [phase, revealing]);

  useEffect(() => {
    if (phase === 'play' && !revealing && remaining <= 0) end('time', played);
  }, [phase, revealing, remaining, played, end]);

  // The reason shows for revealMs, then the next card (or the end).
  useEffect(() => {
    if (!revealing) return;
    const id = setTimeout(() => {
      setRevealing(false);
      lock.current = false;
      if (played.length >= BALANCE.swipe.cards) end('cards', played);
    }, BALANCE.swipe.revealMs);
    return () => clearTimeout(id);
  }, [revealing, played, end]);

  if (!enough) return <Unavailable title={t('swipe.title')} />;

  if (phase === 'ready') {
    return (
      <div data-screen="swipe" className="flex min-h-0 flex-1 flex-col">
        <GameHeader title={t('swipe.title')} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Kancil mood="smile" size={96} decorative />
          <p className="text-xl leading-snug text-ink">{t('swipe.intro')}</p>
          {best > 0 && <p className="text-base font-semibold text-ink-soft">{t('swipe.best', { n: best })}</p>}
        </div>
        <div className="shrink-0 px-4 pb-5 pt-2">
          <button type="button" className={BTN_PRIMARY} onClick={begin}>{t('swipe.start')}</button>
        </div>
      </div>
    );
  }

  if (phase === 'results') return <Results played={played} reason={reason} onAgain={begin} />;

  const showing = revealing ? played[played.length - 1] : undefined;
  const card = showing ? showing.card : round[played.length];
  const score = played.filter((p) => p.right).length;

  const answer = (choice: SwipeChoice) => {
    if (lock.current || revealing || !card) return;
    lock.current = true;
    const right = choice === card.answer;
    useGame.getState().answerRound(right, card.tactics, xpOn.current);
    setPlayed((p) => [...p, { card, choice, right }]);
    setRevealing(true);
  };

  return (
    <div data-screen="swipe" className="flex min-h-0 flex-1 flex-col">
      <GameHeader title={t('swipe.title')} />
      <div className="flex shrink-0 items-end gap-4 px-4 pb-1 pt-3">
        <TimerBar remainingMs={remaining} paused={revealing} />
        <p className="shrink-0 font-display text-xl font-extrabold text-indigo">{t('swipe.score', { n: score })}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2">
        {card && (
          <FlipCard
            key={played.length - (revealing ? 1 : 0)}
            flipped={revealing}
            front={<SwipeFront card={card} onAnswer={answer} disabled={revealing} />}
            back={showing ? <SwipeBack card={showing.card} choice={showing.choice} /> : null}
          />
        )}
      </div>
      <div className="shrink-0 px-4 pb-5 pt-3">
        <SwipeButtons onAnswer={answer} disabled={revealing} />
      </div>
    </div>
  );
}
