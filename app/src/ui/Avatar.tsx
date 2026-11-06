import { User } from 'lucide-react';

/** "Kak Mira (HR)" -> "KM"; parenthesised parts are skipped. */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w && !w.startsWith('(') && /\p{L}/u.test(w[0]));
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

const TONES = ['bg-kancil-soft text-ink', 'bg-indigo-soft text-indigo'];

function tone(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return TONES[h % TONES.length];
}

/** Round contact picture: initials on a soft token colour; a person icon for bare numbers. Decorative. */
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const ini = initials(name);
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.max(16, Math.round(size * 0.38)) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-extrabold ${tone(name)}`}
    >
      {ini || <User size={Math.round(size * 0.5)} strokeWidth={1.75} />}
    </span>
  );
}
