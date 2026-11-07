// S07 incoming call: a ringing screen (Terima / Tolak), then the call itself: timer, voice bars, transcript bubbles
// in sync with the story, the ink's choices as chips, and the Tekanan meter pulsing on fear lines.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CircleCheck, Phone, PhoneOff } from 'lucide-react';
import { scenarios } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { StoryRunner } from '../../engine/story';
import type { ChatMessage } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate, replaceRoute } from '../../shell/router';
import { tekananLevel } from '../../shell/StatusBar';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { Avatar } from '../../ui/Avatar';
import { ChatBubble } from '../../ui/ChatBubble';
import { Kancil } from '../../ui/Kancil';
import { MeterBar } from '../../ui/MeterBar';
import { ReplyChip } from '../../ui/ReplyChip';
import { TypingIndicator } from '../../ui/TypingIndicator';
import { useScenario, type ScenarioOptions } from './useScenario';

const HANG_UP = /letak/i;
const SPRING = { type: 'spring', stiffness: 300, damping: 28 } as const;
const INSTANT = () => Promise.resolve();

/**
 * True when the first choices of the call offer a hang-up ("Letak telefon"). Declining the ringing call plays that
 * branch; a call without one cannot be declined and shows as missed instead.
 */
export function hasHangUp(id: string): boolean {
  const s = scenarios[id];
  if (!s) return false;
  const r = new StoryRunner(s);
  for (let step = r.next(); ; step = r.next()) {
    if (step.kind === 'choices') return step.choices.some((c) => HANG_UP.test(c.text));
    if (step.kind === 'end') return false;
  }
}

export const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/** Round action button of the ringing screen: 72 px disc, label underneath (colour is never the only cue). */
function RingButton({ tone, label, onClick, children }: { tone: 'safe' | 'danger'; label: string; onClick(): void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 min-w-24 flex-col items-center gap-2 rounded-2xl text-paper active:scale-95">
      <span className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${tone === 'safe' ? 'bg-safe' : 'bg-danger'} shadow-[0_6px_18px_rgba(0,0,0,.35)]`}>
        {children}
      </span>
      <span className="text-base font-semibold">{label}</span>
    </button>
  );
}

function Ringing({ id, onAccept, onDecline, missed }: { id: string; onAccept(): void; onDecline(): void; missed: boolean }) {
  const t = useT();
  const reduced = useSettings((s) => s.reducedMotion);
  const { meta } = scenarios[id];
  const name = meta.contact || meta.number || t('call.unknown');
  return (
    <div data-screen="panggilan" data-phase="ringing" className="songket flex min-h-0 flex-1 flex-col items-center overflow-y-auto bg-ink px-6 pb-10 pt-8 text-paper">
      <p className="text-lg font-medium text-paper/80">{t('call.incoming')}</p>
      <div className="relative mt-10 flex h-40 w-40 shrink-0 items-center justify-center">
        <span aria-hidden data-static={reduced || undefined} className="call-halo absolute inset-0 rounded-full bg-kancil/40" />
        <span aria-hidden data-static={reduced || undefined} className="call-halo call-halo-2 absolute inset-0 rounded-full bg-kancil/40" />
        <span className="relative rounded-full ring-4 ring-kancil"><Avatar name={name} size={128} /></span>
      </div>
      <h1 className="mt-8 text-center font-display text-[30px] font-extrabold leading-tight">{name}</h1>
      {meta.number && <p className="mt-1 font-mono text-xl font-semibold text-paper/90">{meta.number}</p>}
      {missed && (
        <p role="note" className="mt-6 rounded-2xl bg-paper/10 px-4 py-3 text-center text-base leading-snug">{t('call.missed')}</p>
      )}
      <div className="mt-auto flex w-full items-end justify-around pt-10">
        {!missed && (
          <RingButton tone="danger" label={t('call.decline')} onClick={onDecline}>
            <PhoneOff aria-hidden size={32} strokeWidth={2} />
          </RingButton>
        )}
        <RingButton tone="safe" label={t('call.accept')} onClick={onAccept}>
          <Phone aria-hidden size={32} strokeWidth={2} />
        </RingButton>
      </div>
    </div>
  );
}

/** Voice bars: moving while the other side speaks; still under reduced motion. */
function Waveform({ live }: { live: boolean }) {
  const t = useT();
  const reduced = useSettings((s) => s.reducedMotion);
  const heights = [14, 26, 38, 22, 44, 30, 18, 36, 24, 12, 28];
  const still = reduced || !live;
  return (
    <div role="img" aria-label={t('call.waveform')} data-static={still || undefined} className="flex h-12 items-center justify-center gap-1.5">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: h, ['--d' as string]: `${(i % 5) * 0.12}s` }}
          className={`w-1.5 rounded-full bg-kancil ${still ? '' : 'call-bar'}`}
        />
      ))}
    </div>
  );
}

function InCall({ id, autoHangUp, options }: { id: string; autoHangUp: boolean; options?: ScenarioOptions }) {
  const t = useT();
  const reduced = useSettings((s) => s.reducedMotion);
  const opts = useMemo<ScenarioOptions>(() => (autoHangUp ? { ...options, delay: INSTANT } : options ?? {}), [autoHangUp, options]);
  const view = useScenario(id, opts);
  const { meta, messages, choices, typing } = view;
  const ended = !!view.ended;
  const tekanan = useGame((s) => s.meters.tekanan);
  const hintUsed = useGame((s) => s.active?.id === id && s.active.hintUsed);
  const [hintText, setHintText] = useState<string | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [sec, setSec] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const name = meta.contact || meta.number || '';

  // Tolak: pick the "Letak telefon" chip as soon as it is offered.
  useEffect(() => {
    if (!autoHangUp || !choices) return;
    const c = choices.find((x) => HANG_UP.test(x.text));
    if (c) view.choose(c.index);
  }, [autoHangUp, choices, view]);

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => setSec((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [ended]);

  useEffect(() => {
    if (!ended) { setShowEnd(false); return; }
    const timer = setTimeout(() => setShowEnd(true), BALANCE.aftermath.endPauseMs);
    return () => clearTimeout(timer);
  }, [ended]);

  useEffect(() => {
    const el = logRef.current;
    el?.scrollTo?.({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [messages.length, typing, choices, showEnd, hintText, reduced]);

  // Tekanan pulses when the other side's latest line holds a fear flag phrase of this scenario.
  const fearPhrases = useMemo(() => scenarios[id].flags.filter((f) => f.tactic === 'fear').map((f) => f.phrase), [id]);
  const lastThem = [...messages].reverse().find((m) => m.from === 'them');
  const fear = !!lastThem && fearPhrases.some((p) => lastThem.text.includes(p));
  const pulseKey = fear && lastThem ? lastThem.id : 0;
  const level = tekananLevel(tekanan);
  const speaking = typing || (!!lastThem && !choices && !ended);
  const senderOf = (m: ChatMessage) => (m.from === 'me' ? t('sembang.you') : m.speaker ?? name);
  const sameRun = (i: number) => !!messages[i - 1] && messages[i - 1].from === messages[i].from && messages[i - 1].speaker === messages[i].speaker;

  const askKancil = () => {
    const h = view.hint();
    if (h) setHintText(h);
  };

  return (
    <div data-screen="panggilan" data-phase="incall" className="relative flex min-h-0 flex-1 flex-col overflow-clip bg-ink text-paper">
      <div className="songket flex shrink-0 flex-col items-center px-4 pb-3 pt-3">
        <p className="text-base font-medium text-paper/80">{ended ? t('call.ended') : t('call.inCall')}</p>
        <div className="mt-1 flex items-center gap-3">
          <Avatar name={name} size={44} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-extrabold leading-tight">{name}</h1>
            {meta.number && meta.contact && <p className="font-mono text-base text-paper/80">{meta.number}</p>}
          </div>
        </div>
        <p role="timer" aria-label={t('call.timer', { time: clock(sec) })} className="mt-2 font-mono text-[44px] font-semibold leading-none">{clock(sec)}</p>
        <div className="mt-2"><Waveform live={speaking} /></div>
        <div key={pulseKey} data-fear={fear || undefined} className={`mt-2 w-full rounded-2xl bg-paper px-3 py-2 text-ink ${fear ? 'call-pulse' : ''}`}>
          <MeterBar
            label={t('meter.tekanan')} value={tekanan} max={100}
            display={`${tekanan} (${t(`status.tekanan.${level}`)})`}
            tone={level === 'low' ? 'safe' : level === 'mid' ? 'warning' : 'danger'}
          />
        </div>
      </div>

      <div ref={logRef} role="log" aria-label={t('sembang.logLabel', { name })} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2">
        <ol>
          {messages.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={i === 0 ? '' : sameRun(i) ? 'mt-1.5' : 'mt-3'}
            >
              <ChatBubble from={m.from} text={m.text} first={!sameRun(i)} sender={m.from === 'system' ? undefined : senderOf(m)} />
            </motion.li>
          ))}
        </ol>
        {typing && <div className="mt-2"><TypingIndicator label={t('call.speaking', { name })} /></div>}
      </div>

      <div className="relative z-10 flex max-h-[42%] shrink-0 flex-col rounded-t-[24px] bg-white text-ink shadow-[0_-8px_24px_rgba(0,0,0,.25)]">
        <div className="min-h-0 overflow-y-auto px-3 py-3">
          {hintText && (
            <div role="note" aria-label={t('coach.title')} className="mb-2 flex items-start gap-2 rounded-2xl bg-kancil-soft p-3">
              <Kancil mood="smile" size={40} decorative className="-my-1 shrink-0" />
              <p className="min-w-0 flex-1 text-base leading-snug text-ink">{hintText}</p>
            </div>
          )}
          {showEnd && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
              <p className="mb-2 flex items-center justify-center gap-2 text-center text-base font-medium text-ink-soft">
                <CircleCheck aria-hidden size={20} strokeWidth={1.75} className="text-safe" />
                {t('call.ended')}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/semester/akibat/${id}`)}
                className="min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
              >
                {t('sembang.seeNext')}
              </button>
            </motion.div>
          )}
          {!autoHangUp && choices && (
            <motion.div role="group" aria-label={t('sembang.replies')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="flex flex-col gap-2">
              {!!meta.hint && !hintText && !hintUsed && (
                <button
                  type="button"
                  onClick={askKancil}
                  className="flex min-h-12 items-center gap-2 self-start rounded-full bg-kancil-soft py-1 pl-1.5 pr-4 text-base font-semibold text-ink ring-1 ring-kancil/50 active:bg-kancil"
                >
                  <Kancil mood="neutral" size={34} decorative className="-mt-1" />
                  {t('sembang.hint')}
                  <span className="font-mono text-base font-semibold text-ink-soft">{t('sembang.hintCost')}</span>
                </button>
              )}
              {choices.map((c) => <ReplyChip key={c.index} onClick={() => view.choose(c.index)}>{c.text}</ReplyChip>)}
            </motion.div>
          )}
          {!choices && !ended && <p className="py-2 text-center text-base text-ink-soft">{autoHangUp ? t('call.declined') : t('call.speaking', { name })}</p>}
        </div>
      </div>
    </div>
  );
}

/** A finished call opens as a short note (R8: no replays). */
function CallDone() {
  const t = useT();
  return (
    <div data-screen="panggilan" data-phase="done" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <CircleCheck aria-hidden size={48} strokeWidth={1.75} className="text-safe" />
      <p className="text-lg text-ink">{t('call.done')}</p>
      <button type="button" onClick={() => navigate('/home')} className="min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper">
        {t('call.back')}
      </button>
    </div>
  );
}

/**
 * S07: the incoming-call screen for a `ui:call` scenario. Only call scenarios open here (chats use /sembang/:id);
 * an unknown id or a chat goes home, a pending aftermath goes to its consequence, a finished call shows a note.
 */
export function IncomingCall({ params, options }: { params: Record<string, string>; options?: ScenarioOptions }) {
  const id = params.id ?? '';
  const known = scenarios[id]?.meta.ui === 'call';
  const finished = useGame((s) => s.results.some((r) => r.id === id));
  // Checked once on open: the end of this very call also sets lastEnded, and must not redirect.
  const [pending] = useState(() => useGame.getState().lastEnded?.id ?? null);
  const [phase, setPhase] = useState<'ring' | 'accepted' | 'declined'>('ring');
  const [canHangUp] = useState(() => (known ? hasHangUp(id) : false));
  const [missed, setMissed] = useState(false);
  const redirect = !known ? '/home' : pending ? `/semester/akibat/${pending}` : null;
  useEffect(() => {
    if (redirect) replaceRoute(redirect);
  }, [redirect]);
  if (redirect) return null;
  if (finished) return <CallDone />;
  if (phase === 'ring') {
    return (
      <Ringing
        id={id}
        missed={missed}
        onAccept={() => setPhase('accepted')}
        onDecline={() => (canHangUp ? setPhase('declined') : setMissed(true))}
      />
    );
  }
  return <InCall key={id} id={id} autoHangUp={phase === 'declined'} options={options} />;
}
