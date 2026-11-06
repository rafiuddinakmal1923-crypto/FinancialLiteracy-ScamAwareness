// The message card of Cek Harian and Sahih atau Scam: shown in its channel style, draggable left (Scam) / right (Sahih).
import { Check, Flag, Mail, MessageCircle, MessageSquareText } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { SwipeCard } from '../../engine/schemas';
import { useT } from '../../shell/i18n';
import { PANEL, useLoc, useReducedMotion, Verdict } from './shared';

export type SwipeChoice = 'scam' | 'legit';

const CHANNEL_ICON = { sms: MessageSquareText, chat: MessageCircle, email: Mail } as const;

/** The message as it would appear: SMS bubble, chat bubble on the wallpaper, or an email with a From line. */
export function MessageView({ card }: { card: SwipeCard }) {
  const t = useT();
  const loc = useLoc();
  const Icon = CHANNEL_ICON[card.channel];
  const text = loc(card.text);
  return (
    <div className="overflow-hidden rounded-[28px]">
      <div className="flex items-center gap-2 bg-indigo-soft px-4 py-2.5 text-ink">
        <Icon aria-hidden size={20} strokeWidth={1.75} />
        <span className="text-base font-semibold">{t(`harian.channel.${card.channel}`)}</span>
      </div>
      {card.channel === 'email' ? (
        <div className="bg-white px-4 pb-5 pt-3">
          <p className="break-words text-base text-ink-soft">
            {t('harian.from')}: <span className="font-semibold text-ink">{card.sender}</span>
          </p>
          <hr className="my-3 border-indigo-soft" />
          <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-ink">{text}</p>
        </div>
      ) : (
        <div className="sembang-wall px-4 pb-6 pt-4">
          <div className="mb-2 flex items-center gap-2">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo font-display text-base font-extrabold text-paper">
              {card.sender.trim().charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 break-words text-base font-semibold text-ink">{card.sender}</span>
          </div>
          <p className="ml-11 max-w-[92%] whitespace-pre-wrap break-words rounded-[18px] rounded-tl-[4px] bg-chat-in px-3.5 py-2.5 text-lg leading-[1.4] text-ink shadow-[0_1px_1.5px_rgba(28,27,58,.12)]">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}

/** Front face: the message, with a drag that tilts the card and stamps SCAM / SAHIH before it commits. */
export function SwipeFront({ card, onAnswer, disabled }: { card: SwipeCard; onAnswer(c: SwipeChoice): void; disabled?: boolean }) {
  const t = useT();
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-11, 0, 11]);
  const scamStamp = useTransform(x, [-130, -30, 0], [1, 0, 0]);
  const legitStamp = useTransform(x, [0, 30, 130], [0, 0, 1]);
  const draggable = !reduced && !disabled;
  return (
    <div className="relative px-1 pb-3 pt-1">
      {/* The next cards peeking out underneath give the deck its stack feel. */}
      <div aria-hidden className="absolute inset-x-5 bottom-0 top-3 -rotate-2 rounded-[28px] bg-kancil-soft ring-1 ring-kancil/30" />
      <div aria-hidden className="absolute inset-x-3 bottom-1 top-2 rotate-1 rounded-[28px] bg-white ring-1 ring-indigo-soft" />
      <motion.div
        data-testid="swipe-card"
        drag={draggable ? 'x' : false}
        dragSnapToOrigin
        dragElastic={0.8}
        dragConstraints={{ left: 0, right: 0 }}
        whileDrag={{ scale: 1.02 }}
        style={{ x, rotate }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -100 || info.velocity.x < -600) onAnswer('scam');
          else if (info.offset.x > 100 || info.velocity.x > 600) onAnswer('legit');
        }}
        className={`relative touch-pan-y select-none ${PANEL} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <MessageView card={card} />
        <motion.span
          aria-hidden
          style={{ opacity: scamStamp }}
          className="pointer-events-none absolute right-3 top-12 flex -rotate-6 items-center gap-1.5 rounded-xl border-[3px] border-danger bg-white/95 px-3 py-1 font-display text-xl font-extrabold text-danger-ink"
        >
          <Flag size={22} strokeWidth={2.5} /> {t('harian.scam').toUpperCase()}
        </motion.span>
        <motion.span
          aria-hidden
          style={{ opacity: legitStamp }}
          className="pointer-events-none absolute left-3 top-12 flex rotate-6 items-center gap-1.5 rounded-xl border-[3px] border-safe bg-white/95 px-3 py-1 font-display text-xl font-extrabold text-ink"
        >
          <Check size={22} strokeWidth={2.5} className="text-safe" /> {t('harian.legit').toUpperCase()}
        </motion.span>
      </motion.div>
    </div>
  );
}

/** Back face of a message card. */
export function SwipeBack({ card, choice }: { card: SwipeCard; choice: SwipeChoice }) {
  const t = useT();
  const loc = useLoc();
  return (
    <div className="px-1 pb-3 pt-1">
      <Verdict
        right={choice === card.answer}
        answer={t(card.answer === 'scam' ? 'harian.scam' : 'harian.legit')}
        why={loc(card.why)}
        tactics={card.tactics}
      />
    </div>
  );
}

/** Button alternatives to the swipe (always present, 7 of UI-SPEC): Scam with a flag, Sahih with a check. */
export function SwipeButtons({ onAnswer, disabled }: { onAnswer(c: SwipeChoice): void; disabled?: boolean }) {
  const t = useT();
  const base = 'flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl px-3 font-display text-xl font-extrabold text-ink active:translate-y-px disabled:opacity-60';
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" disabled={disabled} onClick={() => onAnswer('scam')} className={`${base} border-2 border-danger bg-danger-soft`}>
        <Flag aria-hidden size={22} strokeWidth={2.25} className="text-danger" />
        {t('harian.scam')}
      </button>
      <button type="button" disabled={disabled} onClick={() => onAnswer('legit')} className={`${base} border-2 border-safe bg-safe-soft`}>
        <Check aria-hidden size={22} strokeWidth={2.5} className="text-safe" />
        {t('harian.legit')}
      </button>
    </div>
  );
}
