/**
 * Report generators.
 *
 * Each function turns a Prisma client + parameters into a Buffer (the
 * CSV body) and returns the generated file's metadata. Synchronous —
 * the API route handler invokes the matching generator and writes the
 * Buffer straight to ReportJob.data.
 *
 * Adding a new report:
 *   1. Add a key to ReportType.
 *   2. Implement a generator function and register it in REGISTRY.
 *   3. Expose it on the /reports page's TEMPLATES array.
 */

import type { PrismaClient } from '@prisma/client';

export type ReportType = 'WORKFORCE_HEADCOUNT' | 'LEAVE_BALANCE' | 'AUDIT_LOG';

export interface ReportResult {
  data:     Buffer;
  fileName: string;
  mimeType: string;
}

interface GeneratorContext {
  prisma: PrismaClient;
  parameters?: Record<string, unknown>;
}

// ─── CSV utility ─────────────────────────────────────────────────────────────

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): Buffer {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
  // Prepend a UTF-8 BOM so Excel opens with the right encoding on
  // Windows — Nigerian names with diacritics survive intact.
  return Buffer.from('﻿' + lines.join('\r\n') + '\r\n', 'utf8');
}

function isoStamp(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// ─── Generators ──────────────────────────────────────────────────────────────

async function workforceHeadcount(ctx: GeneratorContext): Promise<ReportResult> {
  const employees = await ctx.prisma.employee.findMany({
    where: { status: { not: 'INACTIVE' } },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      department: { select: { name: true, code: true } },
      user:       { select: { role: { select: { name: true } } } },
    },
  });

  const rows = employees.map(e => [
    e.staffId,
    `${e.firstName} ${e.lastName}`,
    e.email,
    e.phone ?? '',
    e.jobTitle,
    e.grade ?? '',
    e.branch ?? '',
    e.department?.name ?? '',
    e.user?.role.name ?? '',
    e.status,
    isoStamp(e.createdAt),
  ]);

  return {
    data:     toCsv(
      ['Staff ID', 'Name', 'Email', 'Phone', 'Job Title', 'Grade', 'Hub', 'Department', 'Role', 'Status', 'Joined'],
      rows,
    ),
    fileName: `workforce-headcount-${isoStamp()}.csv`,
    mimeType: 'text/csv',
  };
}

async function leaveBalance(ctx: GeneratorContext): Promise<ReportResult> {
  const year = typeof ctx.parameters?.year === 'number' ? ctx.parameters.year as number : new Date().getFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd   = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

  const [employees, leaveTypes, approved] = await Promise.all([
    ctx.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true, branch: true },
    }),
    ctx.prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    }),
    ctx.prisma.leaveRequest.findMany({
      where: {
        status:    'HR_APPROVED',
        startDate: { lte: yearEnd },
        endDate:   { gte: yearStart },
      },
      select: { employeeId: true, type: true, startDate: true, endDate: true },
    }),
  ]);

  const clippedDays = (s: Date, e: Date) => {
    const start = s > yearStart ? s : yearStart;
    const end   = e < yearEnd ? e : yearEnd;
    if (end < start) return 0;
    return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  };

  // (employeeId, typeCode) → used-days.
  const used = new Map<string, number>();
  for (const lr of approved) {
    const days = clippedDays(lr.startDate, lr.endDate);
    if (days <= 0) continue;
    const k = `${lr.employeeId}::${lr.type}`;
    used.set(k, (used.get(k) ?? 0) + days);
  }

  // One row per employee × type so HR can pivot in Excel.
  const rows: Array<Array<unknown>> = [];
  for (const emp of employees) {
    for (const lt of leaveTypes) {
      const u = used.get(`${emp.id}::${lt.code}`) ?? 0;
      const remaining = Math.max(0, lt.quotaDays - u);
      rows.push([
        emp.staffId,
        `${emp.firstName} ${emp.lastName}`,
        emp.jobTitle,
        emp.branch ?? '',
        lt.code,
        lt.name,
        lt.quotaDays,
        u,
        remaining,
      ]);
    }
  }

  return {
    data:     toCsv(
      ['Staff ID', 'Name', 'Job Title', 'Hub', 'Type Code', 'Type Name', 'Quota', 'Used', 'Remaining'],
      rows,
    ),
    fileName: `leave-balance-${year}-${isoStamp()}.csv`,
    mimeType: 'text/csv',
  };
}

async function auditLog(ctx: GeneratorContext): Promise<ReportResult> {
  const days = typeof ctx.parameters?.days === 'number' ? ctx.parameters.days as number : 30;
  const cutoff = new Date(Date.now() - days * 86_400_000);

  const [workflowEntries, securityEvents] = await Promise.all([
    ctx.prisma.workflowAuditEntry.findMany({
      where:   { timestamp: { gte: cutoff } },
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp: true, actorName: true, actorRole: true,
        action: true, fromState: true, toState: true, comment: true,
        instance: { select: { workflowId: true, resourceId: true } },
      },
    }),
    ctx.prisma.securityEvent.findMany({
      where:   { timestamp: { gte: cutoff } },
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp: true, type: true, description: true, ipAddress: true, userId: true,
      },
    }),
  ]);

  // Merge into a single chronological feed.
  type Row = { timestamp: Date; source: string; actor: string; action: string; detail: string };
  const rows: Row[] = [
    ...workflowEntries.map(e => ({
      timestamp: e.timestamp,
      source:    `workflow:${e.instance?.workflowId ?? ''}`,
      actor:     `${e.actorName} (${e.actorRole})`,
      action:    e.action,
      detail:    `${e.fromState} → ${e.toState}${e.comment ? ` · ${e.comment}` : ''} · resource ${e.instance?.resourceId ?? ''}`,
    })),
    ...securityEvents.map(e => ({
      timestamp: e.timestamp,
      source:    'security',
      actor:     e.userId ?? 'anon',
      action:    e.type,
      detail:    `${e.description}${e.ipAddress ? ` · ip ${e.ipAddress}` : ''}`,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    data:     toCsv(
      ['Timestamp', 'Source', 'Actor', 'Action', 'Detail'],
      rows.map(r => [r.timestamp.toISOString(), r.source, r.actor, r.action, r.detail]),
    ),
    fileName: `audit-log-last-${days}d-${isoStamp()}.csv`,
    mimeType: 'text/csv',
  };
}

// ─── Registry ────────────────────────────────────────────────────────────────

export const REGISTRY: Record<ReportType, {
  label: string;
  description: string;
  category: string;
  generate: (ctx: GeneratorContext) => Promise<ReportResult>;
}> = {
  WORKFORCE_HEADCOUNT: {
    label:       'Workforce Headcount',
    description: 'All active and suspended employees with hub, department, role, status, and join date.',
    category:    'HR',
    generate:    workforceHeadcount,
  },
  LEAVE_BALANCE: {
    label:       'Leave Balance Summary',
    description: 'Per-employee quota / used / remaining for every active leave type. One row per employee × type for Excel pivot.',
    category:    'HR',
    generate:    leaveBalance,
  },
  AUDIT_LOG: {
    label:       'Audit & Governance Log',
    description: 'Workflow transitions and security events from the last N days, merged into one chronological feed.',
    category:    'Governance',
    generate:    auditLog,
  },
};

export function isReportType(value: unknown): value is ReportType {
  return typeof value === 'string' && value in REGISTRY;
}
