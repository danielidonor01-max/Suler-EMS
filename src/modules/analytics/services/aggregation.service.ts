import prisma from "@/lib/prisma";
import { KPIMetric, OperationalInsight, WorkflowBottleneck } from "../domain/analytics.model";

/**
 * Aggregation Service
 *
 * Real metric computation from the transactional tables. Previously a
 * mix of accurate counts (headcount, attendance compliance) and
 * Math.random() placeholders (avgApprovalHours, rejectionRate,
 * utilization). The randoms are gone — anything that can be derived
 * from the data is; anything that genuinely needs a downstream input
 * is omitted rather than hallucinated.
 */
export class AggregationService {

  /** 30-day lookback for workflow stats — balances signal vs. recency. */
  private static WORKFLOW_LOOKBACK_DAYS = 30;

  /**
   * Workforce KPIs. Headcount is an exact count; utilization is the
   * trailing-week attendance compliance rate (people present ÷ people
   * expected) — proxy good enough for an executive overview without
   * a per-shift hours model.
   */
  static async computeWorkforceKPIs(departmentId?: string): Promise<Record<string, KPIMetric>> {
    const employeeWhere = departmentId ? { departmentId } : {};
    const headcount = await prisma.employee.count({
      where: { ...employeeWhere, status: 'ACTIVE' },
    });

    // Trailing 7 calendar days. Sum of PRESENT/LATE rows over the
    // count of expected days (= headcount × 7 weekdays). Weekends
    // are kept in the denominator simplification — for the
    // dashboard view this is fine and the bias is consistent.
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const attendedCount = await prisma.attendanceRecord.count({
      where: {
        date:   { gte: sevenDaysAgo, lte: today },
        status: { in: ['PRESENT', 'LATE'] },
        ...(departmentId ? { employee: { departmentId } } : {}),
      },
    });
    const expected = headcount * 7;
    const utilizationValue = expected > 0
      ? parseFloat(((attendedCount / expected) * 100).toFixed(1))
      : 0;

    return {
      headcount: {
        value:  headcount,
        label:  'Active Headcount',
        status: 'NORMAL',
      },
      utilization: {
        value:  utilizationValue,
        label:  '7-Day Attendance Rate',
        unit:   '%',
        status: utilizationValue < 70 ? 'WARNING' : 'NORMAL',
      },
    };
  }

  /**
   * Attendance compliance for a single day. Denominator is active
   * employees; numerator is non-absent rows. Returns the rate as a
   * KPI metric with status thresholds at 85% / 95%.
   */
  static async computeAttendanceCompliance(date: Date): Promise<KPIMetric> {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    const [totalEmployees, attended] = await Promise.all([
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.attendanceRecord.count({
        where: {
          date:   { gte: dayStart, lte: dayEnd },
          status: { in: ['PRESENT', 'LATE'] },
        },
      }),
    ]);

    const compliance = totalEmployees > 0
      ? parseFloat(((attended / totalEmployees) * 100).toFixed(1))
      : 0;

    return {
      value:  compliance,
      label:  'Attendance Compliance',
      unit:   '%',
      status: compliance < 85 ? 'CRITICAL' : compliance < 95 ? 'WARNING' : 'NORMAL',
    };
  }

  /**
   * Workflow bottlenecks per department.
   *
   *   pendingCount        — leave requests still in flight (SUBMITTED or
   *                         MANAGER_APPROVED) for employees in this dept.
   *   averageApprovalHours — mean turnaround for COMPLETED LEAVE
   *                         workflows over the last 30 days. Pulled from
   *                         WorkflowMetric.turnaroundMinutes / 60.
   *   rejectionRate        — REJECTED ÷ (REJECTED + COMPLETED), same
   *                         window. Defensive on /0.
   *
   * Status thresholds: avg ≥ 24h → CRITICAL, ≥ 12h → WARNING.
   */
  static async getWorkflowBottlenecks(): Promise<WorkflowBottleneck[]> {
    const lookbackFrom = new Date();
    lookbackFrom.setDate(lookbackFrom.getDate() - this.WORKFLOW_LOOKBACK_DAYS);

    const departments = await prisma.department.findMany({
      select: {
        id: true, name: true,
        employees: { select: { id: true } },
      },
    });

    const bottlenecks: WorkflowBottleneck[] = [];

    for (const dept of departments) {
      const employeeIds = dept.employees.map(e => e.id);
      if (employeeIds.length === 0) {
        bottlenecks.push({
          departmentId: dept.id, departmentName: dept.name,
          averageApprovalHours: 0, pendingCount: 0, rejectionRate: 0,
          status: 'NORMAL',
        });
        continue;
      }

      const [pendingCount, completed, rejected, allTurnarounds] = await Promise.all([
        prisma.leaveRequest.count({
          where: {
            employeeId: { in: employeeIds },
            status:     { in: ['SUBMITTED', 'MANAGER_APPROVED'] },
          },
        }),
        prisma.workflowMetric.count({
          where: {
            type:        'LEAVE',
            status:      'COMPLETED',
            requestDate: { gte: lookbackFrom },
            resourceId:  { in: employeeIds },
          },
        }),
        prisma.workflowMetric.count({
          where: {
            type:        'LEAVE',
            status:      'REJECTED',
            requestDate: { gte: lookbackFrom },
            resourceId:  { in: employeeIds },
          },
        }),
        prisma.workflowMetric.aggregate({
          where: {
            type:               'LEAVE',
            status:             { in: ['COMPLETED', 'REJECTED'] },
            requestDate:        { gte: lookbackFrom },
            resourceId:         { in: employeeIds },
            turnaroundMinutes:  { not: null },
          },
          _avg: { turnaroundMinutes: true },
        }),
      ]);

      const avgMinutes = allTurnarounds._avg.turnaroundMinutes ?? 0;
      const avgHours = parseFloat((avgMinutes / 60).toFixed(1));
      const totalCompleted = completed + rejected;
      const rejectionRate = totalCompleted > 0
        ? parseFloat(((rejected / totalCompleted) * 100).toFixed(1))
        : 0;

      bottlenecks.push({
        departmentId:         dept.id,
        departmentName:       dept.name,
        averageApprovalHours: avgHours,
        pendingCount,
        rejectionRate,
        status: avgHours >= 24 ? 'CRITICAL' : avgHours >= 12 ? 'WARNING' : 'NORMAL',
      });
    }

    return bottlenecks.sort((a, b) => b.averageApprovalHours - a.averageApprovalHours);
  }

  /**
   * 7-day operational trend series: attendance compliance per day +
   * leave-workflow throughput (count completed). Shape matches what the
   * chart on /analytics expects: [{ date, compliance, throughput }].
   */
  static async getOperationalTrends(days = 7): Promise<Array<{
    date: string; compliance: number; throughput: number;
  }>> {
    const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));

    // Pull both series in batched queries (one for attendance, one for
    // workflow completions across the entire window), then bucket by day.
    const [attendanceRows, workflowRows] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: {
          date:   { gte: startDate, lte: today },
          status: { in: ['PRESENT', 'LATE'] },
        },
        select: { date: true },
      }),
      prisma.workflowMetric.findMany({
        where: {
          type:           'LEAVE',
          status:         'COMPLETED',
          completionDate: { gte: startDate, lte: new Date(today.getTime() + 86_400_000) },
        },
        select: { completionDate: true },
      }),
    ]);

    const buckets = new Map<string, { compliance: number; throughput: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), { compliance: 0, throughput: 0 });
    }

    for (const a of attendanceRows) {
      const key = a.date.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) b.compliance++;
    }
    for (const w of workflowRows) {
      if (!w.completionDate) continue;
      const key = w.completionDate.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) b.throughput++;
    }

    return Array.from(buckets.entries()).map(([date, vals]) => ({
      date,
      compliance: totalEmployees > 0
        ? parseFloat(((vals.compliance / totalEmployees) * 100).toFixed(1))
        : 0,
      throughput: vals.throughput,
    }));
  }

  /**
   * KPI achievement aggregate from the PerformanceKPI table. Returns
   * achievement % per KPI (latest measurement ÷ target). Used as the
   * "competency map" on /analytics — replaces the hardcoded MOCK_COMPETENCY
   * array that page used to render.
   *
   * Limit 12 to keep the executive view scannable; sorted by achievement
   * ascending so attention items sit at the top.
   */
  static async getKPIAchievement(): Promise<Array<{
    id: string;
    title: string;
    achievementPct: number;
    target: number;
    unit: string | null;
    latestValue: number | null;
  }>> {
    const kpis = await prisma.performanceKPI.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        measurements: {
          orderBy: { periodStart: 'desc' },
          take:    1,
          select:  { actualValue: true },
        },
      },
    });

    const rows = kpis.map(k => {
      const latest = k.measurements[0]?.actualValue ?? null;
      const achievementPct = (latest != null && k.target > 0)
        ? Math.max(0, Math.min(150, parseFloat(((latest / k.target) * 100).toFixed(1))))
        : 0;
      return {
        id:             k.id,
        title:          k.title,
        achievementPct,
        target:         k.target,
        unit:           k.unit,
        latestValue:    latest,
      };
    });

    return rows
      .sort((a, b) => a.achievementPct - b.achievementPct)
      .slice(0, 12);
  }

  /**
   * Surface notable conditions as a UI-ready list. We don't synthesize
   * insights that aren't backed by real numbers — each entry below is
   * conditional on its underlying metric crossing a threshold.
   */
  static async generateInsights(): Promise<OperationalInsight[]> {
    const insights: OperationalInsight[] = [];
    const compliance = await this.computeAttendanceCompliance(new Date());

    if (compliance.status === 'CRITICAL') {
      insights.push({
        id:        crypto.randomUUID(),
        type:      'COMPLIANCE',
        severity:  'CRITICAL',
        title:     'Low Attendance Compliance',
        message:   `Today's attendance is at ${compliance.value}%, below the 85% operational threshold.`,
        suggestedAction: 'Review site attendance logs and contact supervisors.',
        timestamp: new Date(),
      });
    }

    const bottlenecks = await this.getWorkflowBottlenecks();
    const criticalBottleneck = bottlenecks.find(b => b.status === 'CRITICAL');
    if (criticalBottleneck) {
      insights.push({
        id:        crypto.randomUUID(),
        type:      'EFFICIENCY',
        severity:  'WARNING',
        title:     'Workflow Bottleneck Detected',
        message:   `The ${criticalBottleneck.departmentName} department has ${criticalBottleneck.pendingCount} pending approvals with an average delay of ${criticalBottleneck.averageApprovalHours}h.`,
        suggestedAction: 'Escalate pending approvals to HR or Department Head.',
        timestamp: new Date(),
      });
    }

    return insights;
  }
}
