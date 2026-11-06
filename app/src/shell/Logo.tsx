import { Kancil } from '../ui/Kancil';

/** The open eye that replaces the dot of the "i". */
function EyeDot() {
  return (
    <svg aria-hidden viewBox="0 0 40 24" className="absolute left-1/2 top-[0.02em] w-[0.42em] -translate-x-1/2">
      <path d="M2 12Q20 -4 38 12Q20 28 2 12Z" fill="var(--color-kancil)" />
      <circle cx="20" cy="12" r="6.5" fill="var(--color-ink)" />
      <circle cx="17.6" cy="9.6" r="2" fill="var(--color-paper)" />
    </svg>
  );
}

/** "Celik" wordmark: eye-dot on the i, Sang Kancil peeking from behind the C. */
export function Logo({ size = 64, peek = true }: { size?: number; peek?: boolean }) {
  return (
    <h1 aria-label="Celik" className="font-display font-extrabold leading-none tracking-tight text-indigo" style={{ fontSize: size }}>
      <span aria-hidden="true" className="relative inline-flex items-baseline">
        <span className="relative isolate inline-block">
          {peek && (
            <span className="absolute -left-[0.06em] -top-[0.26em] -z-10 block h-[0.54em] w-[0.9em] overflow-hidden">
              <Kancil mood="smile" decorative size={Math.round(size * 0.9)} className="-mt-[0.06em] block max-w-none" />
            </span>
          )}
          C
        </span>
        <span>el</span>
        <span className="relative inline-block">
          {'ı'}
          <EyeDot />
        </span>
        <span>k</span>
      </span>
    </h1>
  );
}
