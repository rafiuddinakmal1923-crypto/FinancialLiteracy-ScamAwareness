// npm run check:content: compiles every scenario, validates content JSON and scans all content
// for real brands, URLs and phone numbers (CLAUDE.md hard rule 1; real scheme names only in concepts.json, D27)
// and unmarked rates in concepts.json (rule 11). Exits 1 on any problem.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCelikContent, readText } from '../vite-plugins/ink';

export { scanText, readBannedNames, namesFor, rateMarkerProblems } from '../vite-plugins/ink';

const appDir = fileURLToPath(new URL('..', import.meta.url));

/**
 * Keys listed in ms.json `_todoVerify`: `legal.*` sentences and other copy that makes legal or enforcement
 * claims (e.g. the mule/frozen consequence steps), still to verify against a source.
 */
export function todoVerifyKeys(msJsonPath: string): string[] {
  if (!existsSync(msJsonPath)) return [];
  const ms = JSON.parse(readText(msJsonPath)) as { _todoVerify?: unknown };
  const list = Array.isArray(ms._todoVerify) ? ms._todoVerify : [];
  return list.filter((k): k is string => typeof k === 'string');
}

function main(): number {
  const contentDir = resolve(appDir, '..', 'content');
  const { data, problems } = loadCelikContent(contentDir);

  for (const key of todoVerifyKeys(resolve(appDir, 'src', 'shell', 'i18n', 'ms.json'))) {
    console.warn(`WARN TODO-VERIFY ${key}`);
  }

  if (problems.length) {
    console.error(`check:content found ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ${p}`);
    return 1;
  }
  const ids = Object.keys(data.scenarios);
  console.log(`check:content OK - ${ids.length} scenario(s): ${ids.join(', ') || '(none)'}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exit(main());
}
