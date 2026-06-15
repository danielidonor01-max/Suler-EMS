/**
 * k6 helper — log in via NextAuth Credentials and return the
 * `next-auth.session-token` cookie value. Reuse across iterations to
 * avoid hammering the auth endpoint.
 */
import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const EMAIL = __ENV.LOAD_EMAIL || 'admin@suler.com';
const PASSWORD = __ENV.LOAD_PASSWORD || 'Admin123!';

export function login() {
  // 1. CSRF token
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`);
  check(csrfRes, { 'csrf 200': (r) => r.status === 200 });
  const csrfToken = csrfRes.json('csrfToken');

  // 2. Credentials callback
  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      csrfToken,
      email: EMAIL,
      password: PASSWORD,
      redirect: 'false',
      json: 'true',
    },
    { redirects: 0 },
  );
  check(loginRes, { 'credentials accepted': (r) => r.status === 200 || r.status === 302 });

  const setCookie = loginRes.headers['Set-Cookie'] || '';
  const match = setCookie.match(/(next-auth\.session-token|__Secure-next-auth\.session-token)=([^;]+)/);
  if (!match) {
    throw new Error('Login did not return a session-token cookie');
  }
  return { name: match[1], value: match[2] };
}

export function authedHeaders(cookie) {
  return { Cookie: `${cookie.name}=${cookie.value}` };
}
