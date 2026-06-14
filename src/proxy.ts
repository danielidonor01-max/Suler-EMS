/**
 * Server-side route protection (Next.js 16 — proxy.ts, formerly middleware).
 *
 * Two layers:
 *
 *   1. Authentication — required for every non-public route. Anything not
 *      explicitly allowed unauthenticated → 302 to /login?callbackUrl=…
 *
 *   2. Permission — layered on top for sensitive areas (admin / finance /
 *      payroll / governance / leave approvals). Caller's role must match
 *      one of `rolesAllowed`, OR their permissions must include one of
 *      `anyOf`. SUPER_ADMIN bypasses checks.
 *
 * API routes are intentionally NOT covered — they enforce auth in their own
 * `withAuth` wrapper plus permission checks at the service layer
 * (ARCHITECTURE.md Phase 6 §3: middleware = pages-only, no double-guarding).
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

interface RouteRule {
  prefix: string;
  anyOf?: string[];          // any one of these permissions suffices
  rolesAllowed?: string[];   // OR caller's role is in this set
}

const RULES: RouteRule[] = [
  { prefix: '/admin/roles',       anyOf: ['role:manage'] },
  { prefix: '/admin',             rolesAllowed: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { prefix: '/governance',        anyOf: ['audit:view'] },
  { prefix: '/finance/approvals', anyOf: ['finance:approve'] },
  { prefix: '/finance',           anyOf: ['finance:view'] },
  { prefix: '/payroll/approvals', anyOf: ['payroll:approve'] },
  { prefix: '/payroll',           anyOf: ['payroll:view'] },
  { prefix: '/leave/approvals',   anyOf: ['leave:approve'] },
];

const PUBLIC_PATHS = new Set(['/', '/_not-found']);

function matchRule(pathname: string): RouteRule | undefined {
  return RULES.find(r => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
}

function isAuthorized(rule: RouteRule, role: string, permissions: string[]): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (rule.rolesAllowed && rule.rolesAllowed.includes(role)) return true;
  if (rule.anyOf && rule.anyOf.some(p => permissions.includes(p))) return true;
  return false;
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAuthPage = pathname.startsWith('/login');
  const isForbiddenPage = pathname.startsWith('/forbidden');
  const isApiAuthRoute = pathname.startsWith('/api/auth');

  // 1. NextAuth's own endpoints — always pass through. They handle their own auth.
  if (isApiAuthRoute) return NextResponse.next();

  // 2. /forbidden is always reachable — it's where unauthorized users land.
  if (isForbiddenPage) return NextResponse.next();

  // 3. Logged-in users on /login → bounce to dashboard.
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // 4. Authentication required by default. No GUEST workspace, no
  //    anonymous browsing of dashboard routes.
  if (!isLoggedIn) {
    if (isAuthPage || PUBLIC_PATHS.has(pathname)) return NextResponse.next();
    const callbackUrl = pathname + (req.nextUrl.search ?? '');
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl),
    );
  }

  // 5. Permission check (only fires when a rule covers the path).
  const rule = matchRule(pathname);
  if (rule) {
    const role = (req.auth?.user?.role as string) ?? '';
    const permissions = (req.auth?.user?.permissions as string[]) ?? [];
    if (!isAuthorized(rule, role, permissions)) {
      const url = req.nextUrl.clone();
      url.pathname = '/forbidden';
      url.searchParams.set('path', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Everything except NextAuth, Next internals, and static assets.
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico|woff2)).*)',
  ],
};
