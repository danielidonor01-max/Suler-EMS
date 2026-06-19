import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { listRateRows, updateRates, type StatutoryCode } from '@/lib/payroll/rates';

/**
 * /api/payroll/statutory-rates
 *
 *   GET   — list every statutory-rate row + descriptor metadata.
 *           SUPER_ADMIN, HR_ADMIN, or anyone holding settings:manage.
 *   PATCH — bulk update. Same gating. Body is { updates: [{ code, value }] }.
 *
 * Rates feed every subsequent payroll run via `getActiveRates()`. Already-
 * processed runs are unaffected — their `rateSnapshot` captured the values
 * in force at the time.
 */

const BandSchema = z.object({
  width: z.number().positive(),
  rate:  z.number().min(0).max(1),
});

const UpdateSchema = z.object({
  updates: z.array(z.object({
    code: z.enum([
      'PAYE_BANDS_MONTHLY',
      'PENSION_EMPLOYEE_PCT',
      'PENSION_EMPLOYER_PCT',
      'NHF_PCT',
      'NHIS_PCT',
      'CRA_FIXED_ANNUAL',
      'CRA_PERCENTAGE',
    ]),
    value: z.union([z.array(BandSchema), z.number()]),
  })).min(1).max(20),
});

function canManage(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN') return true;
  if (session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('settings:manage') || perms.includes('payroll:edit');
}

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  if (!canManage(session as any)) {
    return errorResponse('FORBIDDEN', 'Statutory rates require settings:manage / payroll:edit', 403, correlationId);
  }

  try {
    const rows = await listRateRows();
    return successResponse(rows, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load rates';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const PATCH = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!canManage(session as any)) {
    return errorResponse('FORBIDDEN', 'Statutory rates require settings:manage / payroll:edit', 403, correlationId);
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    await updateRates(parsed.data.updates as { code: StatutoryCode; value: any }[], session.user.id);
    const refreshed = await listRateRows();
    return successResponse(refreshed, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update rates';
    return errorResponse('UPDATE_FAILED', msg, 400, correlationId);
  }
});
