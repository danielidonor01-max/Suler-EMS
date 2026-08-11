import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * Server-side gate for every /admin/* page. proxy.ts also enforces this,
 * but a second check at the origin catches edge cases where proxy is
 * bypassed (RSC transitions, edge cache staleness, header stripping by
 * upstream proxies). Wrong-role callers land on /forbidden instead of
 * seeing the admin surface.
 *
 * /admin/roles has an extra tightening (role:manage) enforced by proxy.ts
 * — we don't duplicate it here to keep the two layers in agreement.
 */
const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'HR_ADMIN']);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = (session.user as { role?: string }).role ?? '';
  if (!ADMIN_ROLES.has(role)) {
    redirect('/forbidden?path=/admin');
  }
  return <>{children}</>;
}
