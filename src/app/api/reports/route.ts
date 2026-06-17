import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { REGISTRY, isReportType } from '@/lib/reports/generators';

/**
 * /api/reports
 *
 *   GET  — list the caller's report jobs (newest first, metadata only).
 *          SUPER_ADMIN sees every user's jobs for audit purposes.
 *   POST — synchronously generate a report of the requested type,
 *          persist the CSV payload to ReportJob.data, return the
 *          completed job. Synchronous because Vercel can't host a
 *          background worker for free and the reports we ship are
 *          small enough to fit in the 10s default function budget.
 *
 * Permission: any authenticated user with audit:view OR report:generate
 * OR HR/SUPER_ADMIN.
 */

const CreateSchema = z.object({
  type:       z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  // Format ignored for now — every generator returns CSV. Keeps the
  // payload future-compatible without a schema migration.
  format:     z.literal('CSV').optional(),
});

const RETENTION_DAYS = 30;

function canGenerate(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('report:generate') || perms.includes('audit:view') || perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();

  const isAdmin = session.user.role === 'SUPER_ADMIN';
  try {
    const jobs = await prisma.reportJob.findMany({
      where:   isAdmin ? {} : { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take:    50,
      select: {
        id: true, type: true, status: true, format: true,
        fileName: true, error: true, failureCategory: true,
        createdAt: true, completedAt: true, expiresAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(jobs, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list reports';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!canGenerate(session as any)) {
    return errorResponse(
      'FORBIDDEN',
      'report:generate or audit:view permission required',
      403,
      correlationId,
    );
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  if (!isReportType(parsed.data.type)) {
    return errorResponse(
      'UNKNOWN_TYPE',
      `Unknown report type "${parsed.data.type}". Known: ${Object.keys(REGISTRY).join(', ')}`,
      400,
      correlationId,
    );
  }

  const expiresAt = new Date(Date.now() + RETENTION_DAYS * 86_400_000);
  let jobId: string | null = null;

  try {
    // Insert a PENDING row first so the audit log is honest about
    // attempted generations even when the generator throws.
    const job = await prisma.reportJob.create({
      data: {
        userId:     session.user.id,
        type:       parsed.data.type,
        parameters: (parsed.data.parameters as any) ?? null,
        status:     'PROCESSING',
        format:     'CSV',
        expiresAt,
      },
    });
    jobId = job.id;

    const result = await REGISTRY[parsed.data.type].generate({
      prisma,
      parameters: parsed.data.parameters,
    });

    const completed = await prisma.reportJob.update({
      where: { id: jobId },
      data: {
        status:      'COMPLETED',
        data:        result.data,
        fileName:    result.fileName,
        downloadUrl: `/api/reports/download/${jobId}`,
        completedAt: new Date(),
      },
      select: {
        id: true, type: true, status: true, format: true,
        fileName: true, downloadUrl: true,
        createdAt: true, completedAt: true, expiresAt: true,
      },
    });

    return successResponse(completed, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed';
    // Best-effort: mark the job FAILED so it shows up correctly in the
    // history. Swallow the secondary error if even that write fails.
    if (jobId) {
      await prisma.reportJob.update({
        where: { id: jobId },
        data: {
          status:          'FAILED',
          error:           msg,
          failureCategory: 'EXPORT',
        },
      }).catch(() => {});
    }
    return errorResponse('GENERATE_FAILED', msg, 500, correlationId);
  }
});
