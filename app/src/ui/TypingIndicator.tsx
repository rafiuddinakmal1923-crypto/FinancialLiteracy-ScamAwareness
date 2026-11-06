/** Three dots in an incoming bubble while the contact "types". `label` is read by screen readers. */
export function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex justify-start" role="status" aria-label={label}>
      <span className="flex h-10 items-center gap-1.5 rounded-[18px] rounded-tl-[4px] bg-chat-in px-4 shadow-[0_1px_1.5px_rgba(28,27,58,.12)]">
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden="true" className="typing-dot h-2 w-2 rounded-full bg-ink-soft" style={{ animationDelay: `${i * 160}ms` }} />
        ))}
      </span>
    </div>
  );
}
