import type { ReactNode } from 'react';

/** Reply pill above the (decorative) keyboard bar. Pressed state darkens; disabled fades. */
export function ReplyChip({ children, onClick, disabled = false, className = '' }: {
  children: ReactNode; onClick(): void; disabled?: boolean; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-12 w-full rounded-full bg-indigo-soft px-5 py-2.5 text-left text-base font-medium leading-snug text-ink transition-colors duration-150 active:bg-indigo active:text-paper disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
