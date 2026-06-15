/**
 * Suler EMS — Database Verification Gate
 *
 * Runs after `prisma migrate dev` + `prisma db seed` to confirm the schema,
 * relations, and aggregates are sound before Phase 2 begins (and re-runnable
 * any time as a health check).
 *
 * Each check prints PASS / FAIL. Process exits 1 if any check fails so this
 * can serve as a CI gate later.
 *
 * Run with: `npm run db:verify`
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { LeaveWorkflow } from '../src/modules/workflow/definitions/leave.workflow';
import { ExpenditureWorkflow } from '../src/modules/workflow/definitions/expenditure.workflow';
import { PayrollRunWorkflow } from '../src/modules/workflow/definitions/payroll.workflow';

const prisma = new PrismaClient();

const failures: string[] = [];
const ALLOWED_LEAVE_STATES = new Set([
  'DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED',
]);

async function check(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✓  ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗  ${name}`);
    console.log(`        ${msg}`);
    failures.push(name);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function dec(v: Prisma.Decimal | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v.toString());
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Suler EMS — DB Verification Gate');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── Section 1: Topology counts ──────────────────────────────────────────
  console.log('▶ Topology');

  const [
    users, employees, departments, roles, permissions,
    leaveRequests, workflowInstances, auditEntries,
    payrollRuns, payrollEntries, salaryStructures,
    budgets, budgetCategories, expenditures,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.employee.count(),
    prisma.department.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.leaveRequest.count(),
    prisma.workflowInstance.count({ where: { workflowId: 'leave-workflow' } }),
    prisma.workflowAuditEntry.count(),
    prisma.payrollRun.count(),
    prisma.payrollEntry.count(),
    prisma.salaryStructure.count(),
    prisma.budget.count(),
    prisma.budgetCategory.count(),
    prisma.expenditure.count(),
  ]);

  console.table({
    users, employees, departments, roles, permissions,
    leaveRequests, workflowInstances, auditEntries,
    payrollRuns, payrollEntries, salaryStructures,
    budgets, budgetCategories, expenditures,
  });

  // ── Section 2: Integrity gate ───────────────────────────────────────────
  console.log('\n▶ Integrity Gate');

  await check('25 staff (Users + Employees)', async () => {
    assert(users === 25, `expected 25 users, got ${users}`);
    assert(employees === 25, `expected 25 employees, got ${employees}`);
  });

  await check('Every User links to a Role and an Employee', async () => {
    const orphanRole = await prisma.user.count({ where: { roleId: '' } });
    const orphanEmp = await prisma.user.count({ where: { employeeId: null } });
    assert(orphanRole === 0, `${orphanRole} users have empty roleId`);
    assert(orphanEmp === 0, `${orphanEmp} users have no employeeId`);
  });

  await check('Every Role has at least one Permission', async () => {
    const empty = await prisma.role.findMany({
      where: { permissions: { none: {} } },
      select: { name: true },
    });
    assert(empty.length === 0, `roles with no permissions: ${empty.map(r => r.name).join(', ')}`);
  });

  await check('Every workflow definition requiredRole resolves to a seeded Role.name (HR_ADMIN canonical rule)', async () => {
    const seededRoleNames = new Set((await prisma.role.findMany({ select: { name: true } })).map(r => r.name));
    const offenders: string[] = [];
    for (const wf of [LeaveWorkflow, ExpenditureWorkflow, PayrollRunWorkflow]) {
      for (const [action, t] of Object.entries(wf.transitions)) {
        const required = (t as any).requiredRole as string | undefined;
        if (!required) continue;
        if (!seededRoleNames.has(required)) {
          offenders.push(`${wf.id}.${action} → "${required}"`);
        }
      }
    }
    assert(offenders.length === 0,
      `unknown role(s): ${offenders.join(', ')} — use canonical names from seeded Role.name. See ARCHITECTURE.md §2.`);
  });

  await check('Every workflow requiredPermission is granted to the role that requiredRole names (payroll:edit coverage rule)', async () => {
    // For each transition with BOTH requiredRole + requiredPermission, the
    // role with that name must hold the permission. Catches the class of bug
    // that broke Phase 5 (FINANCE_MANAGER needed payroll:edit but seed
    // didn't grant it). SUPER_ADMIN bypass doesn't count — we want the
    // *named* role to be able to act.
    const roles = await prisma.role.findMany({ include: { permissions: { select: { code: true } } } });
    const permsByRoleName = new Map(roles.map(r => [r.name, new Set(r.permissions.map(p => p.code))]));
    const offenders: string[] = [];
    for (const wf of [LeaveWorkflow, ExpenditureWorkflow, PayrollRunWorkflow]) {
      for (const [action, t] of Object.entries(wf.transitions)) {
        const reqRole = (t as any).requiredRole as string | undefined;
        const reqPerm = (t as any).requiredPermission as string | undefined;
        if (!reqRole || !reqPerm) continue;
        const grants = permsByRoleName.get(reqRole);
        if (!grants || !grants.has(reqPerm)) {
          offenders.push(`${wf.id}.${action}: role ${reqRole} is missing ${reqPerm}`);
        }
      }
    }
    assert(offenders.length === 0,
      `coverage gaps: ${offenders.join(' | ')} — workflow demands a permission the role doesn't have.`);
  });

  await check('At least one active SUPER_ADMIN exists (Phase 6 invariant C4)', async () => {
    const count = await prisma.user.count({
      where: { isActive: true, role: { name: 'SUPER_ADMIN' } },
    });
    assert(count >= 1, `count(active SUPER_ADMIN) = ${count}, must be ≥ 1`);
  });

  await check('Every Employee has an active SalaryStructure', async () => {
    const missing = await prisma.employee.findMany({
      where: { salaryStructures: { none: { isActive: true } } },
      select: { staffId: true, email: true },
    });
    assert(missing.length === 0, `employees missing active salary: ${missing.map(m => m.staffId).join(', ')}`);
  });

  await check('No orphan LeaveRequest (forward: LeaveRequest → WorkflowInstance)', async () => {
    const orphans = await prisma.leaveRequest.count({ where: { workflowInstanceId: null } });
    assert(orphans === 0, `${orphans} leave requests with no workflow instance`);
  });

  await check('No orphan WorkflowInstance (reverse: leave-workflow → LeaveRequest)', async () => {
    const instances = await prisma.workflowInstance.findMany({
      where: { workflowId: 'leave-workflow' },
      select: { id: true, resourceId: true },
    });
    const linked = await prisma.leaveRequest.findMany({
      where: { workflowInstanceId: { in: instances.map(i => i.id) } },
      select: { workflowInstanceId: true },
    });
    const linkedSet = new Set(linked.map(l => l.workflowInstanceId));
    const orphans = instances.filter(i => !linkedSet.has(i.id));
    assert(orphans.length === 0,
      `${orphans.length} workflow instances with no leave request: ${orphans.map(o => o.id).slice(0, 3).join(', ')}`);
  });

  await check('Every WorkflowAuditEntry references a live WorkflowInstance', async () => {
    const entries = await prisma.workflowAuditEntry.findMany({ select: { id: true, instanceId: true } });
    const instanceIds = new Set(
      (await prisma.workflowInstance.findMany({ select: { id: true } })).map(i => i.id),
    );
    const orphans = entries.filter(e => !instanceIds.has(e.instanceId));
    assert(orphans.length === 0,
      `${orphans.length} audit entries reference missing workflow instances`);
  });

  await check('Every workflow state is in the allowed set', async () => {
    const rows = await prisma.workflowInstance.groupBy({
      by: ['currentState'],
      where: { workflowId: 'leave-workflow' },
      _count: true,
    });
    const invalid = rows.filter(r => !ALLOWED_LEAVE_STATES.has(r.currentState));
    assert(invalid.length === 0,
      `unexpected states: ${invalid.map(r => r.currentState).join(', ')}`);

    console.log('       State distribution:');
    rows.forEach(r => console.log(`         ${r.currentState.padEnd(20)} ${r._count}`));
  });

  await check('Audit entry counts are consistent with workflow states', async () => {
    // Submitted leaves should each have ≥ 1 audit entry.
    // Approved leaves should have ≥ 2 (submit + manager approve, ideally + HR finalize).
    // Rejected leaves should have ≥ 2 (submit + reject).
    const summary = await prisma.workflowInstance.findMany({
      where: { workflowId: 'leave-workflow' },
      select: { id: true, currentState: true, history: { select: { id: true } } },
    });
    const broken = summary.filter(s => {
      const n = s.history.length;
      if (s.currentState === 'DRAFT') return n !== 0;
      if (s.currentState === 'SUBMITTED') return n < 1;
      if (s.currentState === 'MANAGER_APPROVED') return n < 2;
      if (s.currentState === 'APPROVED') return n < 3;
      if (s.currentState === 'REJECTED') return n < 2;
      return false;
    });
    assert(broken.length === 0,
      `${broken.length} workflow(s) with inconsistent audit chain (state vs entry count)`);
  });

  await check('Budget.spentAmount = Σ(DISBURSED Expenditures)', async () => {
    const budgetRows = await prisma.budget.findMany({
      select: { id: true, name: true, spentAmount: true },
    });
    const mismatches: string[] = [];
    for (const b of budgetRows) {
      const sum = await prisma.expenditure.aggregate({
        where: { budgetId: b.id, status: 'DISBURSED' },
        _sum: { amount: true },
      });
      const recorded = dec(b.spentAmount);
      const actual = dec(sum._sum.amount);
      if (Math.abs(recorded - actual) > 0.01) {
        mismatches.push(`${b.name}: spentAmount=${recorded.toLocaleString()} vs Σdisbursed=${actual.toLocaleString()}`);
      }
    }
    assert(mismatches.length === 0, mismatches.join(' | '));
  });

  await check('BudgetCategory.spentAmount = Σ(DISBURSED Expenditures in that category)', async () => {
    const cats = await prisma.budgetCategory.findMany({
      select: { id: true, name: true, spentAmount: true },
    });
    const mismatches: string[] = [];
    for (const c of cats) {
      const sum = await prisma.expenditure.aggregate({
        where: { categoryId: c.id, status: 'DISBURSED' },
        _sum: { amount: true },
      });
      const recorded = dec(c.spentAmount);
      const actual = dec(sum._sum.amount);
      if (Math.abs(recorded - actual) > 0.01) {
        mismatches.push(`${c.name}: ${recorded} vs ${actual}`);
      }
    }
    assert(mismatches.length === 0, mismatches.join(' | '));
  });

  await check('PayrollEntry totals reconcile with PayrollRun totals', async () => {
    const runs = await prisma.payrollRun.findMany({
      include: { entries: { select: { grossPay: true, netPay: true, totalDeductions: true, pensionEmployer: true } } },
    });
    const mismatches: string[] = [];
    for (const r of runs) {
      const sumGross = r.entries.reduce((s, e) => s + dec(e.grossPay), 0);
      const sumNet = r.entries.reduce((s, e) => s + dec(e.netPay), 0);
      const sumDeductions = r.entries.reduce((s, e) => s + dec(e.totalDeductions), 0);
      const sumEmployerContrib = r.entries.reduce((s, e) => s + dec(e.pensionEmployer), 0);
      if (Math.abs(sumGross - dec(r.totalGross)) > 1) mismatches.push(`${r.name}: gross drift`);
      if (Math.abs(sumNet - dec(r.totalNet)) > 1) mismatches.push(`${r.name}: net drift`);
      if (Math.abs(sumDeductions - dec(r.totalDeductions)) > 1) mismatches.push(`${r.name}: deductions drift`);
      if (Math.abs(sumEmployerContrib - dec(r.totalEmployerContrib)) > 1) mismatches.push(`${r.name}: employer contrib drift`);
      if (r.entryCount !== r.entries.length) mismatches.push(`${r.name}: entryCount=${r.entryCount} vs actual=${r.entries.length}`);
    }
    assert(mismatches.length === 0, mismatches.join(' | '));
  });

  await check('Payroll sanity: gross ≥ net, no nulls, taxable income ≥ 0', async () => {
    const entries = await prisma.payrollEntry.findMany({
      select: { id: true, employeeId: true, grossPay: true, netPay: true, paye: true, totalDeductions: true },
    });
    const issues: string[] = [];
    for (const e of entries) {
      const gross = dec(e.grossPay);
      const net = dec(e.netPay);
      const paye = dec(e.paye);
      if (gross <= 0) issues.push(`entry ${e.id}: gross=${gross}`);
      if (net < 0) issues.push(`entry ${e.id}: negative net=${net}`);
      if (net > gross) issues.push(`entry ${e.id}: net > gross`);
      if (paye < 0) issues.push(`entry ${e.id}: negative PAYE`);
    }
    assert(issues.length === 0, issues.slice(0, 3).join(' | '));
  });

  // ── Section 3: Headline summaries ───────────────────────────────────────
  console.log('\n▶ Headline Summaries');

  const budgetSummary = await prisma.budget.findMany({
    select: { name: true, totalAmount: true, allocatedAmount: true, spentAmount: true, status: true },
    orderBy: { totalAmount: 'desc' },
  });
  console.log('\n  Budgets:');
  console.table(budgetSummary.map(b => ({
    name: b.name,
    status: b.status,
    total: dec(b.totalAmount).toLocaleString(),
    allocated: dec(b.allocatedAmount).toLocaleString(),
    spent: dec(b.spentAmount).toLocaleString(),
    remaining: (dec(b.totalAmount) - dec(b.spentAmount)).toLocaleString(),
  })));

  const expByStatus = await prisma.expenditure.groupBy({
    by: ['status'], _count: true, _sum: { amount: true },
  });
  console.log('  Expenditures by status:');
  console.table(expByStatus.map(e => ({
    status: e.status, count: e._count, total: dec(e._sum.amount).toLocaleString(),
  })));

  const runs = await prisma.payrollRun.findMany({
    select: { name: true, status: true, entryCount: true, totalGross: true, totalNet: true, totalDeductions: true },
  });
  console.log('  Payroll Runs:');
  console.table(runs.map(r => ({
    name: r.name, status: r.status, entries: r.entryCount,
    gross: dec(r.totalGross).toLocaleString(),
    net: dec(r.totalNet).toLocaleString(),
    deductions: dec(r.totalDeductions).toLocaleString(),
  })));

  // ── Verdict ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (failures.length === 0) {
    console.log('  ✅ ALL CHECKS PASSED — DB integrity confirmed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    console.log(`  ❌ ${failures.length} CHECK(S) FAILED:`);
    failures.forEach(f => console.log(`     • ${f}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

main()
  .catch(e => { console.error('\n[VERIFY ERROR]', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
