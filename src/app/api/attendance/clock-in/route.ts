import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { classifyClockIn, lagosToday } from '@/lib/attendance/time';
import { findNearestSite, isValidCoord, type SitePoint } from '@/lib/attendance/geo';

/**
 * POST /api/attendance/clock-in
 *
 * Records the calling user's clock-in for the current Lagos calendar day.
 * Geo-fence rules:
 *   - Coordinates are optional in the request. When provided, we match
 *     against active WorkSites by closest-point haversine.
 *   - If in-bounds (within site radius): record the site + distance, no
 *     note required.
 *   - If out-of-bounds OR no site configured: a non-empty `note` is
 *     required (field staff, customer visits). Hard-blocking would
 *     break legitimate work.
 *   - If no coords provided at all and there are active sites: 400
 *     LOCATION_REQUIRED. We refuse to silently record an attendance
 *     row without provenance once HR has configured geo-fencing.
 *
 * Idempotent failure path preserved: returns 409 ALREADY_CLOCKED_IN with
 * existing time so the UI can render without re-mutating.
 */

const Schema = z.object({
  lat:  z.number().optional(),
  lng:  z.number().optional(),
  note: z.string().max(280).optional().nullable(),
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return errorResponse(
      'NO_EMPLOYEE',
      'Your account is not linked to an employee record',
      400,
      correlationId,
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const { lat, lng } = parsed.data;
  const note = parsed.data.note?.trim() || null;
  const hasCoords = lat !== undefined && lng !== undefined;
  if (hasCoords && !isValidCoord(lat!, lng!)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid lat/lng', 400, correlationId);
  }

  // Active sites — small table, plain findMany. If you eventually need
  // per-employee scoping, swap this for a sites-assigned-to-employee
  // query.
  const activeSites = await prisma.workSite.findMany({
    where: { isActive: true },
    select: { id: true, name: true, lat: true, lng: true, radiusMeters: true },
  });

  // Resolve geo-fence decision.
  let checkInSiteId: string | null = null;
  let checkInDistance: number | null = null;
  let inBounds = false;
  if (hasCoords && activeSites.length > 0) {
    const match = findNearestSite(lat!, lng!, activeSites as SitePoint[]);
    if (match) {
      checkInDistance = match.distanceMeters;
      inBounds        = match.inBounds;
      if (match.inBounds) checkInSiteId = match.site.id;
    }
  }

  // Enforcement:
  //   1. Sites configured + no coords → LOCATION_REQUIRED.
  //   2. Sites configured + out-of-bounds + no note → OUT_OF_BOUNDS.
  //   3. Otherwise accept.
  if (activeSites.length > 0 && !hasCoords) {
    return errorResponse(
      'LOCATION_REQUIRED',
      'Location is required to clock in. Please allow location access.',
      400,
      correlationId,
    );
  }
  if (activeSites.length > 0 && hasCoords && !inBounds && !note) {
    return errorResponse(
      'OUT_OF_BOUNDS',
      `You are ${checkInDistance ?? '?'}m from the nearest office. Add a note (e.g. field visit) to clock in anyway.`,
      400,
      correlationId,
    );
  }

  const date = lagosToday();
  const now = new Date();
  const status = classifyClockIn(now);

  try {
    const created = await prisma.attendanceRecord.create({
      data: {
        employeeId,
        date,
        checkIn:         now,
        status,
        checkInLat:      hasCoords ? lat : null,
        checkInLng:      hasCoords ? lng : null,
        checkInSiteId,
        checkInDistance,
        checkInNote:     note,
      },
      include: {
        checkInSite: { select: { id: true, name: true } },
      },
    });
    return successResponse(created, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to clock in';
    if (msg.includes('Unique constraint')) {
      const existing = await prisma.attendanceRecord.findUnique({
        where: { employeeId_date: { employeeId, date } },
      });
      return errorResponse(
        'ALREADY_CLOCKED_IN',
        `You already clocked in today at ${existing?.checkIn?.toISOString() ?? '—'}`,
        409,
        correlationId,
      );
    }
    return errorResponse('CLOCK_IN_FAILED', msg, 500, correlationId);
  }
});
