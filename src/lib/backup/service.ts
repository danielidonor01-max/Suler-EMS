/**
 * Application-level backup service.
 *
 * Produces a single gzipped JSON manifest containing every row of the
 * structured data tables. Drops blob-heavy and audit-volume tables so
 * the manifest stays a manageable size:
 *
 *   Included     — structural + transactional records (org, leave,
 *                  payroll, finance, attendance, performance, profile
 *                  change requests, statutory rates, leave types)
 *   Excluded     — EmployeeDocument (BYTEA blobs, separate backup),
 *                  ReportJob (artifacts, regenerable), Backup itself
 *                  (recursive), Notification + SecurityEvent +
 *                  WorkflowAuditEntry (high-volume audit; export via
 *                  the audit log report instead)
 *
 * Sensitive fields are redacted in transit:
 *   - User.passwordHash → "[REDACTED]" (bcrypt hashes leak nothing
 *     useful, but no reason to ship them in a generic backup)
 *
 * Restore is NOT in scope for this module — that's an ops procedure
 * better served by Supabase PITR. The manifest is for off-site
 * archival + forensic analysis.
 */

import { gzipSync } from 'zlib';
import type { PrismaClient } from '@prisma/client';

const SCHEMA_VERSION = '1.0';

export interface BackupResult {
  data:           Buffer; // gzipped JSON
  uncompressedSize: number;
  rowCount:       number;
  tablesIncluded: string[];
}

/**
 * Each entry: a Prisma model name (camelCase, matches client) + the
 * read function. The read returns an array of rows. Most are just
 * findMany() with select/include where needed to bring nested refs.
 */
type Section = (prisma: PrismaClient) => Promise<{ table: string; rows: any[] }>;

const SECTIONS: Section[] = [
  async (p) => ({ table: 'Permission',           rows: await p.permission.findMany() }),
  async (p) => ({ table: 'Role',                 rows: await p.role.findMany({ include: { permissions: { select: { code: true } } } }) }),
  async (p) => ({ table: 'StatutoryRate',        rows: await p.statutoryRate.findMany() }),

  async (p) => ({ table: 'Hub',                  rows: await p.hub.findMany() }),
  async (p) => ({ table: 'Department',           rows: await p.department.findMany() }),
  async (p) => ({ table: 'Team',                 rows: await p.team.findMany() }),
  async (p) => ({ table: 'TeamMembership',       rows: await p.teamMembership.findMany() }),

  async (p) => {
    // User: redact the bcrypt hash before serialization.
    const users = await p.user.findMany();
    return {
      table: 'User',
      rows: users.map(u => ({ ...u, passwordHash: '[REDACTED]' })),
    };
  },

  async (p) => ({ table: 'Employee',             rows: await p.employee.findMany() }),

  async (p) => ({ table: 'LeaveType',            rows: await p.leaveType.findMany() }),
  async (p) => ({ table: 'LeaveRequest',         rows: await p.leaveRequest.findMany() }),
  async (p) => ({ table: 'WorkflowInstance',     rows: await p.workflowInstance.findMany() }),

  async (p) => ({ table: 'AttendanceRecord',     rows: await p.attendanceRecord.findMany() }),
  async (p) => ({ table: 'AttendanceReconciliation', rows: await p.attendanceReconciliation.findMany() }),

  async (p) => ({ table: 'SalaryStructure',      rows: await p.salaryStructure.findMany() }),
  async (p) => ({ table: 'PayrollRun',           rows: await p.payrollRun.findMany() }),
  async (p) => ({ table: 'PayrollEntry',         rows: await p.payrollEntry.findMany() }),
  async (p) => ({ table: 'PayrollAdjustment',    rows: await p.payrollAdjustment.findMany() }),

  async (p) => ({ table: 'BudgetCategory',       rows: await p.budgetCategory.findMany() }),
  async (p) => ({ table: 'Budget',               rows: await p.budget.findMany() }),
  async (p) => ({ table: 'Expenditure',          rows: await p.expenditure.findMany() }),

  async (p) => ({ table: 'ProfileChangeRequest', rows: await p.profileChangeRequest.findMany() }),
  async (p) => ({ table: 'PerformanceGoal',      rows: await p.performanceGoal.findMany() }),
];

export async function generateBackup(prisma: PrismaClient): Promise<BackupResult> {
  const tables: Record<string, any[]> = {};
  const tablesIncluded: string[] = [];
  let rowCount = 0;

  for (const section of SECTIONS) {
    const { table, rows } = await section(prisma);
    tables[table] = rows;
    tablesIncluded.push(table);
    rowCount += rows.length;
  }

  const manifest = {
    metadata: {
      generatedAt:    new Date().toISOString(),
      schemaVersion:  SCHEMA_VERSION,
      tablesIncluded,
      rowCount,
      note: 'User.passwordHash is redacted. Documents, notifications, security events, and workflow audit entries are not included.',
    },
    tables,
  };

  // JSON.stringify with Date objects: ISO strings (default behaviour),
  // BigInt: throws — Prisma Decimal columns come back as Decimal objects
  // that serialize to strings via toJSON(), which is fine for us.
  const json = JSON.stringify(manifest, (_key, value) => {
    if (typeof value === 'bigint') return value.toString();
    return value;
  });

  const uncompressedSize = Buffer.byteLength(json, 'utf8');
  const data = gzipSync(json, { level: 9 });

  return { data, uncompressedSize, rowCount, tablesIncluded };
}
