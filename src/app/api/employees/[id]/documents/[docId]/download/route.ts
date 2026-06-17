import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { errorResponse } from '@/lib/api-utils';

/**
 * GET /api/employees/[id]/documents/[docId]/download
 *
 * Streams the document bytes with the original Content-Type and a
 * Content-Disposition that triggers a browser download with the
 * original filename. Owner OR HR / SUPER_ADMIN / hr:edit /
 * settings:manage can download.
 *
 * Files come back as a NextResponse with the raw Buffer body — not
 * routed through successResponse() because that wraps everything in
 * the JSON envelope.
 */

function canManageDocs(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

function canView(session: { user: { role: string; permissions?: string[]; employeeId?: string | null } }, employeeId: string): boolean {
  if (canManageDocs(session as any)) return true;
  return session.user.employeeId === employeeId;
}

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id, docId } = (await context.params) as { id: string; docId: string };

  if (!canView(session as any, id)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this document', 403, correlationId);
  }

  try {
    const doc = await prisma.employeeDocument.findFirst({
      where: { id: docId, employeeId: id },
      select: { fileName: true, mimeType: true, data: true, sizeBytes: true },
    });
    if (!doc) {
      return errorResponse('NOT_FOUND', 'Document not found', 404, correlationId);
    }

    // Escape quotes in filename to keep the header well-formed.
    const safeName = doc.fileName.replace(/"/g, '');

    // Prisma's Bytes column returns a Node Buffer at runtime, but the TS
    // BodyInit union doesn't include Buffer. Buffer extends Uint8Array, so
    // a structural cast satisfies the type checker without copying.
    const body = doc.data as unknown as Uint8Array;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type':        doc.mimeType || 'application/octet-stream',
        'Content-Length':      String(doc.sizeBytes),
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control':       'private, no-store',
        'X-Correlation-Id':    correlationId,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to download document';
    return errorResponse('DOWNLOAD_FAILED', msg, 500, correlationId);
  }
});
