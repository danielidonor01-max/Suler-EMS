/**
 * TOTP / backup-code MFA primitives.
 *
 * Avoids a third-party TOTP dep — RFC 6238 is small enough to implement
 * directly on top of Node's crypto. Backup codes use bcryptjs (same lib
 * the password layer already uses) so we don't have two hashing stories
 * to keep secure.
 *
 * What this module DOESN'T do: storage, enrollment state machine, login
 * gating. Those live in the endpoints and auth.config — this is just
 * the math + the helpers.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ── base32 (RFC 4648, no padding) ───────────────────────────────────────────
// Authenticator apps universally consume the secret as base32. We can't
// share Node's hex or base64 directly because the otpauth URL spec
// mandates base32.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return out;
}

export function base32Decode(input: string): Buffer {
  // Strip whitespace, hyphens, and padding — auth apps display the
  // secret with spaces every 4 chars, so we should accept those back.
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const v = BASE32_ALPHABET.indexOf(ch);
    if (v < 0) continue;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// ── TOTP per RFC 6238 ──────────────────────────────────────────────────────
// 30-second time step, 6-digit code, SHA-1 HMAC. These are the universal
// authenticator-app defaults — changing any of them breaks Google
// Authenticator, Authy, 1Password, Bitwarden, etc.

const TIME_STEP_SECONDS = 30;
const CODE_LENGTH = 6;

/** Generate a 160-bit base32 secret for a new MFA enrolment. */
export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/** Build the otpauth:// URL that auth apps consume via QR code or deep-link. */
export function otpauthUrl(secret: string, label: string, issuer: string): string {
  // Encoding rules from https://github.com/google/google-authenticator/wiki/Key-Uri-Format
  const enc = encodeURIComponent;
  const fullLabel = `${enc(issuer)}:${enc(label)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits:    String(CODE_LENGTH),
    period:    String(TIME_STEP_SECONDS),
  });
  return `otpauth://totp/${fullLabel}?${params.toString()}`;
}

/** Render the secret as 4-char chunks for manual entry. */
export function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

/**
 * Compute the TOTP code for a given counter (number of 30s steps since epoch).
 * Internal — verifyTotp wraps this with a window.
 */
function totpForCounter(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  // Dynamic truncation (RFC 4226 §5.4)
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** CODE_LENGTH).padStart(CODE_LENGTH, '0');
}

/**
 * Verify a user-supplied TOTP code. Accepts a small window for clock
 * drift between server and authenticator app — ±1 step (30s either
 * direction) is the convention.
 */
export function verifyTotp(secret: string, code: string, window = 1): boolean {
  const cleaned = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  const now = Math.floor(Date.now() / 1000 / TIME_STEP_SECONDS);
  for (let offset = -window; offset <= window; offset++) {
    if (timingSafeEqual(totpForCounter(secret, now + offset), cleaned)) return true;
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return crypto.timingSafeEqual(ba, bb);
}

// ── Backup codes ───────────────────────────────────────────────────────────
// Eight 8-character alphanumeric codes (~41 bits of entropy each).
// Shown to the user exactly once in plaintext at enrolment / regeneration;
// only the bcrypt hashes survive on the User row. Single-use.

const BACKUP_CODE_COUNT = 8;
const BACKUP_CODE_LENGTH = 8;
const BACKUP_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

/** Generate fresh plaintext backup codes. Returned to the caller once. */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    let code = '';
    const rand = crypto.randomBytes(BACKUP_CODE_LENGTH);
    for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
      code += BACKUP_CODE_ALPHABET[rand[j] % BACKUP_CODE_ALPHABET.length];
    }
    // Hyphen at midpoint for legibility — users will read these from a
    // printed page during recovery; "AB23-CD45" is friendlier than "AB23CD45".
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  // bcrypt with the same cost factor PasswordService uses — keeps
  // brute-force cost consistent across credential types.
  return Promise.all(codes.map(c => bcrypt.hash(c.replace(/-/g, '').toUpperCase(), 12)));
}

/**
 * Check an attempted backup code against the stored hashes. Returns the
 * remaining hash list (with the consumed one removed) on match. Caller
 * is responsible for persisting the new array — the consume is
 * single-use by design.
 */
export async function consumeBackupCode(
  hashes: string[],
  attempted: string,
): Promise<{ match: boolean; remaining: string[] }> {
  const normalized = attempted.replace(/-/g, '').toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    const ok = await bcrypt.compare(normalized, hashes[i]);
    if (ok) {
      const remaining = [...hashes.slice(0, i), ...hashes.slice(i + 1)];
      return { match: true, remaining };
    }
  }
  return { match: false, remaining: hashes };
}
