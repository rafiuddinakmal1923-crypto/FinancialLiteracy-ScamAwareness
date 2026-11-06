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

describe('generateModule', () => {
  it('emits every named export', () => {
    const code = generateModule(loadCelikContent(repoContent).data);
    for (const name of ['scenarios', 'tactics', 'cards', 'sindiket', 'drills', 'semester', 'pages']) {
      expect(code).toContain(`export const ${name} =`);
    }
  });
});
