/**
 * Inngest payroll functions.
 *
 * Background-executes the existing `transitionRun(..., 'PROCESS')` flow so
 * that large runs don't block the HTTP request. The function calls the same
 * service used by the sync path → identical reconciliation guard,
 * idempotent updateMany, adjustment auto-apply. Failures are caught by
 * Inngest's retry policy.
 */

import { inngest } from '../client';
import { transitionRun, PayrollError } from '@/modules/payroll/domain/payroll.service';

export const processPayrollRun = inngest.createFunction(
  {
    id: 'process-payroll-run',
    name: 'Process Payroll Run',
    retries: 2,
    triggers: [{ event: 'payroll/run.process.requested' }],
  },
  async ({ event, step }) => {
    const { runId, actorId, actorName, actorRole, actorPermissions } = event.data;

    await step.run('transition-to-processed', async () => {
      try {
        const result = await transitionRun(runId, 'PROCESS', {
          id: actorId,
          name: actorName,
          role: actorRole,
          permissions: actorPermissions ?? [],
        });
        return { status: 'PROCESSED', runId: result.id };
      } catch (err) {
        if (err instanceof PayrollError) {
          // Don't retry on logical errors — propagate to the run.
          throw new Error(`[${err.code}] ${err.message}`);
        }
        throw err;
      }
    });

    return { ok: true, runId };
  },
);
