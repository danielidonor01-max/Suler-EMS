/**
 * Route audit — cross-checks every internal link in src/ against the actual
 * Next.js App Router file tree. Catches the class of bug that surfaced in
 * Phase 6 / 6.1 (Sidebar pointed at /workforce and /admin/ecc, neither of
 * which existed).
 *
 *   npm run verify:routes
 *
 * Scans every .ts/.tsx file under src/ for:
 *   - href="..." attributes on JSX (Link, a, etc.)
 *   - router.push('...') / router.replace('...') / router.prefetch('...')
 *   - <Link href="..."> shorthand
 *
 * Internal paths (start with /) get matched against the App Router directory
 * tree under src/app/. Dynamic segments are handled — /staff/[id] is matched
 * by both /staff/SUL-EMP-001 and the literal /staff/[id].
 *
 * Exits 0 if every internal path resolves; exits 1 with a list of unresolved
 * paths otherwise. External URLs (http://, https://, mailto:, tel:) and
 * fragment-only hrefs (#…) are ignored.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const APP_ROOT = join(ROOT, 'src', 'app');
const SRC_ROOT = join(ROOT, 'src');

/* -- collect actual routes -- */
interface RouteEntry {
  /** segments like ['admin', 'roles'] or ['staff', '[id]'] */
  segments: string[];
  /** full pathname matcher e.g. '/admin/roles' or '/staff/[id]' */
  literal: string;
}

function collectAppRoutes(dir: string, segments: string[], out: RouteEntry[]): void {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return; }
  // A directory is a route if it contains page.tsx or page.ts.
  const hasPage = entries.some(e => e === 'page.tsx' || e === 'page.ts');
  if (hasPage) {
    out.push({ segments: [...segments], literal: '/' + segments.join('/') });
  }
  for (const e of entries) {
    if (e === 'page.tsx' || e === 'page.ts' || e === 'route.ts' || e === 'route.tsx') continue;
    if (e === 'layout.tsx' || e === 'layout.ts' || e === 'loading.tsx' || e === 'error.tsx' || e === 'not-found.tsx') continue;
    const full = join(dir, e);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (!st.isDirectory()) continue;

    // Route groups: (auth), (dashboard) → don't add to URL segments.
    const isGroup = /^\(.*\)$/.test(e);
    const nextSegments = isGroup ? segments : [...segments, e];
    collectAppRoutes(full, nextSegments, out);
  }
}

/** Top-level pathname matcher → true if any RouteEntry resolves. */
function isRouteResolved(pathname: string, routes: RouteEntry[]): boolean {
  // Strip query / hash.
  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (cleanPath === '/' || cleanPath === '') return true; // root
  const inputSegments = cleanPath.split('/').filter(Boolean);

  outer: for (const r of routes) {
    if (r.segments.length !== inputSegments.length) continue;
    for (let i = 0; i < r.segments.length; i++) {
      const routeSeg = r.segments[i];
      const inputSeg = inputSegments[i];
      const isDynamic = /^\[.*\]$/.test(routeSeg);
      if (!isDynamic && routeSeg !== inputSeg) continue outer;
    }
    return true;
  }
  return false;
}

/* -- collect referenced paths -- */
interface Reference {
  file: string;
  line: number;
  pathname: string;
  context: string;
}

const HREF_PATTERNS = [
  /\bhref\s*=\s*["'`]([^"'`]+)["'`]/g,
  /\bhref\s*=\s*\{["'`]([^"'`]+)["'`]\}/g,
  /\brouter\.(?:push|replace|prefetch)\s*\(\s*["'`]([^"'`]+)["'`]/g,
];

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.next' || e === 'dist' || e === 'build') continue;
    if (e.startsWith('.')) continue;
    const full = join(dir, e);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(e)) yield full;
  }
}

function collectReferences(): Reference[] {
  const refs: Reference[] = [];
  for (const file of walk(SRC_ROOT)) {
    let content: string;
    try { content = readFileSync(file, 'utf8'); } catch { continue; }
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      for (const pat of HREF_PATTERNS) {
        pat.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pat.exec(line))) {
          const pathname = m[1];
          // Ignore external + non-route values.
          if (!pathname.startsWith('/')) continue;
          if (pathname.startsWith('//')) continue;
          if (pathname.startsWith('/api/')) continue; // API routes are sanity-checked elsewhere
          if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) continue;
          // Strip template-literal interpolation artifacts.
          if (pathname.includes('${')) continue;
          refs.push({
            file: relative(ROOT, file).replace(/\\/g, '/'),
            line: lineIdx + 1,
            pathname,
            context: line.trim().slice(0, 160),
          });
        }
      }
    }
  }
  return refs;
}

/* -- main -- */
function main(): void {
  const routes: RouteEntry[] = [];
  collectAppRoutes(APP_ROOT, [], routes);
  if (routes.length === 0) {
    console.error('No App Router routes found under src/app/. Aborting.');
    process.exit(2);
  }

  const refs = collectReferences();
  const broken: Reference[] = refs.filter(r => !isRouteResolved(r.pathname, routes));

  console.log(`\n  Route Audit`);
  console.log(`  ${routes.length} routes discovered`);
  console.log(`  ${refs.length} internal hrefs found`);

  if (broken.length === 0) {
    console.log(`\n  ✅ All internal hrefs resolve to a real route.\n`);
    process.exit(0);
  }

  console.log(`\n  ❌ ${broken.length} broken reference(s):\n`);
  for (const b of broken) {
    console.log(`  ${b.file}:${b.line}`);
    console.log(`    href: ${b.pathname}`);
    console.log(`    →  ${b.context}`);
    console.log('');
  }
  process.exit(1);
}

main();
