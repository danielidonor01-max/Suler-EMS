import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { listRateRows, updateRates, type StatutoryCode } from '@/lib/payroll/rates';

/**
 * /api/payroll/statutory-rates
 *
 *   GET   — list every statutory-rate row + descriptor metadata.
 *           SUPER_ADMIN, HR_ADMIN, or anyone holding settings:manage.
 *   PATCH — bulk update. Same gating. Body is { updates: [{ code, value }] }.
 *           On commit, fans out an in-app notification to every active
 *           user announcing the change, so the policy update isn't a
 *           silent toggle that only HR knows about.
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

const CODE_LABEL: Record<StatutoryCode, string> = {
  PAYE_BANDS_MONTHLY:    'PAYE bands',
  PENSION_EMPLOYEE_PCT:  'Employee pension rate',
  PENSION_EMPLOYER_PCT:  'Employer pension rate',
  NHF_PCT:               'NHF rate',
  NHIS_PCT:              'NHIS rate',
  CRA_FIXED_ANNUAL:      'CRA fixed (annual)',
  CRA_PERCENTAGE:        'CRA percentage',
};

function canManage(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN') return true;
  if (session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('settings:manage') || perms.includes('payroll:edit');
}

/**
 * Build a short human-readable summary of what changed, plus a structured
 * payload for the notification metadata. Bands get a "lower bands changed"
 * summary instead of listing every width — the table view in the settings
 * page is the place to see the actual numbers.
 */
function diffSummary(
  before: Array<{ code: string; row: { value: unknown } | undefined }>,
  updates: Array<{ code: StatutoryCode; value: unknown }>,
) {
  const beforeByCode = new Map(before.map(b => [b.code, b.row?.value]));
  const items: Array<{ code: string; label: string; from: string; to: string }> = [];

  for (const u of updates) {
    const prev = beforeByCode.get(u.code);
    if (u.code === 'PAYE_BANDS_MONTHLY') {
      items.push({
        code:  u.code,
        label: CODE_LABEL[u.code],
        from:  'previous bands',
        to:    'updated bands',
      });
      continue;
    }
    const prevNum = (prev as { value?: number } | undefined)?.value;
    const newNum  = u.value as number;
    items.push({
      code:  u.code,
      label: CODE_LABEL[u.code],
      from:  prevNum == null ? '—' : (u.code === 'CRA_FIXED_ANNUAL'
                                       ? `₦${prevNum.toLocaleString('en-NG')}`
                                       : `${(prevNum * 100).toFixed(2)}%`),
      to:    u.code === 'CRA_FIXED_ANNUAL'
              ? `₦${newNum.toLocaleString('en-NG')}`
              : `${(newNum * 100).toFixed(2)}%`,
    });
  }
  return items;
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
    // Capture the BEFORE state so the broadcast can carry a diff. Has to
    // happen pre-update or we'd just echo the new values back.
    const before = await listRateRows();

    await updateRates(parsed.data.updates as { code: StatutoryCode; value: any }[], session.user.id);
    const refreshed = await listRateRows();

    // Build diff payload + broadcast. Best-effort: a notification fan-out
    // failure should not roll back the rate change — the rate is the
    // authoritative state; the notification is informational. We log and
    // continue.
    let broadcastCount = 0;
    try {
      const items = diffSummary(before, parsed.data.updates as { code: StatutoryCode; value: unknown }[]);
      const summaryLine = items.length === 1
        ? `${items[0].label}: ${items[0].from} → ${items[0].to}`
        : `${items.length} statutory policies updated`;

      const recipients = await prisma.user.findMany({
        where:  { isActive: true },
        select: { id: true },
      });
      const actorName = session.user.name ?? session.user.email ?? 'Policy Admin';

      const result = await prisma.notification.createMany({
        data: recipients.map(u => ({
          userId:       u.id,
          title:        'New statutory policy in effect',
          message:      `${summaryLine}. Updated by ${actorName}. Applies to all payroll runs from now on; already-processed runs are unaffected.`,
          type:         'INFO' as const,
          category:     'SYSTEM' as const,
          priority:     'NORMAL' as const,
          status:       'PENDING' as const,
          resourceType: 'StatutoryRate',
          metadata: {
            kind:       'statutory-policy-update',
            changes:    items,
            actorId:    session.user.id,
            actorName,
            committedAt: new Date().toISOString(),
          } as any,
        })),
      });
      broadcastCount = result.count;
    } catch (notifyErr) {
      // Don't poison the rate update on notification failure.
      // eslint-disable-next-line no-console
      console.error('[statutory-rates] broadcast failed', notifyErr);
    }

    return successResponse({ rates: refreshed, broadcastCount }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update rates';
    return errorResponse('UPDATE_FAILED', msg, 400, correlationId);
  }
});
