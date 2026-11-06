import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowLeftRight, Link2 } from 'lucide-react';
import { scenarios } from 'virtual:celik-content';
import type { UiDirective } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate, replaceRoute } from '../../shell/router';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { Avatar } from '../../ui/Avatar';
import { ChatBubble } from '../../ui/ChatBubble';
import { formatRM } from '../../ui/format';
import { Kancil } from '../../ui/Kancil';
import { ReplyChip } from '../../ui/ReplyChip';
import { TypingIndicator } from '../../ui/TypingIndicator';
import { useScenario, type ChatMessage } from './useScenario';

const SPRING = { type: 'spring', stiffness: 300, damping: 28 } as const;

/** Placeholder for the BankKu transfer and fake page (Task 12 replaces it). */
function UiCard({ ui, onOpen }: { ui: UiDirective; onOpen(): void }) {
  const t = useT();
  const link = ui.kind === 'link';
  const Icon = link ? Link2 : ArrowLeftRight;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-paper p-3 ring-1 ring-indigo-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-soft text-indigo">
        <Icon aria-hidden size={22} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-ink">{t(link ? 'sembang.ui.link' : 'sembang.ui.transfer')}</span>
        <span className={`block truncate text-base ${link ? 'text-indigo underline' : 'font-mono font-semibold text-ink'}`}>
          {link ? ui.url : formatRM(ui.amount)}
        </span>
      </span>
      <button type="button" onClick={onOpen} className="min-h-12 shrink-0 rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]">
        {t(link ? 'sembang.ui.openLink' : 'sembang.ui.openBank')}
      </button>
    </div>
  );
}

function Thread({ id }: { id: string }) {
  const t = useT();
  const view = useScenario(id);
  const { meta, messages, choices, typing, pendingUi } = view;
  const reduced = useSettings((s) => s.reducedMotion);
  const hintUsed = useGame((s) => s.active?.id === id && s.active.hintUsed);
  const [hintText, setHintText] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const name = meta.contact || meta.number || '';

  useEffect(() => {
    const el = logRef.current;
    el?.scrollTo?.({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [messages.length, typing, choices, pendingUi, hintText, reduced]);

  const askKancil = () => {
    const h = view.hint();
    if (!h) return;
    setHintText(h);
  };

  const senderOf = (m: ChatMessage) => (m.from === 'me' ? t('sembang.you') : m.speaker ?? name);
  const waiting = !!choices || !!pendingUi;
  const showHintChip = !!meta.hint && !hintText && !hintUsed && !!choices;

  return (
    <div data-screen="chat" className="flex min-h-0 flex-1 flex-col">
      {/* Header: never a verified tick, so players do not learn that ticks mean safe. */}
      <div className="relative z-10 flex items-center gap-2 bg-white py-1.5 pl-1 pr-20 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <button
          type="button"
          aria-label={t('sembang.backToList')}
          onClick={() => navigate('/sembang')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink"
        >
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <Avatar name={name} size={40} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-bold leading-tight text-ink">{name}</h1>
          <p className="flex items-center gap-1.5 text-base leading-tight text-ink-soft">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-safe" />
            <span className="truncate">{t('sembang.online')}</span>
          </p>
        </div>
      </div>

      <div
        ref={logRef}
        role="log"
        aria-label={t('sembang.logLabel', { name })}
        className="sembang-wall min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-4"
      >
        <p className="mx-auto mb-3 w-fit rounded-xl bg-white/80 px-3 py-1 text-base font-medium text-ink-soft">{t('sembang.today')}</p>
        <ol>
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const same = !!prev && prev.from === m.from && prev.speaker === m.speaker;
            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={i === 0 ? '' : same ? 'mt-1.5' : 'mt-3'}
              >
                <ChatBubble from={m.from} text={m.text} first={!same} sender={m.from === 'system' ? undefined : senderOf(m)} />
              </motion.li>
            );
          })}
        </ol>
        {typing && (
          <div className={messages.length === 0 ? '' : messages.at(-1)?.from === 'them' ? 'mt-1.5' : 'mt-3'}>
            <TypingIndicator label={t('sembang.typing', { name })} />
          </div>
        )}
      </div>

      {/* Bottom sheet, never above 40% of the screen: replies (or the ui card) when the story waits for the
          player, otherwise a decorative keyboard bar. */}
      <div className="relative z-10 flex max-h-[40%] shrink-0 flex-col rounded-t-[24px] bg-white shadow-[0_-8px_24px_rgba(28,27,58,.12)]">
        <div className={`min-h-0 overflow-y-auto px-3 pt-3 ${waiting ? 'pb-3' : ''}`}>
          {hintText && (
            <div role="note" aria-label={t('coach.title')} className="mb-2 flex items-start gap-2 rounded-2xl bg-kancil-soft p-3">
              <Kancil mood="smile" size={40} decorative className="-my-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-base font-bold text-ink">{t('coach.title')}</span>
                  <span className="font-mono text-base font-semibold text-ink-soft">{t('sembang.hintCost')}</span>
                </p>
                <p className="text-base leading-snug text-ink">{hintText}</p>
              </div>
            </div>
          )}
          {pendingUi && <div className={choices ? 'mb-2' : ''}><UiCard ui={pendingUi} onOpen={() => view.resolveUi(true)} /></div>}
          {choices && (
            <motion.div
              role="group"
              aria-label={t('sembang.replies')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING}
              className="flex flex-col gap-2"
            >
              {showHintChip && (
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
              {choices.map((c) => (
                <ReplyChip key={c.index} onClick={() => view.choose(c.index)}>{c.text}</ReplyChip>
              ))}
            </motion.div>
          )}
        </div>
        {!waiting && (
          <div aria-hidden="true" className="flex shrink-0 items-center px-3 pb-3 pt-2">
            <span className="flex h-11 flex-1 items-center rounded-full bg-paper px-4 text-base text-ink-soft ring-1 ring-indigo-soft">
              {t('sembang.composer')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** S06: Sembang chat thread that plays one scenario. Unknown ids go back to the list. */
export function ChatThread({ params }: { params: Record<string, string> }) {
  const id = params.id ?? '';
  const known = !!scenarios[id] && scenarios[id].meta.ui === 'chat';
  useEffect(() => {
    if (!known) replaceRoute('/sembang');
  }, [known]);
  if (!known) return null;
  return <Thread key={id} id={id} />;
}
