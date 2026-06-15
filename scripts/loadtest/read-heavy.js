/**
 * Read-heavy mix — 20 VUs × 5 minutes against dashboards-style endpoints.
 * Mirrors what 20 logged-in users with polling SWR clients would do.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, login, authedHeaders } from './_auth.js';

export const options = {
  vus: 20,
  duration: '5m',
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration{endpoint:/api/finance/budgets}': ['p(95)<500'],
    'http_req_duration{endpoint:/api/payroll/runs}': ['p(95)<500'],
    'http_req_duration{endpoint:/api/communication/conversations}': ['p(95)<700'],
  },
};

const ENDPOINTS = [
  '/api/finance/budgets?status=ACTIVE&includeUtilization=true',
  '/api/finance/expenditures?scope=team&status=SUBMITTED,APPROVED',
  '/api/payroll/runs',
  '/api/leave/requests?scope=team&status=SUBMITTED,MANAGER_APPROVED',
  '/api/communication/conversations',
  '/api/audit/recent',
  '/api/admin/users',
];

export function setup() {
  return { cookie: login() };
}

export default function (data) {
  for (const path of ENDPOINTS) {
    const res = http.get(`${BASE_URL}${path}`, { headers: authedHeaders(data.cookie), tags: { endpoint: path.split('?')[0] } });
    check(res, { [`${path.split('?')[0]} -> 2xx`]: (r) => r.status >= 200 && r.status < 300 });
  }
  // Mimic the SWR poll cadence — ~10-30s between bursts.
  sleep(15 + Math.random() * 15);
}
