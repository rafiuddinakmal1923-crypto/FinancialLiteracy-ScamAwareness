import { describe, expect, it } from 'vitest';
import { cardId, deriveCards } from './cards';
import type { CompiledScenario, ScenarioMeta } from './types';

function scenario(meta: Partial<ScenarioMeta> & { id: string }, flags: CompiledScenario['flags']): CompiledScenario {
  return {
    meta: { type: 'scam', family: 'job', tactics: [], contact: 'X', ui: 'chat', apaPatut: [], ...meta },
    json: '',
    flags,
  };
}

describe('deriveCards', () => {
  it('one card per tactic-family pair', () => {
    const a = scenario({ id: 'a', family: 'job' }, [
      { tactic: 'greed', phrase: 'RM300 sehari' },
      { tactic: 'urgency', phrase: 'slot tinggal 3' },
      { tactic: 'greed', phrase: 'gaji lumayan' },
    ]);
    const b = scenario({ id: 'b', family: 'job' }, [{ tactic: 'greed', phrase: 'RM500 seminggu' }]);
    const c = scenario({ id: 'c', family: 'parcel' }, [{ tactic: 'greed', phrase: 'hadiah percuma' }]);
    const cards = deriveCards([a, b, c]);
    expect(cards).toEqual([
      { id: cardId('greed', 'job'), tactic: 'greed', family: 'job', cue: 'RM300 sehari' },
      { id: cardId('urgency', 'job'), tactic: 'urgency', family: 'job', cue: 'slot tinggal 3' },
      { id: cardId('greed', 'parcel'), tactic: 'greed', family: 'parcel', cue: 'hadiah percuma' },
    ]);
  });

  it('legit scenarios give no cards', () => {
    const legit = scenario({ id: 'l', type: 'legit', family: 'job' }, [{ tactic: 'greed', phrase: 'gaji' }]);
    expect(deriveCards([legit])).toEqual([]);
  });
});
