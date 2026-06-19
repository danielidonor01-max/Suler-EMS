import { NextRequest, NextResponse } from 'next/server';
import { evaluateLockout, lockoutMessage } from '@/lib/auth/lockout.service';

/**
 * POST /api/auth/lockout-check
 *
 * Public endpoint (no session required) so the login form can render a
 * tailored "Account locked, try again in X minutes" message instead of
 * the generic CredentialsSignin error NextAuth surfaces.
 *
 * We don't leak whether the email exists — the response is the same
 * shape for any email: { locked, retryAfterSeconds, remainingAttempts,
 * message }. The remainingAttempts value naturally hides existence
 * because a non-existent account just shows the full attempt budget
 * regardless of whether anyone's ever signed in with it.
 */

export async function POST(req: NextRequest) {
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!email || email.length > 320) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const state = await evaluateLockout(email);
  return NextResponse.json({
    locked:             state.locked,
    retryAfterSeconds:  state.retryAfterSeconds,
    remainingAttempts:  state.remainingAttempts,
    message:            lockoutMessage(state),
  });
}
