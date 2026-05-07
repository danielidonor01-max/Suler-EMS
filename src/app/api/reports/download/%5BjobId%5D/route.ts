import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { StorageService } from '@/lib/storage/storage.service';
import fs from 'fs';

/**
 * Secure Report Download Endpoint
 * Validates session, ownership, and role-based permissions.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;

    // 1. Fetch Job Metadata
    const job = await prisma.reportJob.findUnique({
      where: { id: jobId },
      include: { user: { select: { id: true, role: { select: { name: true } } } } }
    });

    if (!job) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // 2. Authorization Refinement 2: Ownership & Permission Checks
    const isOwner = job.userId === session.user.id;
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not own this report" }, { status: 403 });
    }

    // 3. Lifecycle Check: Expiry
    if (job.expiresAt && new Date() > job.expiresAt) {
      return NextResponse.json({ error: "Report has expired" }, { status: 410 });
    }

    // 4. Retrieve File
    // Note: StorageService.getFilePath returns the physical path
    // The downloadUrl in DB is /api/reports/download/{secureId}
    const filePath = StorageService.getFilePath(job.id);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File artifact missing" }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const contentType = job.format === 'CSV' ? 'text/csv' : 'application/pdf';
    const filename = `${job.type.toLowerCase()}_${job.id.slice(0, 8)}.${job.format.toLowerCase()}`;

    // 5. Audit: Track download event
    console.log(`[AUDIT] Report Downloaded: ${job.id} by ${session.user.id}`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (err: any) {
    console.error(`[ERROR] Download failed: ${err.message}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
