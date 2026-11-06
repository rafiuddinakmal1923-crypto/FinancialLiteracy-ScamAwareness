import type { ReactNode } from 'react';
import type { Vars } from '../../shell/i18n';

const MARK = '\u0001';

/**
 * One i18n string with its variables set in the numbers face, e.g. "Nilai bersih {total}" -> "Nilai bersih "
 * + <span class="font-mono">RM2,000</span>. The copy stays one translatable sentence.
 */
export function richT(t: (key: string, vars?: Vars) => string, key: string, vars: Vars, cls = 'font-mono font-semibold'): ReactNode[] {
  const names = Object.keys(vars);
  const marked: Vars = {};
  names.forEach((n, i) => { marked[n] = `${MARK}${i}${MARK}`; });
  return t(key, marked).split(MARK).map((part, i) =>
    i % 2 === 1 ? <span key={i} className={cls}>{String(vars[names[Number(part)]!])}</span> : part,
  );
}
