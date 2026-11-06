import { CircleCheck, Gavel, Lock, Search, ShieldX } from 'lucide-react';
import type { ReactNode } from 'react';
import { BALANCE } from '../engine/balance';
import type { Akaun, Rekod } from '../engine/types';
import { useGame } from '../state/game';
import { formatRM } from '../ui/format';
import { Kancil, type KancilMood } from '../ui/Kancil';
import { MeterBar } from '../ui/MeterBar';
import { useT } from './i18n';
import { tekananLevel } from './StatusBar';

const AKAUN_STYLE: Record<Akaun, { icon: typeof Lock; cls: string }> = {
  Aktif: { icon: CircleCheck, cls: 'bg-safe-soft text-ink' },
  Disekat: { icon: Lock, cls: 'bg-danger-soft text-ink' },
  Ditutup: { icon: ShieldX, cls: 'bg-danger-soft text-ink' },
};
const REKOD_STYLE: Record<Rekod, { icon: typeof Lock; cls: string }> = {
  Bersih: { icon: CircleCheck, cls: 'bg-safe-soft text-ink' },
  Disiasat: { icon: Search, cls: 'bg-kancil-soft text-ink' },
  Didakwa: { icon: Gavel, cls: 'bg-danger-soft text-ink' },
};

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-paper p-5 shadow-[0_2px_8px_rgba(28,27,58,.08)] ${className}`}>{children}</div>;
}

function StatusRow({ label, value, icon: Icon, cls }: { label: string; value: string; icon: typeof Lock; cls: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-base font-medium text-ink">{label}</span>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-semibold ${cls}`}>
        <Icon aria-hidden size={18} strokeWidth={1.75} />
        {value}
      </span>
    </div>
  );
}

/** Desktop (>= 1280 px) only: Kancil tip on the left. */
export function TipPanel({ tipKey, mood }: { tipKey: string; mood: KancilMood }) {
  const t = useT();
  return (
    <aside aria-label={t('side.tipTitle')} className="hidden w-[300px] flex-col items-center xl:flex">
      <Kancil mood={mood} size={190} decorative className="relative z-10 -mb-6" />
      <Panel className="w-full bg-kancil-soft">
        <p className="font-display text-xl font-bold text-ink">{t('side.tipTitle')}</p>
        <p className="mt-2 text-lg leading-snug text-ink">{t(tipKey, { duit: formatRM(BALANCE.start.duit) })}</p>
      </Panel>
    </aside>
  );
}

/** Desktop (>= 1280 px) only: live meters on the right. */
export function MetersPanel() {
  const t = useT();
  const m = useGame((s) => s.meters);
  const tk = tekananLevel(m.tekanan);
  const ak = AKAUN_STYLE[m.akaun];
  const rk = REKOD_STYLE[m.rekod];
  return (
    <aside aria-label={t('side.metersTitle')} className="hidden w-[300px] xl:block">
      <Panel>
        <p className="font-display text-xl font-bold text-ink">{t('side.metersTitle')}</p>
        <div className="mt-4 flex flex-col gap-4">
          <MeterBar label={t('meter.duit')} value={m.duit} max={Math.max(BALANCE.start.duit, m.duit)} display={formatRM(m.duit)} tone="kancil" />
          <div className="flex items-baseline justify-between">
            <span className="text-base font-medium text-ink">{t('meter.simpanan')}</span>
            <span className="font-mono text-base font-semibold text-ink">{formatRM(m.simpanan)}</span>
          </div>
          <MeterBar
            label={t('meter.tekanan')} value={m.tekanan} max={100}
            display={`${m.tekanan} (${t(`status.tekanan.${tk}`)})`}
            tone={tk === 'low' ? 'safe' : tk === 'mid' ? 'warning' : 'danger'}
          />
          <StatusRow label={t('meter.akaun')} value={t(`akaun.${m.akaun}`)} icon={ak.icon} cls={ak.cls} />
          <StatusRow label={t('meter.rekod')} value={t(`rekod.${m.rekod}`)} icon={rk.icon} cls={rk.cls} />
        </div>
      </Panel>
    </aside>
  );
}
