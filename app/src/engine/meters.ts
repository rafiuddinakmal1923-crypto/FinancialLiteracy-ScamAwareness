import { BALANCE } from './balance';
import { round2 } from './money';
import {
  CONCEPTS, LABUR_PRODUCTS, OUTCOMES_BY_TYPE, RIGHT_OUTCOMES, TACTICS,
  type Concept, type Effect, type LaburProduct, type Meters, type Outcome, type ScenarioMeta, type Tactic,
} from './types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function initialMeters(b: typeof BALANCE = BALANCE): Meters {
  const imuniti = {} as Record<Tactic, number>;
  for (const t of TACTICS) imuniti[t] = b.start.imuniti;
  const celik = {} as Record<Concept, number>;
  for (const c of CONCEPTS) celik[c] = b.start.celik;
  const labur = {} as Record<LaburProduct, number>;
  for (const p of LABUR_PRODUCTS) labur[p] = b.start.labur;
  return {
    duit: b.start.duit, simpanan: b.start.simpanan, tekanan: b.start.tekanan, xp: b.start.xp,
    imuniti, akaun: 'Aktif', rekod: 'Bersih', celik, labur,
  };
}

export function applyEffect(m: Meters, e: Effect): Meters {
  switch (e.kind) {
    case 'duit': {
      const duit = Math.max(0, round2(m.duit + e.delta));
      return { ...m, duit, simpanan: Math.min(m.simpanan, duit) };
    }
    case 'tekanan': return { ...m, tekanan: clamp(m.tekanan + e.delta, 0, 100) };
    case 'akaun': return { ...m, akaun: e.value };
    case 'rekod': return { ...m, rekod: e.value };
    case 'labur': return { ...m, labur: { ...m.labur, [e.product]: Math.max(0, round2(m.labur[e.product] + e.delta)) } };
  }
}

export function applyXp(m: Meters, delta: number): Meters {
  return { ...m, xp: Math.max(0, m.xp + delta) };
}

function bump(m: Meters, tactics: Tactic[], delta: number): Meters {
  const imuniti = { ...m.imuniti };
  for (const t of tactics) imuniti[t] = clamp(imuniti[t] + delta, 0, 100);
  return { ...m, imuniti };
}

function bumpCelik(m: Meters, concepts: Concept[], delta: number): Meters {
  if (concepts.length === 0) return m;
  const celik = { ...m.celik };
  for (const c of concepts) celik[c] = clamp(celik[c] + delta, 0, 100);
  return { ...m, celik };
}

/** A right call: `safe` or `untung`. Everything else (scammed, mule, frozen, curiga, rugi, hutang) is wrong (SDS 5.4). */
export function isRight(outcome: Outcome): boolean {
  return RIGHT_OUTCOMES.includes(outcome);
}

/**
 * Applies a scenario's outcome (SDS 5.2, D24, D30). Scam: Imuniti for its tactics and scam XP. Legit: legit XP.
 * Finance: finance XP. In every type, declared concepts move Celik by the right/wrong rule; XP is awarded once.
 */
export function applyOutcome(m: Meters, meta: ScenarioMeta, outcome: Outcome): Meters {
  if (!OUTCOMES_BY_TYPE[meta.type].includes(outcome)) {
    throw new Error(`Invalid outcome "${outcome}" for ${meta.type} scenario ${meta.id}`);
  }
  const right = isRight(outcome);
  const withCelik = bumpCelik(m, meta.concepts, right ? BALANCE.celik.right : BALANCE.celik.wrong);
  switch (meta.type) {
    case 'scam':
      return right
        ? applyXp(bump(withCelik, meta.tactics, BALANCE.imuniti.safe), BALANCE.xp.safe)
        : applyXp(bump(withCelik, meta.tactics, BALANCE.imuniti.fell), BALANCE.xp.fell);
    case 'legit':
      return applyXp(withCelik, right ? BALANCE.xp.safe : 0);
    case 'finance':
      return applyXp(withCelik, right ? BALANCE.xp.financeRight : BALANCE.xp.financeWrong);
  }
}

/** Net worth (S03 home, S12 Dompet): spendable Duit plus both Labur pots, in RM. */
export function netWorth(m: Meters): number {
  return round2(m.duit + LABUR_PRODUCTS.reduce((sum, p) => sum + m.labur[p], 0));
}

export function applyFlagFound(m: Meters, tactic: Tactic): Meters {
  return applyXp(bump(m, [tactic], BALANCE.imuniti.flag), BALANCE.xp.flag);
}
