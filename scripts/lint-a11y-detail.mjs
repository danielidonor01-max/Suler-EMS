/**
 * Print every jsx-a11y/control-has-associated-label violation with file +
 * line + a short source excerpt so we can target the fix.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

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
for (const file of data) {
  const rel = path.relative(process.cwd(), file.filePath).replace(/\\/g, '/');
  let src;
  try { src = readFileSync(file.filePath, 'utf8').split('\n'); } catch { continue; }
  for (const msg of file.messages) {
    if (msg.ruleId !== 'jsx-a11y/control-has-associated-label') continue;
    const line = src[msg.line - 1] ?? '';
    console.log(`${rel}:${msg.line}`);
    console.log(`  ${line.trim().slice(0, 200)}`);
  }
}
