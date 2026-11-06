import { describe, expect, it } from 'vitest';
import { translate, type Vars } from '../../shell/i18n';
import ms from '../../shell/i18n/ms.json';
import { consequenceBase, consequenceSteps, consequenceTone } from './aftermath';

const t = (key: string, vars?: Vars) => translate('ms', key, vars);

describe('consequence copy variants (Task 16 fix)', () => {
  it('uses a scenario variant when it has one, else the outcome template', () => {
    expect(consequenceBase(t, 'sewa_akaun', 'frozen')).toBe('akibat.sewa_akaun.frozen');
    expect(consequenceBase(t, 'kerja_sambilan', 'frozen')).toBe('akibat.frozen');
    expect(consequenceBase(t, 'sewa_akaun', 'mule')).toBe('akibat.mule');
  });

  it('early report on sewa_akaun: softer tone and the "melapor awal" step', () => {
    const base = consequenceBase(t, 'sewa_akaun', 'frozen');
    expect(consequenceTone(t, base, 'frozen')).toBe('warning');
    expect(consequenceTone(t, 'akibat.frozen', 'frozen')).toBe('danger');
    const steps = consequenceSteps(t, 'frozen', {}, base);
    expect(steps.some((s) => /melapor awal/.test(s.text) && /semasa pemeriksaan/.test(s.text))).toBe(true);
    expect(t(`${base}.title`)).not.toMatch(/bodoh/i);
  });

  it('mule step 4 shows the Rekod label from rekod.*, and step 3 says the remaining balance was taken', () => {
    const steps = consequenceSteps(t, 'mule', { rekod: t('rekod.Disiasat') });
    expect(steps[3]!.text).toMatch(/Rekod kamu kini: Disiasat\./);
    expect(ms['akibat.mule.4.text']).toContain('{rekod}');
    expect(steps[2]!.text).toMatch(/Baki/);
  });

  it('lists the mule and early-report enforcement claims in _todoVerify', () => {
    for (const k of ['akibat.mule.1.text', 'akibat.mule.2.text', 'akibat.mule.3.text', 'akibat.mule.4.text', 'legal.penalCode', 'akibat.sewa_akaun.frozen.2.text']) {
      expect(ms._todoVerify).toContain(k);
    }
  });
});
