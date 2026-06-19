import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { lagosToday } from '@/lib/attendance/time';
import { findNearestSite, isValidCoord, type SitePoint } from '@/lib/attendance/geo';

/**
 * POST /api/attendance/clock-out
 *
 * Records the calling user's clock-out for today's attendance row.
 * Same geo-fence semantics as clock-in: in-bounds records the site,
 * out-of-bounds requires a note, no-coords-with-sites-configured is
 * rejected with LOCATION_REQUIRED.
 *
 * No status change on clock-out — PRESENT/LATE classification is fixed
 * by the morning arrival time.
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

  const date = lagosToday();

  try {
    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (!existing || !existing.checkIn) {
      return errorResponse('NO_RECORD', 'You have not clocked in today', 409, correlationId);
    }
    if (existing.checkOut) {
      return errorResponse('ALREADY_CLOCKED_OUT', `You already clocked out at ${existing.checkOut.toISOString()}`, 409, correlationId);
    }

    const activeSites = await prisma.workSite.findMany({
      where: { isActive: true },
      select: { id: true, name: true, lat: true, lng: true, radiusMeters: true },
    });

    let checkOutSiteId: string | null = null;
    let checkOutDistance: number | null = null;
    let inBounds = false;
    if (hasCoords && activeSites.length > 0) {
      const match = findNearestSite(lat!, lng!, activeSites as SitePoint[]);
      if (match) {
        checkOutDistance = match.distanceMeters;
        inBounds         = match.inBounds;
        if (match.inBounds) checkOutSiteId = match.site.id;
      }
    }

    if (activeSites.length > 0 && !hasCoords) {
      return errorResponse(
        'LOCATION_REQUIRED',
        'Location is required to clock out. Please allow location access.',
        400,
        correlationId,
      );
    }
    if (activeSites.length > 0 && hasCoords && !inBounds && !note) {
      return errorResponse(
        'OUT_OF_BOUNDS',
        `You are ${checkOutDistance ?? '?'}m from the nearest office. Add a note (e.g. field visit) to clock out anyway.`,
        400,
        correlationId,
      );
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: {
        checkOut:          new Date(),
        checkOutLat:       hasCoords ? lat : null,
        checkOutLng:       hasCoords ? lng : null,
        checkOutSiteId,
        checkOutDistance,
        checkOutNote:      note,
      },
      include: {
        checkOutSite: { select: { id: true, name: true } },
      },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to clock out';
    return errorResponse('CLOCK_OUT_FAILED', msg, 500, correlationId);
  }
});
