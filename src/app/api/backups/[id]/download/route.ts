import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth.config';
import prisma from '@/lib/prisma';

/**
 * GET /api/backups/[id]/download
 *
 * Streams the backup's gzipped JSON manifest. SUPER_ADMIN /
 * settings:manage / data:manage. Filename ends in .json.gz so
 * browsers + os tools handle the compression correctly.
 */

function canManageBackups(session: { user: { role?: string; permissions?: string[] } } | null): boolean {
  if (!session?.user) return false;
  if (session.user.role === 'SUPER_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('settings:manage') || perms.includes('data:manage');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageBackups(session as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const backup = await prisma.backup.findUnique({
      where:  { id },
      select: { id: true, data: true, sizeBytes: true, createdAt: true, status: true },
    });
    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }
    if (backup.status !== 'COMPLETED' || backup.sizeBytes === 0) {
      return NextResponse.json({ error: `Backup is ${backup.status.toLowerCase()}` }, { status: 409 });
    }

    // Date-stamped filename so admins can identify backups in their
    // downloads folder without opening them.
    const stamp = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(backup.createdAt).replace(/-/g, '');
    const fileName = `suler-ems-backup-${stamp}-${backup.id.slice(0, 8)}.json.gz`;

    // Wrap as Blob — same BodyInit narrowing as the document + report
    // downloads. application/gzip with x-content-type-options:nosniff
    // keeps browsers from trying to render it inline.
    const blob = new Blob([backup.data as unknown as ArrayBuffer], { type: 'application/gzip' });
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Length':         String(backup.sizeBytes),
        'Content-Disposition':    `attachment; filename="${fileName}"`,
        'Cache-Control':          'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
