import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { verifyTotp, consumeBackupCode } from '@/lib/auth/mfa.service';

/**
 * POST /api/auth/mfa/disable
 *
 * Body: { code: string } — current TOTP code OR an unused backup code.
 *
 * Requires proof-of-possession so a stolen session cookie can't quietly
 * turn off MFA. Same shape /enroll/confirm uses but with optional
 * backup-code fallback so a user who's lost their authenticator can
 * still recover.
 *
 * Clears every MFA column on success.
 */

const Schema = z.object({
  code: z.string().min(6).max(20),
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
      select: { mfaEnabled: true, mfaSecret: true, mfaBackupCodes: true },
    });
    if (!user.mfaEnabled || !user.mfaSecret) {
      return errorResponse('NOT_ENROLLED', 'MFA is not currently enabled', 409, correlationId);
    }

    // Try TOTP first; on miss, fall through to the backup-code path.
    let verified = verifyTotp(user.mfaSecret, parsed.data.code);
    let backupCodeRemaining: string[] | null = null;
    if (!verified) {
      const stored = (user.mfaBackupCodes as string[] | null) ?? [];
      const result = await consumeBackupCode(stored, parsed.data.code);
      if (result.match) {
        verified = true;
        backupCodeRemaining = result.remaining;
      }
    }
    if (!verified) {
      return errorResponse('INVALID_CODE', 'Code did not match.', 400, correlationId);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled:         false,
        mfaSecret:          null,
        mfaSecretConfirmed: null,
        mfaBackupCodes:     Prisma.JsonNull,
        mfaLastUsedAt:      null,
      },
    });

    // Note: backupCodeRemaining isn't persisted — we're tearing down
    // the whole thing anyway. Capturing it for symmetry with the
    // login-time consume path if we ever want a "you spent a backup
    // code to disable" telemetry line.
    void backupCodeRemaining;

    return successResponse({ enabled: false }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Disable failed';
    return errorResponse('DISABLE_FAILED', msg, 500, correlationId);
  }
});
