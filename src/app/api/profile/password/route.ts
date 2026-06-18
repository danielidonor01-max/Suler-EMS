import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { PasswordService } from '@/lib/auth/password.service';
import { checkPassword } from '@/lib/settings/service';

/**
 * PATCH /api/profile/password
 *
 * Lets a signed-in user change their own password.
 *   - Verifies the current password before any write.
 *   - Enforces complexity per the live SystemSetting policy. Admins
 *     can re-tune via /settings/security and the change takes effect
 *     on the next request (30s cache TTL upper-bound, invalidated
 *     immediately by the PATCH endpoint).
 *   - Bumps User.version so the session-version watcher invalidates other
 *     active sessions on this account (re-auth required).
 *   - Writes a SecurityEvent so the action shows up in /governance.
 *
 * Admin-driven password resets (a different user) live in admin routes
 * and require role:manage — they're not handled here.
 */
const Schema = z.object({
  currentPassword: z.string().min(1, 'current password required'),
  newPassword:     z.string().min(1, 'new password required'),
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'new password must differ from the current one',
  path: ['newPassword'],
});

export const PATCH = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  // Policy-driven complexity check — the rules live in SystemSetting
  // so HR can re-tune without a deploy.
  const policyCheck = await checkPassword(parsed.data.newPassword);
  if (!policyCheck.ok) {
    return errorResponse(
      'WEAK_PASSWORD',
      policyCheck.errors.join(' '),
      400,
      correlationId,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user) {
    return errorResponse('NOT_FOUND', 'Account not found', 404, correlationId);
  }

  const ok = await PasswordService.verify(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    await prisma.securityEvent.create({
      data: {
        type: 'LOGIN_FAILURE',
        description: `[PASSWORD_CHANGE] Wrong current password supplied by ${user.email}`,
        userId: user.id,
        metadata: { route: '/api/profile/password' },
      },
    }).catch(() => { /* best effort */ });
    return errorResponse('INVALID_CREDENTIALS', 'Current password is incorrect.', 401, correlationId);
  }

  const newHash = await PasswordService.hash(parsed.data.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, version: { increment: 1 } },
    }),
    prisma.securityEvent.create({
      data: {
        type: 'LOGIN_SUCCESS', // closest existing type; the description distinguishes the action
        description: `[PASSWORD_CHANGED] ${user.email} updated their password from /profile/preferences`,
        userId: user.id,
        metadata: { event: 'PASSWORD_CHANGED' },
      },
    }),
  ]);

  return successResponse({ ok: true, message: 'Password updated. Other sessions will be signed out on next refresh.' }, correlationId);
});
