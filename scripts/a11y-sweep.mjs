/**
 * Mechanical sweep — for every `<label>Text</label>` immediately followed by
 * an `<input|textarea|select>` without an `aria-label`, inject
 * `aria-label="Text"` on the control. Skips elements that already have
 * aria-label / aria-labelledby. Idempotent.
 *
 *   node scripts/a11y-sweep.mjs [file ...]
 *
 * Without args, runs against the modal directory that holds the bulk of
 * the violations. Always print a diff summary before exiting.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_TARGETS = [
  'src/components/modals/WorkforceModals.tsx',
  'src/components/modals/PayrollModals.tsx',
  'src/components/modals/OrganizationModals.tsx',
  'src/components/modals/FinanceModals.tsx',
  'src/components/modals/ComplianceModals.tsx',
  'src/components/modals/TeamModals.tsx',
];

const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : DEFAULT_TARGETS;

const PATTERN = /<label([^>]*)>([^<{]+?)<\/label>(\s*)<(input|textarea|select)(?![^>]*\baria-label\b)(?![^>]*\baria-labelledby\b)([\s>])/g;

let totalFixes = 0;
for (const rel of targets) {
  const filePath = path.resolve(process.cwd(), rel);
  let src;
  try { src = readFileSync(filePath, 'utf8'); } catch (e) {
    console.error(`  skip (read error): ${rel}`);
    continue;
  }
  let count = 0;
  const out = src.replace(PATTERN, (_full, labelAttrs, labelText, gap, control, trailing) => {
    count++;
    const escaped = labelText.replace(/"/g, '&quot;').replace(/\s+/g, ' ').trim();
    return `<label${labelAttrs}>${labelText}</label>${gap}<${control} aria-label="${escaped}"${trailing}`;
  });
  if (count > 0) {
    writeFileSync(filePath, out, 'utf8');
    console.log(`  ${String(count).padStart(3)}  ${rel}`);
    totalFixes += count;
  } else {
    console.log(`    0  ${rel}`);
  }
}

console.log(`\nTotal: ${totalFixes} aria-labels injected across ${targets.length} files.`);
