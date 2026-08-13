import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
  generateSecret, otpauthUrl, formatSecret,
  generateBackupCodes, hashBackupCodes,
} from '@/lib/auth/mfa.service';

/**
 * POST /api/auth/mfa/enroll/start
 *
 * Begin MFA enrolment for the calling user. Generates a fresh secret +
 * backup codes, stores them UNCONFIRMED on the User row (mfaEnabled stays
 * false until the confirm step verifies the user has the secret in their
 * authenticator app). Returns the otpauth URL + the human-readable
 * secret + plaintext backup codes.
 *
 * The plaintext codes are returned exactly once — at this moment they're
 * hashed before going into the DB, and there's no way to read them back
 * after this response.
 *
 * Re-running this endpoint on an already-enrolled account replaces the
 * pending enrolment but leaves the existing confirmed enrolment intact
 * until /confirm flips the new secret. If the user is already enrolled
 * (mfaEnabled = true), refuse — they should disable first.
 */
export const POST = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();

  try {
    const existing = await prisma.user.findUniqueOrThrow({
      where:  { id: session.user.id },
      select: { mfaEnabled: true, email: true },
    });
    if (existing.mfaEnabled) {
      return errorResponse(
        'ALREADY_ENROLLED',
        'MFA is already enabled. Disable it first to re-enrol.',
        409,
        correlationId,
      );
    }

    const secret      = generateSecret();
    const backupCodes = generateBackupCodes();
    const hashedCodes = await hashBackupCodes(backupCodes);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaSecret:          secret,
        mfaSecretConfirmed: null,
        mfaBackupCodes:     hashedCodes as any,
        mfaEnabled:         false,
      },
    });

    const url = otpauthUrl(secret, existing.email, 'Suler EMS');

    return successResponse({
      otpauthUrl:   url,
      secret,
      secretChunked: formatSecret(secret),
      backupCodes,  // plaintext — last chance to capture them
    }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not start enrolment';
    return errorResponse('ENROLL_FAILED', msg, 500, correlationId);
  }
});
