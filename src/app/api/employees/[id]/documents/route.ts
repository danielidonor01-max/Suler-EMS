import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/employees/[id]/documents — HR document store on the profile.
 *
 *   GET   — list documents (metadata only, no payload). Owner OR
 *           HR/SUPER_ADMIN/hr:edit/settings:manage. Employees see
 *           their own documents in My Profile.
 *   POST  — multipart/form-data upload. HR / SUPER_ADMIN / hr:edit /
 *           settings:manage only. Body fields:
 *             file        — the binary
 *             kind        — RESUME / CERTIFICATE / ID_CARD / CONTRACT
 *                           / TAX_DOC / OTHER
 *             description — optional caption
 *           Per-file size cap = 4 MB (Vercel serverless body limit).
 */

// Vercel serverless default body cap is 4.5 MB. Leave headroom for the
// multipart envelope by capping the file itself at 4 MB.
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_KINDS = new Set(['RESUME', 'CERTIFICATE', 'ID_CARD', 'CONTRACT', 'TAX_DOC', 'OTHER']);

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

function canManageDocs(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

function canViewProfile(session: { user: { role: string; permissions?: string[]; employeeId?: string | null } }, employeeId: string): boolean {
  if (canManageDocs(session as any)) return true;
  return session.user.employeeId === employeeId;
}

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  if (!canViewProfile(session as any, id)) {
    return errorResponse('FORBIDDEN', 'You do not have access to these documents', 403, correlationId);
  }

  try {
    const docs = await prisma.employeeDocument.findMany({
      where:   { employeeId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, kind: true, fileName: true, mimeType: true, sizeBytes: true,
        description: true, createdAt: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(docs, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list documents';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  if (!canManageDocs(session as any)) {
    return errorResponse(
      'FORBIDDEN',
      'hr:edit or settings:manage required to upload documents',
      403,
      correlationId,
    );
  }

  // Multipart parsing — Next.js gives request.formData() natively in App
  // Router route handlers.
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return errorResponse('BAD_REQUEST', 'Expected multipart/form-data', 400, correlationId);
  }

  const fileEntry = formData.get('file');
  const kind = String(formData.get('kind') ?? '').toUpperCase();
  const description = formData.get('description');

  if (!(fileEntry instanceof File)) {
    return errorResponse('VALIDATION_ERROR', '`file` field is required', 400, correlationId);
  }
  if (!ALLOWED_KINDS.has(kind)) {
    return errorResponse('VALIDATION_ERROR', `Unknown kind: ${kind}`, 400, correlationId);
  }
  if (!ALLOWED_MIME.has(fileEntry.type)) {
    return errorResponse(
      'UNSUPPORTED_MIME',
      `File type ${fileEntry.type || 'unknown'} is not allowed`,
      400,
      correlationId,
    );
  }
  if (fileEntry.size === 0) {
    return errorResponse('VALIDATION_ERROR', 'File is empty', 400, correlationId);
  }
  if (fileEntry.size > MAX_FILE_SIZE) {
    const mb = (fileEntry.size / (1024 * 1024)).toFixed(2);
    return errorResponse(
      'FILE_TOO_LARGE',
      `File is ${mb} MB. Max allowed is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
      413,
      correlationId,
    );
  }

  // Confirm the target employee exists before we read the bytes — saves
  // the cost of a wasted upload when the URL was wrong.
  const employee = await prisma.employee.findUnique({ where: { id }, select: { id: true } });
  if (!employee) {
    return errorResponse('NOT_FOUND', 'Employee not found', 404, correlationId);
  }

  try {
    const bytes = Buffer.from(await fileEntry.arrayBuffer());
    const created = await prisma.employeeDocument.create({
      data: {
        employeeId:   id,
        kind,
        fileName:     fileEntry.name,
        mimeType:     fileEntry.type,
        sizeBytes:    fileEntry.size,
        data:         bytes,
        description:  typeof description === 'string' ? description.slice(0, 500) || null : null,
        uploadedById: session.user.id,
      },
      select: {
        id: true, kind: true, fileName: true, mimeType: true, sizeBytes: true,
        description: true, createdAt: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(created, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to upload document';
    return errorResponse('UPLOAD_FAILED', msg, 500, correlationId);
  }
});
