/**
 * Server-side route protection.
 *
 * Page routes are gated here via JWT inspection. API routes are NOT covered
 * — they use their own `withAuth` + service-layer guards (ARCHITECTURE.md
 * Phase 6 decision: middleware scope = pages only, no double-guarding).
 *
 * Auth flow:
 *   1. `getToken` reads the NextAuth JWT from cookies.
 *   2. Unauthenticated request to a protected route → 302 to /login.
 *   3. Authenticated but lacking required permission → 302 to /forbidden
 *      with the requested path encoded so the page can explain.
 *
 * If a route isn't listed here, it's open to any authenticated user. Login,
 * static assets, NextAuth, and Next internals are explicitly excluded by the
 * matcher.
 */

import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

interface RouteRule {
  /** URL prefix to match. Order matters — more specific first. */
  prefix: string;
  /** Any one of these permissions is sufficient. */
  anyOf?: string[];
  /** Caller's role must be in this set. SUPER_ADMIN always allowed. */
  rolesAllowed?: string[];
}

const RULES: RouteRule[] = [
  { prefix: '/admin/roles',     anyOf: ['role:manage'] },
  { prefix: '/admin',           rolesAllowed: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { prefix: '/governance',      anyOf: ['audit:view'] },
  { prefix: '/finance/approvals', anyOf: ['finance:approve'] },
  { prefix: '/finance',         anyOf: ['finance:view'] },
  { prefix: '/payroll/approvals', anyOf: ['payroll:approve'] },
  { prefix: '/payroll',         anyOf: ['payroll:view'] },
  { prefix: '/leave/approvals', anyOf: ['leave:approve'] },
];

function matchRule(pathname: string): RouteRule | undefined {
  return RULES.find(r => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
}

function isAuthorized(rule: RouteRule, role: string, permissions: string[]): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (rule.rolesAllowed && rule.rolesAllowed.includes(role)) return true;
  if (rule.anyOf && rule.anyOf.some(p => permissions.includes(p))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = matchRule(pathname);
  if (!rule) return NextResponse.next();

  const token = await getToken({ req, secret: SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const role = (token.role as string) ?? 'GUEST';
  const permissions = (token.permissions as string[]) ?? [];
  if (!isAuthorized(rule, role, permissions)) {
    const url = req.nextUrl.clone();
    url.pathname = '/forbidden';
    url.searchParams.set('path', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match everything EXCEPT NextAuth, login, static assets, Next internals, and API.
    // (API protection lives in withAuth + services — ARCHITECTURE Phase 6 §3.)
    '/((?!api|_next/static|_next/image|favicon|login|forbidden|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico|woff2)).*)',
  ],
};
