import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';

/**
 * Server-side auth gate for every route in the (dashboard) group.
 *
 * `proxy.ts` runs first at the edge. This layout runs on the origin. Both
 * paths must agree that the caller is signed in — proxy alone was allowing
 * a small class of requests to slip through (empty session decode returning
 * as "logged in" transiently, or RSC-only re-navigations that skip the
 * edge). Belt + suspenders.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <AppShell>{children}</AppShell>;
}
