import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';

export type ToastTone = 'info' | 'success' | 'danger';
interface ToastItem { id: number; msg: string; tone: ToastTone }

const useToasts = create<{ items: ToastItem[] }>(() => ({ items: [] }));
let nextId = 1;
export const TOAST_MS = 2400;

/** Shows a short message at the bottom of the phone screen. */
export function toast(msg: string, tone: ToastTone = 'info'): void {
  const id = nextId++;
  useToasts.setState((s) => ({ items: [...s.items.filter((i) => i.msg !== msg), { id, msg, tone }].slice(-2) }));
  setTimeout(() => useToasts.setState((s) => ({ items: s.items.filter((i) => i.id !== id) })), TOAST_MS);
}

const STYLE: Record<ToastTone, string> = {
  info: 'bg-ink text-paper',
  success: 'bg-safe-soft text-ink border border-safe',
  danger: 'bg-danger-soft text-ink border border-danger',
};
const ICON = { info: Info, success: CircleCheck, danger: CircleAlert };

export function ToastHost() {
  const items = useToasts((s) => s.items);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-4 bottom-24 z-40 flex flex-col items-center gap-2">
      <AnimatePresence initial={false}>
        {items.map((i) => {
          const Icon = ICON[i.tone];
          return (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-base font-medium shadow-[0_2px_8px_rgba(28,27,58,.16)] ${STYLE[i.tone]}`}
            >
              <Icon aria-hidden size={20} strokeWidth={1.75} />
              <span>{i.msg}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
