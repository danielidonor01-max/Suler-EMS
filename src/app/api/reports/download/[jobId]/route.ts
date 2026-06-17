import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth.config';
import prisma from '@/lib/prisma';

/**
 * GET /api/reports/download/[jobId]
 *
 * Streams the COMPLETED report's CSV bytes from ReportJob.data. The
 * filesystem-backed StorageService approach the prior version used
 * doesn't survive Vercel's ephemeral filesystem — we now store the
 * payload inline in Postgres alongside the job row.
 *
 * Authorization: job owner OR SUPER_ADMIN. Expired jobs return 410.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    const job = await prisma.reportJob.findUnique({
      where:  { id: jobId },
      select: {
        id: true, userId: true, type: true, status: true, format: true,
        data: true, fileName: true, expiresAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const isOwner      = job.userId === (session.user as any).id;
    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN';
    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (job.status !== 'COMPLETED' || !job.data) {
      return NextResponse.json({ error: `Report is ${job.status.toLowerCase()}` }, { status: 409 });
    }
    if (job.expiresAt && new Date() > job.expiresAt) {
      return NextResponse.json({ error: 'Report has expired' }, { status: 410 });
    }

    // Wrap as a Blob — same TS 5.7+ BodyInit narrowing we ran into on the
    // employee document download. Blob is unambiguous.
    const contentType = job.format === 'PDF' ? 'application/pdf' : 'text/csv';
    const blob = new Blob([job.data as unknown as ArrayBuffer], { type: contentType });
    const fileName = (job.fileName ?? `${job.type.toLowerCase()}-${job.id.slice(0, 8)}.${job.format.toLowerCase()}`).replace(/"/g, '');

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control':       'private, no-store',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
