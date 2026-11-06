// Building blocks of Mod Kelas (S17): the huge card, team answer panels, scoreboard bars, confetti.
// Everything here is sized for a projector: card, answer and score text is at least 32 px.
import { useEffect, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import {
  Check, CircleCheck, CircleX, Circle, Diamond, Hexagon, Mail, MessageCircle, MessageSquareText,
  Minus, Square, Star, Triangle, type LucideIcon,
} from 'lucide-react';
import {
  correctAnswer, validAnswers, type ClassCard, type ClassTeam, type TeamAnswer,
} from '../../engine/classmode';
import type { MoneyCard } from '../../engine/schemas';
import { useT } from '../../shell/i18n';
import { useConceptName, useLoc, useReducedMotion } from '../harian/shared';

/** Text colour with the better contrast on a team colour. */
export function onColor(hex: string): string {
  const ch = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * ch(0) + 0.7152 * ch(1) + 0.0722 * ch(2);
  const white = 1.05 / (lum + 0.05);
  const ink = (lum + 0.05) / (0.011 + 0.05);
  return white >= ink ? '#ffffff' : '#1c1b3a';
}

/** One shape per team so colour is never the only signal. */
const SHAPES: LucideIcon[] = [Circle, Square, Triangle, Diamond, Star, Hexagon];
export function TeamShape({ index, size = 32 }: { index: number; size?: number }) {
  const Icon = SHAPES[index % SHAPES.length];
  return <Icon aria-hidden size={size} strokeWidth={2.5} fill="currentColor" className="shrink-0" />;
}

/** Animated entrance that only fades when motion is reduced. */
export function useMotionOff(): boolean {
  const settings = useReducedMotion();
  const os = useFramerReducedMotion();
  return settings || !!os;
}

const CHANNEL_ICON = { sms: MessageSquareText, chat: MessageCircle, email: Mail } as const;
const STAGE = 'rounded-[40px] bg-white shadow-[0_18px_50px_rgba(0,0,0,.35)] ring-4 ring-kancil/60';

export function answerLabel(t: (k: string) => string, a: TeamAnswer): string {
  return t(`kelas.a.${a}`);
}

/** The correct answer as words, for the reveal ("SCAM", "BETUL", "A: option text"). */
export function correctLabel(card: ClassCard, t: (k: string) => string, loc: (l: MoneyCard['text']) => string): string {
  const a = correctAnswer(card);
  if (card.kind === 'money' && card.card.kind === 'pick') return `${answerLabel(t, a)}: ${loc(card.card.options[a === 'a' ? 0 : 1])}`;
  return answerLabel(t, a);
}

function SwipeBig({ card }: { card: Extract<ClassCard, { kind: 'swipe' }>['card'] }) {
  const t = useT();
  const loc = useLoc();
  const Icon = CHANNEL_ICON[card.channel];
  return (
    <div className={`${STAGE} overflow-hidden`}>
      <div className="flex items-center gap-3 bg-indigo-soft px-4 py-4 text-ink sm:px-8">
        <Icon aria-hidden size={32} strokeWidth={1.75} />
        <span className="text-[32px] font-semibold">{t(`harian.channel.${card.channel}`)}</span>
      </div>
      {card.channel === 'email' ? (
        <div className="px-4 pb-8 pt-5 sm:px-8 sm:pb-10 sm:pt-6">
          <p className="break-words text-[32px] text-ink-soft">
            {t('harian.from')}: <span className="font-semibold text-ink">{card.sender}</span>
          </p>
          <hr className="my-5 border-indigo-soft" />
          <p className="whitespace-pre-wrap break-words text-[32px] leading-snug text-ink lg:text-[44px]">{loc(card.text)}</p>
        </div>
      ) : (
        <div className="sembang-wall px-4 pb-8 pt-5 sm:px-8 sm:pb-10 sm:pt-6">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo font-display text-[32px] font-extrabold text-paper">
              {card.sender.trim().charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 break-words text-[32px] font-bold text-ink">{card.sender}</span>
          </div>
          <p className="max-w-full whitespace-pre-wrap break-words rounded-[28px] rounded-tl-[8px] bg-chat-in px-4 py-4 sm:px-7 sm:py-5 text-[32px] leading-snug text-ink shadow-[0_2px_4px_rgba(28,27,58,.14)] lg:max-w-[94%] lg:text-[44px]">
            {loc(card.text)}
          </p>
        </div>
      )}
    </div>
  );
}

function MoneyBig({ card, reveal }: { card: MoneyCard; reveal: boolean }) {
  const t = useT();
  const loc = useLoc();
  const concept = useConceptName();
  return (
    <div className={`${STAGE} flex flex-col gap-6 p-5 sm:p-8 lg:p-10`}>
      <p className="font-display text-[32px] font-extrabold leading-tight text-ink lg:text-[48px]">{loc(card.text)}</p>
      {card.kind === 'pick' && (
        <div className="grid gap-5 md:grid-cols-2">
          {card.options.map((o, i) => {
            const good = reveal && card.better === i;
            return (
              <div
                key={i}
                data-option={i === 0 ? 'a' : 'b'}
                className={`flex items-center gap-5 rounded-[28px] border-4 px-6 py-5 ${good ? 'border-safe bg-safe-soft' : reveal ? 'border-ink/15 bg-white opacity-70' : 'border-indigo bg-white'}`}
              >
                <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo font-display text-[40px] font-extrabold text-paper">{i === 0 ? 'A' : 'B'}</span>
                <span className="min-w-0 break-words text-[32px] font-semibold leading-snug text-ink">{loc(o)}</span>
                {good && <CircleCheck aria-hidden size={44} className="ml-auto shrink-0 text-safe" />}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-kancil-soft px-5 py-2 text-[32px] font-semibold text-ink ring-1 ring-kancil/50">{concept(card.concept)}</span>
        <span className="text-[32px] text-ink-soft">{t('kelas.example')}</span>
      </div>
    </div>
  );
}

/** The card in the centre of the projector: message in its channel style, or a money card. */
export function BigCard({ card, reveal }: { card: ClassCard; reveal: boolean }) {
  const t = useT();
  return (
    <div className="flex w-full flex-col gap-4" data-card={card.card.id}>
      <p className="text-center font-display text-[32px] font-extrabold text-paper">
        {t(card.kind === 'swipe' ? 'kelas.q.swipe' : `kelas.q.${card.card.kind}`)}
      </p>
      {card.kind === 'swipe' ? <SwipeBig card={card.card} /> : <MoneyBig card={card.card} reveal={reveal} />}
    </div>
  );
}

/** Reveal panel: the right answer, the one-line reason, and the tactic chips. */
export function VerdictPanel({ card, tactics }: { card: ClassCard; tactics: string[] }) {
  const t = useT();
  const loc = useLoc();
  return (
    <div data-testid="verdict" className="flex flex-col gap-5 rounded-[40px] bg-safe-soft p-8 text-ink shadow-[0_18px_50px_rgba(0,0,0,.35)] ring-4 ring-safe lg:p-10">
      <p className="flex items-center gap-4 font-display text-[40px] font-extrabold leading-tight">
        <CircleCheck aria-hidden size={52} strokeWidth={2.25} className="shrink-0 text-safe" />
        <span className="min-w-0 break-words">{t('kelas.correct', { answer: correctLabel(card, t, loc) })}</span>
      </p>
      <p className="text-[32px] leading-snug">{loc(card.card.why)}</p>
      {tactics.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {tactics.map((k) => (
            <li key={k} className="rounded-full bg-white px-5 py-2 text-[32px] font-semibold ring-1 ring-ink/20">{k}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A team's answer panel: colour band with shape, name and a tick once answered; big toggles; the result after reveal. */
export function TeamPanel({ team, index, card, phase, gain, onAnswer }: {
  team: ClassTeam; index: number; card: ClassCard; phase: 'question' | 'reveal'; gain: number; onAnswer(a: TeamAnswer): void;
}) {
  const t = useT();
  const reduced = useMotionOff();
  const revealed = phase === 'reveal';
  const right = correctAnswer(card);
  const ok = revealed && team.answer === right;
  const fg = onColor(team.color);
  return (
    <div
      role="group"
      aria-label={team.name}
      data-team={team.id}
      className="@container flex min-w-0 flex-col overflow-hidden rounded-[32px] bg-paper text-ink shadow-[0_10px_30px_rgba(0,0,0,.3)]"
    >
      <div className="flex min-h-[72px] items-center gap-3 px-5 py-3" style={{ backgroundColor: team.color, color: fg }}>
        <TeamShape index={index} />
        <span className="min-w-0 flex-1 break-words font-display text-[32px] font-extrabold leading-tight">{team.name}</span>
        {team.answer && !revealed && (
          <span data-testid="answered" className="flex shrink-0 items-center" title={t('kelas.teamDone', { name: team.name })}>
            <Check aria-hidden size={36} strokeWidth={4} />
            <span className="sr-only">{t('kelas.teamDone', { name: team.name })}</span>
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 @[260px]:grid-cols-2">
        {validAnswers(card).map((a) => {
          const on = team.answer === a;
          const label = answerLabel(t, a);
          return (
            <button
              key={a}
              type="button"
              aria-pressed={on}
              aria-label={`${team.name}: ${label}`}
              disabled={revealed}
              onClick={() => onAnswer(a)}
              className={`flex min-h-[72px] items-center justify-center gap-2 rounded-2xl border-4 px-3 font-display text-[32px] font-extrabold transition-colors ${on ? 'border-ink bg-ink text-paper' : 'border-indigo bg-white text-indigo'} ${revealed && a === right ? 'ring-8 ring-safe' : ''} disabled:cursor-default`}
            >
              {on && <Check aria-hidden size={30} strokeWidth={4} />}
              <span aria-hidden>{label}</span>
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="flex min-h-[72px] items-center justify-between gap-3 px-5 pb-4">
          <span className={`flex items-center gap-2 text-[32px] font-bold ${ok ? 'text-safe' : 'text-ink-soft'}`}>
            {ok ? <CircleCheck aria-hidden size={32} /> : team.answer ? <CircleX aria-hidden size={32} className="text-danger-ink" /> : <Minus aria-hidden size={32} />}
            {t(ok ? 'kelas.team.right' : team.answer ? 'kelas.team.wrong' : 'kelas.team.none')}
          </span>
          {gain > 0 && (
            <motion.span
              data-testid="gain"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -220, scale: 0.6 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 14, duration: reduced ? 0.15 : undefined }}
              className="rounded-full bg-safe px-5 py-1 font-display text-[36px] font-extrabold text-white"
            >
              +{gain}
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
}

/** Scoreboard rows sorted by score: shape + name, a bar that grows from the previous total, the score and the last gain. */
export function ScoreRows({ teams, indexOf, gains }: { teams: ClassTeam[]; indexOf: (id: string) => number; gains: Record<string, number> }) {
  const t = useT();
  const max = Math.max(1, ...teams.map((x) => x.score));
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setGrown(true), 80);
    return () => clearTimeout(id);
  }, []);
  return (
    <ol className="flex w-full flex-col gap-5">
      {teams.map((team, rank) => {
        const shown = grown ? team.score : team.score - (gains[team.id] ?? 0);
        const pct = Math.max(6, (shown / max) * 100);
        const fg = onColor(team.color);
        return (
          <li key={team.id} data-testid="score-row" className="grid items-center gap-3 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)_auto] md:gap-6">
            <span className="flex min-w-0 items-center gap-3 font-display text-[32px] font-extrabold text-paper">
              <span aria-hidden className="w-10 shrink-0 text-right text-kancil">{rank + 1}</span>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-2 ring-paper/70" style={{ backgroundColor: team.color, color: fg }}>
                <TeamShape index={indexOf(team.id)} size={28} />
              </span>
              <span className="min-w-0 break-words leading-tight">{team.name}</span>
            </span>
            <span className="h-14 rounded-full bg-paper/15">
              <span
                className="block h-full rounded-full ring-2 ring-paper/70 transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: team.color } as CSSProperties}
              />
            </span>
            <span className="flex items-baseline gap-3 justify-self-end font-display text-[40px] font-extrabold text-paper">
              <span aria-label={t('kelas.points', { n: team.score })}>{team.score}</span>
              {(gains[team.id] ?? 0) > 0 && <span className="text-[32px] text-kancil">+{gains[team.id]}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Confetti for the winner screen: falls forever; with reduced motion it sits still. */
export function Confetti({ colors }: { colors: string[] }) {
  const still = useMotionOff();
  const palette = [...colors, '#F4A340', '#FFF8EE'];
  return (
    <div aria-hidden data-testid="confetti" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {Array.from({ length: 44 }, (_, i) => {
        const left = (i * 37 + 11) % 100;
        const size = 14 + (i % 3) * 8;
        const color = palette[i % palette.length];
        const common = { left: `${left}%`, width: size, height: size * (i % 2 ? 0.5 : 1), backgroundColor: color, borderRadius: i % 4 === 0 ? 999 : 4 };
        if (still) return <span key={i} className="absolute" style={{ ...common, top: `${(i * 53 + 7) % 92}%`, transform: `rotate(${(i * 47) % 180}deg)`, opacity: 0.6 }} />;
        return (
          <motion.span
            key={i}
            className="absolute -top-8"
            style={common}
            initial={{ y: -40, rotate: 0 }}
            animate={{ y: '115vh', rotate: 360 + (i % 5) * 90 }}
            transition={{ duration: 4 + (i % 6) * 0.7, delay: (i % 9) * 0.35, repeat: Infinity, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}
