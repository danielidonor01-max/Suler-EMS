import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/profile/preferences — per-user UI preferences.
 *
 *   GET    — read the calling user's preferences. Returns DEFAULTS merged
 *            with whatever the user has saved, so the client always has a
 *            complete object regardless of when the column was added.
 *   PATCH  — partial update. Body is a Partial<Preferences>; server merges
 *            against the stored value and writes the merged result back.
 *
 * Why a Json column and not first-class fields: the preferences shape will
 * grow (language, locale, notification toggles per category, etc.). Json
 * keeps schema migrations to one-time work and lets the client + server
 * evolve in lockstep via the validation schema below.
 */

const ThemeSchema = z.enum(['light', 'dark', 'system']);
const EmailDigestSchema = z.enum(['off', 'daily', 'weekly']);

const PreferencesSchema = z.object({
  theme: ThemeSchema,
  toastsEnabled: z.boolean(),
  messageBadge: z.boolean(),
  broadcastSounds: z.boolean(),
  emailDigest: EmailDigestSchema,
  language: z.literal('en'),
});

const PartialPreferencesSchema = PreferencesSchema.partial();

export type ServerPreferences = z.infer<typeof PreferencesSchema>;

const DEFAULTS: ServerPreferences = {
  theme: 'light',
  toastsEnabled: true,
  messageBadge: true,
  broadcastSounds: false,
  emailDigest: 'off',
  language: 'en',
};

function merge(stored: unknown): ServerPreferences {
  if (!stored || typeof stored !== 'object') return DEFAULTS;
  // Parse with the partial schema so junk keys are stripped and bad
  // values fall back to defaults. Anything that fails validation is
  // ignored rather than throwing — preferences should never break a
  // page load even if a stale shape is in the DB.
  const parsed = PartialPreferencesSchema.safeParse(stored);
  if (!parsed.success) return DEFAULTS;
  return { ...DEFAULTS, ...parsed.data };
}

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { preferences: true },
    });
    return successResponse(merge(user.preferences), correlationId);
  } catch (err) {
    return errorResponse(
      'NOT_FOUND',
      err instanceof Error ? err.message : 'User not found',
      404,
      correlationId,
    );
  }
});

export const PATCH = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = PartialPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  // Read the current stored value, merge the patch, write back. We could
  // use a single UPDATE with a JSON merge, but read-modify-write is simpler
  // and the row is single-actor (the user editing their own preferences).
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });
  const merged: ServerPreferences = { ...merge(current?.preferences), ...parsed.data };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferences: merged },
  });

  return successResponse(merged, correlationId);
});
