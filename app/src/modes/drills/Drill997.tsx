// S16: the simulated 997 call. A fake dialler (it never dials: no tel: link anywhere); only after 9, 9, 7 does the
// guided call start. The player says each step (they appear one by one) and ticks what to have ready.
import { useEffect, useRef, useState } from 'react';
import { Check, CircleCheck, Delete, Info, PhoneCall } from 'lucide-react';
import { drills } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { SimulasiBanner } from '../../ui/SimulasiBanner';
import { toast } from '../../ui/Toast';
import { useLoc } from '../harian/shared';
import { DrillHeader } from './parts';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
const CODE = '997';
type Phase = 'dial' | 'connecting' | 'call';

function Dialler({ onCode }: { onCode: () => void }) {
  const t = useT();
  const [typed, setTyped] = useState('');
  const press = (k: string) => {
    const next = (typed + k).slice(-8);
    setTyped(next);
    if (next.endsWith(CODE)) onCode();
  };
  return (
    <div className="mx-auto flex w-full max-w-[300px] flex-col items-center">
      <p className="text-center text-base leading-snug text-ink">{t('latihan.997.dial')}</p>
      <p
        aria-live="polite" aria-label={t('latihan.997.display')}
        className="mt-3 flex h-16 w-full items-center justify-center rounded-2xl bg-white font-mono text-[34px] font-semibold tracking-[0.2em] text-ink ring-1 ring-indigo-soft"
      >
        {typed || <span aria-hidden className="text-ink-soft/40">···</span>}
      </p>
      <div className="mt-3 grid w-full grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={k} type="button" aria-label={k} onClick={() => press(k)}
            className="flex h-16 items-center justify-center rounded-full bg-indigo-soft font-mono text-[28px] font-semibold text-indigo active:scale-95 active:bg-kancil-soft"
          >
            {k}
          </button>
        ))}
      </div>
      <button
        type="button" aria-label={t('latihan.997.delete')} onClick={() => setTyped('')}
        className="mt-3 flex h-12 w-16 items-center justify-center rounded-full text-ink-soft"
      >
        <Delete aria-hidden size={26} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function Row({ checked, disabled, label, onClick }: { checked: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onClick}
      className={`flex min-h-14 w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left text-base leading-snug ring-1 ${checked ? 'bg-safe-soft text-ink ring-safe' : 'bg-white text-ink ring-ink/20'}`}
    >
      <span aria-hidden className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${checked ? 'bg-safe text-white' : 'bg-white ring-2 ring-ink/40'}`}>
        {checked && <Check size={20} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}

function Call() {
  const t = useT();
  const loc = useLoc();
  const call = drills?.call997;
  const [stepsDone, setStepsDone] = useState(0);
  const [ready, setReady] = useState<number[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const steps = call?.steps ?? [];
  const checklist = call?.checklist ?? [];
  const finished = !!call && stepsDone >= steps.length && ready.length >= checklist.length;

  useEffect(() => {
    if (!finished) return;
    if (useGame.getState().completeDrill('997')) toast(t('latihan.997.xp', { xp: BALANCE.xp.drill }), 'success');
    endRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [finished, t]);

  if (!call) return null;
  const visible = steps.slice(0, Math.min(stepsDone + 1, steps.length));
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-2xl bg-safe-soft px-3 py-2.5 text-base font-semibold leading-snug text-ink">
        <PhoneCall aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0" />
        {t('latihan.997.connected')}
      </p>
      <section aria-labelledby="d997-steps">
        <h2 id="d997-steps" className="font-display text-lg font-extrabold text-ink">{t('latihan.997.stepsTitle')}</h2>
        <p className="mt-0.5 text-base leading-snug text-ink-soft">{t('latihan.997.stepsHint')}</p>
        <ol className="mt-2 flex flex-col gap-2">
          {visible.map((s, i) => (
            <li key={i}>
              <Row
                checked={i < stepsDone} disabled={i < stepsDone} label={loc(s)}
                onClick={() => setStepsDone((n) => Math.max(n, i + 1))}
              />
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="d997-check">
        <h2 id="d997-check" className="font-display text-lg font-extrabold text-ink">{t('latihan.997.checkTitle')}</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {checklist.map((c, i) => (
            <li key={i}>
              <Row
                checked={ready.includes(i)} label={loc(c)}
                onClick={() => setReady((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))}
              />
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="d997-why" className="rounded-2xl bg-kancil-soft p-4">
        <h2 id="d997-why" className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Info aria-hidden size={22} strokeWidth={1.75} />
          {t('latihan.997.whyTitle')}
        </h2>
        <p className="mt-1 text-base leading-snug text-ink">{loc(call.why)}</p>
        <p className="mt-2 text-base leading-snug text-ink-soft">{t('legal.drill997.freeze')}</p>
      </section>
      <div ref={endRef}>
        {finished && (
          <div role="status" className="rounded-2xl bg-safe-soft p-4 ring-1 ring-safe">
            <p className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
              <CircleCheck aria-hidden size={26} strokeWidth={2} className="text-safe" />
              {t('latihan.997.finished')}
            </p>
            <p className="mt-1 text-base leading-snug text-ink">{t('latihan.997.finishedBody')}</p>
            <button type="button" onClick={() => navigate('/latihan')} className="mt-3 min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]">
              {t('common.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Drill997() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('dial');
  useEffect(() => {
    if (phase !== 'connecting') return;
    const id = setTimeout(() => setPhase('call'), BALANCE.drill.connectMs);
    return () => clearTimeout(id);
  }, [phase]);
  return (
    <div data-screen="latihan-997" className="relative flex min-h-0 flex-1 flex-col bg-paper">
      <DrillHeader title={t('latihan.997.title')} back="/latihan" />
      <SimulasiBanner />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {phase === 'dial' && <Dialler onCode={() => setPhase('connecting')} />}
        {phase === 'connecting' && (
          <p role="status" className="flex items-center justify-center gap-2 py-16 font-display text-xl font-extrabold text-indigo">
            <PhoneCall aria-hidden size={26} strokeWidth={1.75} className="animate-pulse" />
            {t('latihan.997.connecting')}
          </p>
        )}
        {phase === 'call' && <Call />}
        <p className="mt-6 rounded-2xl bg-danger-soft px-3 py-2.5 text-base font-semibold leading-snug text-danger-ink">{t('latihan.997.real')}</p>
      </div>
    </div>
  );
}
