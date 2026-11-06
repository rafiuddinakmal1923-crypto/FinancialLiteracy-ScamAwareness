import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCelikContent, generateModule } from './ink';

const repoContent = fileURLToPath(new URL('../../content', import.meta.url));
const scenarioSrc = readFileSync(join(repoContent, 'scenarios', 'kerja_sambilan.ink'), 'utf8');

function tempContent(): string {
  const dir = mkdtempSync(join(tmpdir(), 'celik-content-'));
  mkdirSync(join(dir, 'scenarios'));
  return dir;
}

describe('loadCelikContent', () => {
  it('loads the repo content with no problems', () => {
    const r = loadCelikContent(repoContent);
    expect(r.problems).toEqual([]);
    expect(r.data.scenarios.kerja_sambilan.meta.family).toBe('job');
    expect(Array.isArray(r.data.tactics)).toBe(true);
    expect(Array.isArray(r.data.concepts)).toBe(true);
    expect((r.data.concepts as unknown[]).length).toBe(6);
    expect(r.files.some((f) => f.endsWith('kerja_sambilan.ink'))).toBe(true);
  });

  it('exports null for registered files that do not exist and ignores unregistered JSON', () => {
    const dir = tempContent();
    writeFileSync(join(dir, 'scenarios', 'kerja_sambilan.ink'), '﻿' + scenarioSrc);
    writeFileSync(join(dir, 'sindiket.json'), '{"apa":"belum didaftar"}');
    const r = loadCelikContent(dir);
    expect(r.problems).toEqual([]);
    expect(r.data.tactics).toBeNull();
    expect(r.data.cards).toBeNull();
    expect(r.data.sindiket).toBeNull();
    expect(Object.keys(r.data.scenarios)).toEqual(['kerja_sambilan']);
  });

  it('reports schema errors, banned names and bad scenarios', () => {
    const dir = tempContent();
    writeFileSync(join(dir, 'banned-names.txt'), '# test\nBankSebenar\n');
    writeFileSync(join(dir, 'tactics.json'), '[{"code":"tamak"}]');
    writeFileSync(join(dir, 'scenarios', 'rosak.ink'), 'Hai dari BankSebenar\n-> END\n');
    const r = loadCelikContent(dir);
    expect(r.problems.some((p) => p.includes('tactics.json'))).toBe(true);
    expect(r.problems.some((p) => p.includes('BankSebenar'))).toBe(true);
    expect(r.problems.some((p) => p.includes('rosak.ink'))).toBe(true);
  });

  it('does not scan banned-names.txt itself', () => {
    const dir = tempContent();
    writeFileSync(join(dir, 'banned-names.txt'), 'BankSebenar\n');
    expect(loadCelikContent(dir).problems).toEqual([]);
  });
});

describe('real names and rates (D27)', () => {
  it('allows KWSP in concepts.json only and does not scan the allowlist file', () => {
    const dir = tempContent();
    writeFileSync(join(dir, 'banned-names.txt'), 'KWSP\nMaybank\n');
    writeFileSync(join(dir, 'allowed-real-names.txt'), 'KWSP\n');
    writeFileSync(join(dir, 'concepts.json'), JSON.stringify([{ code: 'bajet', apa: { ms: 'Panduan KWSP Belanjawanku.' } }]));
    writeFileSync(join(dir, 'scenarios', 'rosak.ink'), 'Saya dari KWSP\n-> END\n');
    const r = loadCelikContent(dir);
    const kwsp = r.problems.filter((p) => p.includes('KWSP'));
    expect(kwsp).toHaveLength(1);
    expect(kwsp[0]).toMatch(/^scenarios\/rosak\.ink:1/);
  });

  it('reports a rate in concepts.json without a TODO-VERIFY marker', () => {
    const dir = tempContent();
    writeFileSync(join(dir, 'concepts.json'), JSON.stringify([{ code: 'kompaun', contoh: { ms: 'Contoh: 5% setahun' } }]));
    const r = loadCelikContent(dir);
    expect(r.problems.some((p) => p.startsWith('concepts.json: 0.contoh') && /TODO-VERIFY/.test(p))).toBe(true);
  });
});

describe('generateModule', () => {
  it('emits every named export', () => {
    const code = generateModule(loadCelikContent(repoContent).data);
    for (const name of ['scenarios', 'tactics', 'cards', 'concepts', 'sindiket', 'drills', 'semester', 'pages']) {
      expect(code).toContain(`export const ${name} =`);
    }
  });
});
