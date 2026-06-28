import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
  canEditOthers,
  canViewCompensation,
  canViewActivity,
  clippedDays,
} from '@/lib/profile/permissions';

/**
 * /api/employees/[id]/profile/extras — the heavy aggregations split off
 * from the core profile endpoint so the modal can render its
 * above-the-fold sections first while these stream in.
 *
 * Owns the below-the-fold panels:
 *   - leaveBalances
 *   - attendanceSummary
 *   - performanceSummary
 *   - recentPayslips
 *   - compensationHistory (just the history list; active comp stays in core)
 *   - activityTimeline
 *
 * Capability gating mirrors the core route (shared helpers in
 * src/lib/profile/permissions.ts) — fields gated on canViewCompensation
 * or canViewActivity are scrubbed to empty arrays for non-privileged
 * viewers rather than 403'd, so the client doesn't need to special-case
 * the absence.
 */

interface ActivityEvent {
  id:           string;
  kind:         'CHANGE_REQUEST_CREATED' | 'CHANGE_REQUEST_REVIEWED'
              | 'SALARY_STRUCTURE_CREATED'
              | 'DOCUMENT_UPLOADED'
              | 'LEAVE_REQUEST_CREATED';
  title:        string;
  description:  string;
  actorName:    string | null;
  timestamp:    Date;
  resourceId:   string;
  resourceType: 'ProfileChangeRequest' | 'SalaryStructure' | 'EmployeeDocument' | 'LeaveRequest';
}

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const now = new Date();
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const yearEnd   = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59));
    const thirtyDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
    const todayUtc      = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    const showCompensation = canViewCompensation(session as any, id);
    const showActivity     = canViewActivity(session as any, id);

    // Existence check + the inputs the org-aware visibility decisions
    // rely on (we need to know the employee exists before returning).
    // Cheap query — just a count would also work, but we want a 404 for
    // a bad id, same as the core endpoint.
    const exists = await prisma.employee.findUnique({
      where:  { id },
      select: { id: true },
    });
    if (!exists) return errorResponse('NOT_FOUND', 'Employee not found', 404, correlationId);

    const [
      leaveTypes, approvedLeaves, attendanceCounts, lastPunch,
      goals, kpis, recentPayslipsRaw,
      compensationHistoryRaw,
      changeRequestsAll, salaryStructureCreates, documentUploads, recentLeaveRequests,
    ] = await Promise.all([
      prisma.leaveType.findMany({
        where:  { isActive: true },
        orderBy: { code: 'asc' },
        select: { code: true, name: true, color: true, quotaDays: true },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employeeId: id,
          status:     'HR_APPROVED',
          startDate:  { lte: yearEnd },
          endDate:    { gte: yearStart },
        },
        select: { type: true, startDate: true, endDate: true },
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: {
          employeeId: id,
          date:       { gte: thirtyDaysAgo, lte: todayUtc },
        },
        _count: { _all: true },
      }),
      prisma.attendanceRecord.findFirst({
        where:   { employeeId: id, checkIn: { not: null } },
        orderBy: { date: 'desc' },
        select:  { date: true, checkIn: true, checkOut: true, status: true },
      }),
      prisma.performanceGoal.findMany({
        where:   { employeeId: id, status: { in: ['ACTIVE', 'COMPLETED'] } },
        orderBy: { updatedAt: 'desc' },
        take:    50,
        select: {
          id: true, title: true, status: true, category: true,
          progressPercent: true, dueDate: true,
        },
      }),
      prisma.performanceKPI.findMany({
        where:   { employeeId: id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take:    20,
        select: {
          id: true, title: true, target: true, unit: true, frequency: true,
          measurements: {
            orderBy: { periodStart: 'desc' },
            take:    1,
            select:  { actualValue: true },
          },
        },
      }),
      prisma.payrollEntry.findMany({
        where:   { employeeId: id, run: { status: 'PROCESSED' } },
        orderBy: { run: { processedAt: 'desc' } },
        take:    6,
        select: {
          id: true,
          netPay: true,
          grossPay: true,
          paye: true,
          totalDeductions: true,
          run: { select: { id: true, period: true, name: true, processedAt: true } },
        },
      }),
      // Compensation history — everything other than the active row.
      // The active row stays in the core endpoint so the summary shows
      // immediately; this is the expandable history list.
      prisma.salaryStructure.findMany({
        where:   { employeeId: id, isActive: false },
        orderBy: { effectiveDate: 'desc' },
        take:    5,
        select: {
          id: true,
          isActive: true,
          effectiveDate: true,
          basicSalary: true,
          housingAllowance: true,
          transportAllowance: true,
          otherAllowances: true,
          currency: true,
          reason: true,
        },
      }),
      prisma.profileChangeRequest.findMany({
        where:   { employeeId: id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: {
          id: true, field: true, status: true,
          createdAt: true, reviewedAt: true,
          requestedBy: { select: { id: true, name: true } },
          reviewedBy:  { select: { id: true, name: true } },
        },
      }),
      prisma.salaryStructure.findMany({
        where:   { employeeId: id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: { id: true, createdAt: true, effectiveDate: true, reason: true, changedById: true },
      }),
      prisma.employeeDocument.findMany({
        where:   { employeeId: id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: {
          id: true, kind: true, fileName: true, createdAt: true,
          uploadedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.leaveRequest.findMany({
        where:   { employeeId: id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: { id: true, type: true, status: true, createdAt: true, updatedAt: true },
      }),
    ]);

    // ── Leave balances ──────────────────────────────────────────────
    const usedByType = new Map<string, number>();
    for (const lr of approvedLeaves) {
      const days = clippedDays(lr.startDate, lr.endDate, yearStart, yearEnd);
      if (days <= 0) continue;
      usedByType.set(lr.type, (usedByType.get(lr.type) ?? 0) + days);
    }
    const leaveBalances = leaveTypes.map(lt => {
      const used = usedByType.get(lt.code) ?? 0;
      return {
        typeCode:  lt.code,
        typeName:  lt.name,
        color:     lt.color,
        quota:     lt.quotaDays,
        used,
        remaining: Math.max(0, lt.quotaDays - used),
      };
    });

    // ── Attendance summary ─────────────────────────────────────────
    const attendanceCountsMap = new Map<string, number>();
    for (const row of attendanceCounts) {
      attendanceCountsMap.set(row.status, row._count._all);
    }
    const present = attendanceCountsMap.get('PRESENT') ?? 0;
    const late    = attendanceCountsMap.get('LATE')    ?? 0;
    const absent  = attendanceCountsMap.get('ABSENT')  ?? 0;
    const totalLogged = present + late + absent;
    const punctualityPct = totalLogged > 0
      ? parseFloat(((present / totalLogged) * 100).toFixed(1))
      : 0;
    const attendanceSummary = {
      windowDays:    30,
      present,
      late,
      absent,
      totalLogged,
      punctualityPct,
      lastCheckIn:   lastPunch?.checkIn ?? null,
      lastCheckOut:  lastPunch?.checkOut ?? null,
      lastStatus:    lastPunch?.status ?? null,
    };

    // ── Performance summary ────────────────────────────────────────
    const goalsActive    = goals.filter(g => g.status === 'ACTIVE').length;
    const goalsCompleted = goals.filter(g => g.status === 'COMPLETED').length;
    const goalsOverdue   = goals.filter(g =>
      g.status === 'ACTIVE' && g.dueDate && new Date(g.dueDate) < now
    ).length;
    const goalsTopOpen = goals
      .filter(g => g.status === 'ACTIVE')
      .slice(0, 3)
      .map(g => ({
        id:              g.id,
        title:           g.title,
        progressPercent: g.progressPercent,
        category:        g.category,
        dueDate:         g.dueDate,
        isOverdue:       Boolean(g.dueDate && new Date(g.dueDate) < now),
      }));
    const kpiRows = kpis.map(k => {
      const latest = k.measurements[0]?.actualValue ?? null;
      const achievementPct = (latest != null && k.target > 0)
        ? Math.max(0, Math.min(150, parseFloat(((latest / k.target) * 100).toFixed(1))))
        : 0;
      return {
        id:             k.id,
        title:          k.title,
        target:         k.target,
        unit:           k.unit,
        frequency:      k.frequency,
        latestValue:    latest,
        achievementPct,
      };
    });
    const kpisAtRisk = [...kpiRows]
      .sort((a, b) => a.achievementPct - b.achievementPct)
      .slice(0, 3);
    const performanceSummary = {
      goals: {
        active:    goalsActive,
        completed: goalsCompleted,
        overdue:   goalsOverdue,
        topOpen:   goalsTopOpen,
      },
      kpis: {
        total:    kpiRows.length,
        atRisk:   kpisAtRisk,
      },
    };

    // ── Compensation history (active row lives in core) ────────────
    const compensationHistory = showCompensation
      ? compensationHistoryRaw.map(s => {
          const others = ((s.otherAllowances as Array<{ amount: number }> | null) ?? [])
            .reduce((sum, a) => sum + Number(a.amount), 0);
          const basic     = Number(s.basicSalary);
          const housing   = Number(s.housingAllowance);
          const transport = Number(s.transportAllowance);
          return {
            id:                 s.id,
            isActive:           s.isActive,
            effectiveDate:      s.effectiveDate,
            basicSalary:        basic,
            housingAllowance:   housing,
            transportAllowance: transport,
            otherAllowances:    others,
            grossMonthly:       basic + housing + transport + others,
            currency:           s.currency,
            reason:             s.reason,
          };
        })
      : [];

    // ── Recent payslips ────────────────────────────────────────────
    const recentPayslips = showCompensation
      ? recentPayslipsRaw.map(p => ({
          id:              p.id,
          period:          p.run.period,
          runName:         p.run.name,
          processedAt:     p.run.processedAt,
          grossPay:        Number(p.grossPay),
          paye:            Number(p.paye),
          totalDeductions: Number(p.totalDeductions),
          netPay:          Number(p.netPay),
        }))
      : [];

    // ── Activity timeline ──────────────────────────────────────────
    const events: ActivityEvent[] = [];
    for (const c of changeRequestsAll) {
      events.push({
        id:           `${c.id}-created`,
        kind:         'CHANGE_REQUEST_CREATED',
        title:        `Change request submitted: ${c.field}`,
        description:  c.requestedBy?.name ? `Requested by ${c.requestedBy.name}.` : 'Requested.',
        actorName:    c.requestedBy?.name ?? null,
        timestamp:    c.createdAt,
        resourceId:   c.id,
        resourceType: 'ProfileChangeRequest',
      });
      if (c.reviewedAt) {
        events.push({
          id:           `${c.id}-reviewed`,
          kind:         'CHANGE_REQUEST_REVIEWED',
          title:        `Change request ${c.status.toLowerCase()}: ${c.field}`,
          description:  c.reviewedBy?.name ? `Reviewed by ${c.reviewedBy.name}.` : 'Reviewed.',
          actorName:    c.reviewedBy?.name ?? null,
          timestamp:    c.reviewedAt,
          resourceId:   c.id,
          resourceType: 'ProfileChangeRequest',
        });
      }
    }
    for (const s of salaryStructureCreates) {
      events.push({
        id:           s.id,
        kind:         'SALARY_STRUCTURE_CREATED',
        title:        'New salary structure created',
        description:  s.reason
                        ? `Effective ${s.effectiveDate.toISOString().slice(0, 10)} — ${s.reason}`
                        : `Effective ${s.effectiveDate.toISOString().slice(0, 10)}.`,
        actorName:    null,
        timestamp:    s.createdAt,
        resourceId:   s.id,
        resourceType: 'SalaryStructure',
      });
    }
    for (const d of documentUploads) {
      events.push({
        id:           d.id,
        kind:         'DOCUMENT_UPLOADED',
        title:        `Document uploaded: ${d.fileName}`,
        description:  d.uploadedBy?.name
                        ? `${d.kind} · uploaded by ${d.uploadedBy.name}.`
                        : `${d.kind}.`,
        actorName:    d.uploadedBy?.name ?? null,
        timestamp:    d.createdAt,
        resourceId:   d.id,
        resourceType: 'EmployeeDocument',
      });
    }
    for (const lr of recentLeaveRequests) {
      events.push({
        id:           lr.id,
        kind:         'LEAVE_REQUEST_CREATED',
        title:        `Leave request submitted: ${lr.type}`,
        description:  `Currently ${lr.status.replace(/_/g, ' ').toLowerCase()}.`,
        actorName:    null,
        timestamp:    lr.createdAt,
        resourceId:   lr.id,
        resourceType: 'LeaveRequest',
      });
    }
    const activityTimeline = showActivity
      ? events
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 20)
          .map(e => ({ ...e, timestamp: e.timestamp.toISOString() }))
      : [];

    return successResponse({
      leaveBalances,
      attendanceSummary,
      performanceSummary,
      recentPayslips,
      compensationHistory,
      activityTimeline,
    }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load profile extras';
    return errorResponse('EXTRAS_FAILED', msg, 500, correlationId);
  }
});

// Silence unused-import lint when this file is imported as a route module.
void canEditOthers;
