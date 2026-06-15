/**
 * Payroll write — 5 VUs × 3 minutes. Each iteration:
 *   1. Creates a draft payroll run for a unique period
 *   2. Records how long the snapshot loop took
 *   3. Cancels the run so the DB doesn't fill with cruft
 *
 * The custom metric `payroll_create_draft_ms` is the headline number.
 * If p95 climbs above 5s, switch the PROCESS path to async dispatch
 * (already wired — see ASYNC_PROCESS_THRESHOLD in the transition route).
 */
import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, login, authedHeaders } from './_auth.js';

const createMs = new Trend('payroll_create_draft_ms');

export const options = {
  vus: 5,
  duration: '3m',
  thresholds: {
    'http_req_failed': ['rate<0.02'],
    'payroll_create_draft_ms': ['p(95)<5000'],
  },
};

export function setup() {
  return { cookie: login() };
}

function uniquePeriod() {
  // Spread test runs across past years to avoid the @@unique(period, dept) collision.
  // Year 2030 + month 1-12 + day-based offset = ~365 unique periods.
  const year = 2030 + (__VU % 5); // 2030..2034 per VU
  const month = ((__ITER % 12) + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

export default function (data) {
  const period = uniquePeriod();
  const start = Date.now();

  // Use FINANCE_MANAGER permission — login user must have payroll:edit.
  const createRes = http.post(
    `${BASE_URL}/api/payroll/runs`,
    JSON.stringify({ name: `LoadTest ${period}`, period }),
    { headers: { ...authedHeaders(data.cookie), 'Content-Type': 'application/json' } },
  );
  const elapsed = Date.now() - start;
  createMs.add(elapsed);
  check(createRes, {
    'create draft -> 201 | 409 (dup)': (r) => r.status === 201 || r.status === 409,
  });

  // Best-effort cleanup. Don't fail the test if it doesn't apply.
  if (createRes.status === 201) {
    const runId = createRes.json('data.id');
    if (runId) {
      http.patch(
        `${BASE_URL}/api/payroll/runs/${runId}/transition`,
        JSON.stringify({ action: 'CANCEL' }),
        { headers: { ...authedHeaders(data.cookie), 'Content-Type': 'application/json' } },
      );
    }
  }
}
