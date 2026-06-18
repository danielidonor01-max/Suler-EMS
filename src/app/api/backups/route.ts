import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { generateBackup } from '@/lib/backup/service';

/**
 * /api/backups
 *
 *   GET  — list backups newest-first. SUPER_ADMIN / settings:manage.
 *          Metadata only (no payload).
 *   POST — synchronously generate a snapshot of every structured
 *          table, gzip it, persist to a Backup row. SUPER_ADMIN /
 *          settings:manage. Returns the created row's metadata.
 *
 * Per-id download + delete live in [id]/route.ts.
 *
 * Generation is synchronous because the snapshot is small enough
 * to comfortably fit in a single function execution for a small/
 * medium EMS (hundreds of employees, a few thousand transactional
 * rows). When you outgrow that, a background job is the next step.
 */

const CreateSchema = z.object({
  description: z.string().max(500).optional().nullable(),
});

function canManageBackups(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('settings:manage') || perms.includes('data:manage');
}

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();

  if (!canManageBackups(session as any)) {
    return errorResponse(
      'FORBIDDEN',
      'settings:manage or data:manage required to view backups',
      403,
      correlationId,
    );
  }

  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, sizeBytes: true, rowCount: true, tablesIncluded: true,
        schemaVersion: true, description: true, status: true, error: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(backups, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list backups';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!canManageBackups(session as any)) {
    return errorResponse(
      'FORBIDDEN',
      'settings:manage or data:manage required to create backups',
      403,
      correlationId,
    );
  }

  let body: { description?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    // Empty POST body is fine — description is optional.
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const result = await generateBackup(prisma as any);

    const row = await prisma.backup.create({
      data: {
        createdById:    session.user.id,
        data:           result.data,
        sizeBytes:      result.data.length,
        rowCount:       result.rowCount,
        tablesIncluded: result.tablesIncluded as any,
        description:    parsed.data.description ?? null,
        status:         'COMPLETED',
      },
      select: {
        id: true, sizeBytes: true, rowCount: true, tablesIncluded: true,
        schemaVersion: true, description: true, status: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(row, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Backup failed';
    // Record the attempt so the admin sees something rather than nothing.
    await prisma.backup.create({
      data: {
        createdById:    session.user.id,
        data:           Buffer.alloc(0),
        sizeBytes:      0,
        rowCount:       0,
        tablesIncluded: [] as any,
        description:    parsed.data.description ?? null,
        status:         'FAILED',
        error:          msg,
      },
    }).catch(() => {});
    return errorResponse('BACKUP_FAILED', msg, 500, correlationId);
  }
});
