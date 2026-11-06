import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LIMIT_MB = 8;

function total(dir: string): number {
  let sum = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    sum += s.isDirectory() ? total(p) : s.size;
  }
  return sum;
}

const bytes = total('dist');
const mb = bytes / (1024 * 1024);
console.log(`dist/ size: ${mb.toFixed(2)} MB (limit ${LIMIT_MB} MB)`);
if (mb > LIMIT_MB) {
  console.error('dist/ exceeds size budget');
  process.exit(1);
}
