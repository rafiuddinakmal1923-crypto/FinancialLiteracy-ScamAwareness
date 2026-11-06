import { BALANCE } from './balance';
import { TACTICS, type Effect, type Meters, type Outcome, type ScenarioMeta, type Tactic } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function initialMeters(b: typeof BALANCE = BALANCE): Meters {
  const imuniti = {} as Record<Tactic, number>;
  for (const t of TACTICS) imuniti[t] = b.start.imuniti;
  return {
    duit: b.start.duit, simpanan: b.start.simpanan, tekanan: b.start.tekanan, xp: b.start.xp,
    imuniti, akaun: 'Aktif', rekod: 'Bersih',
  };
}

export function applyEffect(m: Meters, e: Effect): Meters {
  switch (e.kind) {
    case 'duit': {
      const duit = Math.max(0, m.duit + e.delta);
      return { ...m, duit, simpanan: Math.min(m.simpanan, duit) };
    }
    case 'tekanan': return { ...m, tekanan: clamp(m.tekanan + e.delta, 0, 100) };
    case 'akaun': return { ...m, akaun: e.value };
    case 'rekod': return { ...m, rekod: e.value };
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

export function applyOutcome(m: Meters, meta: ScenarioMeta, outcome: Outcome): Meters {
  if (meta.type === 'scam') {
    if (outcome === 'curiga') throw new Error(`Invalid outcome "curiga" for scam scenario ${meta.id}`);
    if (outcome === 'safe') return applyXp(bump(m, meta.tactics, BALANCE.imuniti.safe), BALANCE.xp.safe);
    return applyXp(bump(m, meta.tactics, BALANCE.imuniti.fell), BALANCE.xp.fell);
  }
  if (outcome === 'safe') return applyXp(m, BALANCE.xp.safe);
  if (outcome === 'curiga') return applyXp(m, 0);
  throw new Error(`Invalid outcome "${outcome}" for legit scenario ${meta.id}`);
}

export function applyFlagFound(m: Meters, tactic: Tactic): Meters {
  return applyXp(bump(m, [tactic], BALANCE.imuniti.flag), BALANCE.xp.flag);
}

export function isRight(_type: 'scam' | 'legit', outcome: Outcome): boolean {
  return outcome === 'safe';
}
