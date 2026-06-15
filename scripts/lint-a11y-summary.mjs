/**
 * Aggregate jsx-a11y/control-has-associated-label violations by file.
 * Run: node scripts/lint-a11y-summary.mjs
 */
import { execSync } from 'node:child_process';
import path from 'node:path';

// ESLint exits non-zero when violations exist — we still want the JSON.
let raw;
try {
  raw = execSync('npx eslint src --format=json', {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    shell: true,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
} catch (err) {
  raw = err.stdout?.toString() ?? '';
}

const data = JSON.parse(raw);
const counts = new Map();
for (const file of data) {
  for (const msg of file.messages) {
    if (msg.ruleId === 'jsx-a11y/control-has-associated-label') {
      const rel = path.relative(process.cwd(), file.filePath).replace(/\\/g, '/');
      counts.set(rel, (counts.get(rel) ?? 0) + 1);
    }
  }
}

const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
for (const [file, n] of rows) {
  console.log(`${String(n).padStart(3)}  ${file}`);
}
console.log(`\nTotal: ${rows.reduce((s, [, n]) => s + n, 0)} across ${rows.length} files`);
