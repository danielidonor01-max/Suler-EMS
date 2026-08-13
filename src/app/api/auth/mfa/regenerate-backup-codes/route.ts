import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
  verifyTotp, generateBackupCodes, hashBackupCodes,
} from '@/lib/auth/mfa.service';

/**
 * POST /api/auth/mfa/regenerate-backup-codes
 *
 * Body: { code: string } — current TOTP code.
 *
 * Rotates the user's backup codes. Old codes are invalidated; new ones
 * returned to the caller as plaintext (last chance to capture). TOTP-only
 * — a backup code can't trigger backup-code regeneration. Otherwise a
 * stolen single backup code could be used to mint a fresh set and lock
 * the real user out.
 */

const Schema = z.object({
  code: z.string().min(6).max(8),
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where:  { id: session.user.id },
      select: { mfaEnabled: true, mfaSecret: true },
    });
    if (!user.mfaEnabled || !user.mfaSecret) {
      return errorResponse('NOT_ENROLLED', 'MFA is not currently enabled', 409, correlationId);
    }
    if (!verifyTotp(user.mfaSecret, parsed.data.code)) {
      return errorResponse('INVALID_CODE', 'Code did not match.', 400, correlationId);
    }

    const fresh  = generateBackupCodes();
    const hashed = await hashBackupCodes(fresh);
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { mfaBackupCodes: hashed as any },
    });

    return successResponse({ backupCodes: fresh }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Regeneration failed';
    return errorResponse('REGENERATE_FAILED', msg, 500, correlationId);
  }
});
