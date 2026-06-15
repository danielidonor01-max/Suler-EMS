/**
 * Smoke test — 1 VU × 1 minute. Logs in once, hits five GET endpoints
 * per iteration. Fails the run if any check fails or any non-2xx status
 * appears.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, login, authedHeaders } from './_auth.js';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<1000'],
    'checks': ['rate>0.99'],
  },
};

const ENDPOINTS = [
  '/api/admin/roles',
  '/api/admin/users',
  '/api/finance/budgets?status=ACTIVE',
  '/api/payroll/runs',
  '/api/audit/recent',
];

let cookie = null;
export function setup() {
  return { cookie: login() };
}

export default function (data) {
  if (!cookie) cookie = data.cookie;
  for (const path of ENDPOINTS) {
    const res = http.get(`${BASE_URL}${path}`, { headers: authedHeaders(cookie), tags: { endpoint: path } });
    check(res, { [`${path} -> 2xx`]: (r) => r.status >= 200 && r.status < 300 });
  }
  sleep(1);
}
