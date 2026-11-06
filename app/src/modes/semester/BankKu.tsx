// S08 BankKu, the fictional bank (CLAUDE.md rule 1): home (balance, Pelaburan, last 5 transactions, frozen state)
// and the transfer -> TAC flow a scenario opens with `ui:transfer`. Everything is pre-filled and read-only (rule 2);
// BankKu never moves money itself: the scenario's effect tags do, after the ink reads `ui_ok`.
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Lock, ShieldAlert, TriangleAlert } from 'lucide-react';
import { LABUR_PRODUCTS } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame, type TxEntry } from '../../state/game';
import { formatBank, formatSignedBank } from '../../ui/format';
import { SimulasiBanner } from '../../ui/SimulasiBanner';

/** How many transactions the home screen lists. */
const SHOWN_TX = 5;

/** Small stable hash of a string (fake account numbers and TAC codes stay the same between renders). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A fake account number for a contact: "0000-0000-0NNN" (never a real-looking number). */
export function fakeAccount(name: string): string {
  return `0000-0000-0${String(hash(name) % 1000).padStart(3, '0')}`;
}

/** A fake 6-digit TAC, stable for the same seed. */
export function fakeTac(seed: string): string {
  return String(hash(`tac:${seed}`) % 1000000).padStart(6, '0');
}

/** Calls `fn` once; later calls (a double tap, Batal after Hantar in the same burst) are ignored (Review Focus 3). */
export function useOnce(fn: (ok: boolean) => void): (ok: boolean) => void {
  const done = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((ok: boolean) => {
    if (done.current) return;
    done.current = true;
    fnRef.current(ok);
  }, []);
}

/** BankKu's own mark: an amber coin with a K, as on the home-screen icon. Not modelled on any real bank. */
export function BankKuLogo({ size = 36, label }: { size?: number; label?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 40 40"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className="shrink-0"
    >
      <circle cx="20" cy="22" r="17" fill="#D9822B" />
      <circle cx="20" cy="19" r="17" fill="var(--color-kancil)" />
      <circle cx="20" cy="19" r="12.5" fill="none" stroke="var(--color-kancil-soft)" strokeWidth="1.6" strokeDasharray="2 2.2" />
      <path d="M16 12.5V25.5M16 19.5L23.5 12.5M18.4 17.6L24 25.5" stroke="var(--color-ink)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Wordmark({ size = 36 }: { size?: number }) {
  const t = useT();
  return (
    <span className="flex items-center gap-2">
      <BankKuLogo size={size} label={t('bankku.logo')} />
      <span className="font-display text-xl font-extrabold tracking-tight">
        Bank<span className="text-kancil">Ku</span>
      </span>
    </span>
  );
}

/** Indigo bar for the transfer and TAC screens (room on the right for the DEMO mark). */
function FlowHeader() {
  return (
    <div className="guilloche flex min-h-16 shrink-0 items-center bg-indigo py-2 pl-4 pr-20 text-paper">
      <Wordmark size={32} />
    </div>
  );
}

function FlowTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink">{children}</h2>;
}

/** Bottom action area: primary on top, Batal below; both in the bottom 40% of the screen (principle 4). */
function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex shrink-0 flex-col gap-2 bg-paper px-4 pb-4 pt-3">{children}</div>;
}

const PRIMARY = 'min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]';
const SECONDARY = 'min-h-12 w-full rounded-2xl bg-white px-4 text-base font-semibold text-ink ring-1 ring-inset ring-ink/20 active:scale-[.98]';

/**
 * The TAC prompt: a pre-filled fake code (nothing to type) and the red warning. `amount`/`to` describe a BankKu
 * transfer; a fake page that asks for the TAC leaves them out. `finish` must already be guarded (useOnce).
 */
export function TacScreen({ amount, to, seed, finish }: { amount?: number; to?: string; seed: string; finish(ok: boolean): void }) {
  const t = useT();
  const code = fakeTac(seed);
  return (
    <div data-screen="bankku-tac" className="flex min-h-0 flex-1 flex-col bg-paper">
      <FlowHeader />
      <SimulasiBanner />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5">
        <FlowTitle>{t('bankku.tac.title')}</FlowTitle>
        <p className="mt-1 text-base leading-snug text-ink">
          {amount !== undefined && to ? t('bankku.tac.body', { amount: formatBank(amount), to }) : t('bankku.tac.bodyPage')}
        </p>
        <div role="img" aria-label={t('bankku.tac.code', { code })} className="mt-4 flex justify-center gap-1.5">
          {code.split('').map((d, i) => (
            <span
              key={i}
              className={`flex h-14 w-11 items-center justify-center rounded-xl bg-white font-mono text-[28px] font-semibold text-ink shadow-[0_2px_8px_rgba(28,27,58,.08)] ring-1 ring-indigo-soft ${i === 3 ? 'ml-2' : ''}`}
            >
              {d}
            </span>
          ))}
        </div>
        <p role="alert" className="mt-5 flex items-start gap-2 rounded-2xl bg-danger p-3 text-base font-semibold leading-snug text-white">
          <TriangleAlert aria-hidden size={22} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>{t('bankku.tac.warning')}</span>
        </p>
      </div>
      <Actions>
        <button type="button" onClick={() => finish(true)} className={PRIMARY}>{t('bankku.tac.send')}</button>
        <button type="button" onClick={() => finish(false)} className={SECONDARY}>{t('bankku.cancel')}</button>
      </Actions>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-3">
      <dt className="text-base text-ink-soft">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

export interface TransferProps { amount: number; to: string; onDone(ok: boolean): void }

/** Transfer screen -> Sahkan -> TAC -> Hantar TAC (true) or Batal on either screen (false). */
function TransferFlow({ amount, to, onDone }: TransferProps) {
  const t = useT();
  const name = useGame((s) => s.name);
  const [step, setStep] = useState<'transfer' | 'tac'>('transfer');
  const finish = useOnce(onDone);
  const confirmed = useRef(false);
  const sahkan = () => {
    if (confirmed.current) return;
    confirmed.current = true;
    setStep('tac');
  };
  if (step === 'tac') return <TacScreen amount={amount} to={to} seed={`${to}:${amount}`} finish={finish} />;
  return (
    <div data-screen="bankku-transfer" className="flex min-h-0 flex-1 flex-col bg-paper">
      <FlowHeader />
      <SimulasiBanner />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5">
        <FlowTitle>{t('bankku.transfer.title')}</FlowTitle>
        <dl className="mt-3 divide-y divide-indigo-soft rounded-2xl bg-white px-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          <Row label={t('bankku.transfer.from')}>
            <span className="block text-base font-semibold text-ink">{t('bankku.account', { name })}</span>
            <span className="block text-base text-ink-soft">{t('bankku.accountNo', { no: fakeAccount(`self:${name}`) })}</span>
          </Row>
          <Row label={t('bankku.transfer.to')}>
            <span className="block text-base font-semibold text-ink">{to}</span>
            <span className="block text-base text-ink-soft">{t('bankku.accountNo', { no: fakeAccount(to) })}</span>
          </Row>
          <Row label={t('bankku.transfer.amount')}>
            <span className="block font-mono text-[32px] font-semibold leading-tight text-ink">{formatBank(amount)}</span>
          </Row>
        </dl>
      </div>
      <Actions>
        <button type="button" onClick={sahkan} className={PRIMARY}>{t('bankku.transfer.confirm')}</button>
        <button type="button" onClick={() => finish(false)} className={SECONDARY}>{t('bankku.cancel')}</button>
      </Actions>
    </div>
  );
}

/** A transaction label: an i18n key for income and Labur moves, otherwise the stored name or cost label. */
function useTxLabel() {
  const t = useT();
  return (e: TxEntry) => (e.label.startsWith('bankku.') ? t(e.label) : e.label);
}

function Transactions() {
  const t = useT();
  const txLog = useGame((s) => s.txLog);
  const label = useTxLabel();
  const shown = txLog.slice(-SHOWN_TX).reverse();
  return (
    <section aria-labelledby="bankku-tx" className="mx-4 mt-5">
      <h2 id="bankku-tx" className="font-display text-xl font-bold text-ink">{t('bankku.tx.title')}</h2>
      {shown.length === 0 ? (
        <p className="mt-2 rounded-2xl bg-white p-4 text-base text-ink-soft shadow-[0_2px_8px_rgba(28,27,58,.08)]">{t('bankku.tx.empty')}</p>
      ) : (
        <ul aria-label={t('bankku.tx.title')} className="mt-2 divide-y divide-indigo-soft rounded-2xl bg-white px-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          {shown.map((e) => {
            const inflow = e.amount > 0;
            const Icon = inflow ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={e.id} className="flex min-h-14 items-center gap-3 py-2">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${inflow ? 'bg-safe-soft text-safe' : 'bg-indigo-soft text-indigo'}`}>
                  <Icon aria-hidden size={20} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-base font-semibold leading-snug text-ink">{label(e)}</span>
                  <span className="block text-base text-ink-soft">
                    <span className="sr-only">{t(inflow ? 'bankku.tx.in' : 'bankku.tx.out')}, </span>
                    {t('bankku.tx.week', { week: Math.max(1, e.week) })}
                  </span>
                </span>
                <span className={`shrink-0 font-mono text-base font-semibold ${inflow ? 'text-safe' : 'text-ink'}`}>{formatSignedBank(e.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Investments() {
  const t = useT();
  const labur = useGame((s) => s.meters.labur);
  return (
    <section aria-label={t('bankku.invest.title')} className="mx-4 mt-5">
      <h2 className="font-display text-xl font-bold text-ink">{t('bankku.invest.title')}</h2>
      <ul className="mt-2 divide-y divide-indigo-soft rounded-2xl bg-white px-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        {LABUR_PRODUCTS.map((p) => (
          <li key={p} className="flex min-h-14 items-center justify-between gap-3 py-2">
            <span className="text-base font-semibold text-ink">{t(`labur.${p}.name`)}</span>
            <span className="shrink-0 font-mono text-base font-semibold text-ink">{formatBank(labur[p])}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-base leading-snug text-ink-soft">{t('bankku.invest.note')}</p>
    </section>
  );
}

/** S08 home: logo, big mono balance (or the frozen banner), Pelaburan, last 5 transactions. */
function Home() {
  const t = useT();
  const name = useGame((s) => s.name);
  const duit = useGame((s) => s.meters.duit);
  const akaun = useGame((s) => s.meters.akaun);
  const pending = useGame((s) => s.lastEnded?.id ?? null);
  const frozen = akaun !== 'Aktif';
  return (
    <div data-screen={frozen ? 'bankku-beku' : 'bankku'} className="flex min-h-0 flex-1 flex-col">
      {/* First under the status bar, so it leaves room on the right for the DEMO mark. */}
      <SimulasiBanner className="pr-20" />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-6">
        <div className={`${frozen ? 'guilloche-frozen bg-danger' : 'guilloche bg-indigo'} px-4 pb-10 text-paper`}>
          <div className="flex items-center gap-1 pr-16">
            <button
              type="button"
              aria-label={t('common.back')}
              onClick={() => navigate('/home')}
              className="-ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            >
              <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
            </button>
            <h1 className="sr-only">{t('app.bankku')}</h1>
            <Wordmark />
          </div>
          {frozen ? (
            <div role="alert" className="mt-3">
              <p className="flex items-center gap-2 font-display text-[26px] font-extrabold leading-tight">
                <ShieldAlert aria-hidden size={30} strokeWidth={2} className="shrink-0" />
                {t('bankku.frozen.title')}
              </p>
              <p className="mt-1.5 text-base leading-snug text-white">{t(`bankku.frozen.reason.${akaun}`)}</p>
              <button
                type="button"
                onClick={() => navigate(pending ? `/semester/akibat/${pending}` : '/home')}
                className="mt-4 min-h-12 w-full rounded-2xl bg-white px-4 text-base font-semibold text-ink active:scale-[.98]"
              >
                {t('bankku.frozen.next')}
              </button>
            </div>
          ) : (
            <p className="mt-1 text-base text-paper/90">{t('bankku.motto')}</p>
          )}
        </div>

        <section
          aria-label={t('bankku.balance')}
          className="relative z-10 mx-4 -mt-6 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]"
        >
          <p className="text-base font-semibold text-ink">{t('bankku.account', { name })}</p>
          <p className="text-base text-ink-soft">{t('bankku.accountNo', { no: fakeAccount(`self:${name}`) })}</p>
          <p className="mt-3 flex items-center gap-1.5 text-base text-ink-soft">
            {frozen && <Lock aria-hidden size={18} strokeWidth={2} className="text-danger" />}
            {t(frozen ? 'bankku.frozen.balance' : 'bankku.balance')}
          </p>
          <p className={`font-mono text-[36px] font-semibold leading-tight ${frozen ? 'text-ink-soft line-through decoration-danger decoration-2' : 'text-ink'}`}>
            {formatBank(duit)}
          </p>
        </section>

        <Investments />
        <Transactions />
      </div>
    </div>
  );
}

export function BankKu({ mode, transfer }: { mode: 'home' | 'transfer'; transfer?: TransferProps }) {
  if (mode === 'transfer' && transfer) return <TransferFlow {...transfer} />;
  return <Home />;
}

/** Route `/bankku` (the home-screen BankKu tile). */
export function BankKuScreen() {
  return <BankKu mode="home" />;
}
