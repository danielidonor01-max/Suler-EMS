import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { DEFAULTS } from '@/lib/settings/service';

/**
 * GET /api/settings
 *
 * Returns every declared setting with its current value (defaulting in
 * any rows that don't exist yet — first-read self-seeds). Optional
 * ?category=SECURITY filter.
 *
 * Permission: SUPER_ADMIN or settings:manage. Read-only endpoint, so
 * a non-admin caller gets 403 here rather than a silent partial view.
 */

function canManageSettings(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('settings:manage');
}

export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!canManageSettings(session as any)) {
    return errorResponse('FORBIDDEN', 'settings:manage required', 403, correlationId);
  }

  const url = new URL(req.url);
  const categoryFilter = url.searchParams.get('category');

  try {
    // Pull what's persisted so we know which rows already exist.
    const rows = await prisma.systemSetting.findMany({
      ...(categoryFilter ? { where: { category: categoryFilter } } : {}),
      include: {
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });
    const byKey = Object.fromEntries(rows.map(r => [r.key, r]));

    // Walk DEFAULTS so we always return the full declared catalogue
    // even when nothing's been persisted yet. The first GET of a fresh
    // install therefore returns the canonical defaults; the row gets
    // materialised on the first write OR on the first typed-getter
    // call from the service.
    const data = DEFAULTS
      .filter(d => !categoryFilter || d.category === categoryFilter)
      .map(d => {
        const row = byKey[d.key];
        return {
          key:          d.key,
          category:     d.category,
          description:  d.description,
          value:        row?.value ?? d.defaultValue,
          isDefault:    !row,
          updatedAt:    row?.updatedAt ?? null,
          updatedBy:    row?.updatedBy ?? null,
        };
      });

    return successResponse(data, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list settings';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});
