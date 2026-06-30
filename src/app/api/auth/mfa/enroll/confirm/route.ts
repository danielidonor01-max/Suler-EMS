import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { verifyTotp } from '@/lib/auth/mfa.service';

/**
 * POST /api/auth/mfa/enroll/confirm
 *
 * Body: { code: string } — a 6-digit TOTP from the user's authenticator app.
 *
 * Flips mfaEnabled true ONLY when the supplied code matches the secret
 * stored by /enroll/start. This is the proof step — if the user never
 * actually saved the secret into their app, the code won't match and
 * MFA stays disabled.
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
      select: { mfaSecret: true, mfaEnabled: true },
    });
    if (user.mfaEnabled) {
      return errorResponse('ALREADY_ENROLLED', 'MFA already confirmed', 409, correlationId);
    }
    if (!user.mfaSecret) {
      return errorResponse('NO_PENDING_ENROLLMENT', 'Call /enroll/start first', 409, correlationId);
    }

    if (!verifyTotp(user.mfaSecret, parsed.data.code)) {
      return errorResponse('INVALID_CODE', 'Code did not match. Check your authenticator app.', 400, correlationId);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled:         true,
        mfaSecretConfirmed: new Date(),
      },
    });

    return successResponse({ enabled: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Confirmation failed';
    return errorResponse('CONFIRM_FAILED', msg, 500, correlationId);
  }
});
