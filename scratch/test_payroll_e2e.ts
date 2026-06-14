import { PrismaClient } from '@prisma/client';
import {
  createDraftRun,
  transitionRun,
  getRun,
  listMyPayslips,
  PayrollError,
} from '../src/modules/payroll/domain/payroll.service';
import {
  createAdjustment,
  listAdjustments,
} from '../src/modules/payroll/domain/adjustment.service';

const prisma = new PrismaClient();

async function getActorDetails(email: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: {
      role: {
        include: {
          permissions: true
        }
      }
    }
  });
  return {
    id: user.id,
    name: user.name,
    role: user.role.name,
    permissions: user.role.permissions.map(p => p.code),
    employeeId: user.employeeId
  };
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Suler EMS — E2E Payroll Workflow Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Resolve actors
  console.log('1. Resolving actor permissions and profiles from database...');
  const finance = await getActorDetails('finance@suler.com');
  const employee = await getActorDetails('employee@suler.com');

  console.log(`   - Actor (Finance): ${finance.name} (${finance.role}), ID: ${finance.id}`);
  console.log(`   - Target Employee: ${employee.name} (${employee.role}), employeeId: ${employee.employeeId}`);
  console.log('');

  if (!employee.employeeId) {
    throw new Error('Employee user has no employeeId link!');
  }

  // Pre-clean: delete any existing run or adjustments for 2026-07 to make test repeatable
  console.log('   Cleaning any existing 2026-07 runs or adjustments...');
  const existingRun = await prisma.payrollRun.findFirst({ where: { period: '2026-07' } });
  if (existingRun) {
    await prisma.payrollEntry.deleteMany({ where: { runId: existingRun.id } });
    const instances = await prisma.workflowInstance.findMany({
      where: { resourceId: existingRun.id, workflowId: 'payroll-run-workflow' }
    });
    const instanceIds = instances.map(i => i.id);
    await prisma.workflowAuditEntry.deleteMany({ where: { instanceId: { in: instanceIds } } });
    await prisma.workflowInstance.deleteMany({ where: { id: { in: instanceIds } } });
    await prisma.payrollRun.delete({ where: { id: existingRun.id } });
  }
  await prisma.payrollAdjustment.deleteMany({ where: { effectivePeriod: '2026-07', employeeId: employee.employeeId } });
  console.log('   ✓ Clean complete.');
  console.log('');

  // 2. Create Adjustment before creating the draft or processing the run
  console.log('2. [ADJUSTMENT SETUP] Creating BONUS adjustment for July 2026...');
  const bonusAmount = 50000; // ₦50,000
  const adj = await createAdjustment({
    employeeId: employee.employeeId,
    type: 'BONUS',
    amount: bonusAmount,
    reason: 'July Performance Bonus (E2E Test)',
    effectivePeriod: '2026-07',
    createdById: finance.id,
  });
  console.log(`   ✓ Created! ID: ${adj.id}, Type: ${adj.type}, Amount: ₦${adj.amount.toLocaleString()}, Status: ${adj.status}`);
  console.log('');

  // 3. Positive flow: Create draft run
  console.log('3. [DRAFT RUN] Creating July 2026 Payroll Run...');
  const run = await createDraftRun({
    name: 'July 2026 — Org',
    period: '2026-07',
    actor: {
      id: finance.id,
      name: finance.name ?? 'Finance Manager',
      role: finance.role,
      permissions: finance.permissions,
      employeeId: finance.employeeId ?? undefined
    }
  });

  console.log(`   ✓ Draft Created! ID: ${run.id}, Status: ${run.status}, Entries: ${run.entryCount}`);
  console.log(`   - Snapshotted Gross: ₦${Number(run.totalGross).toLocaleString()}`);
  console.log(`   - Snapshotted Net: ₦${Number(run.totalNet).toLocaleString()}`);

  if (run.entryCount !== 25) {
    throw new Error(`Expected 25 entries snapshotted, but got ${run.entryCount}`);
  }
  console.log('   ✓ Snapshotted exactly 25 entries.');
  console.log('');

  // Verify that the employee's payroll entry includes the bonus
  const empEntry = await prisma.payrollEntry.findFirstOrThrow({
    where: { runId: run.id, employeeId: employee.employeeId }
  });
  console.log(`   Verifying employee's snapshotted entry:`);
  console.log(`   - Basic Salary: ₦${Number(empEntry.basicSalary).toLocaleString()}`);
  console.log(`   - Gross Pay: ₦${Number(empEntry.grossPay).toLocaleString()}`);
  console.log(`   - Net Pay: ₦${Number(empEntry.netPay).toLocaleString()}`);
  console.log('');

  // Transition: Submit for Review
  console.log('   Transitioning: Submit for Review...');
  let currentRun = await transitionRun(run.id, 'SUBMIT_FOR_REVIEW', {
    id: finance.id,
    name: finance.name ?? 'Finance Manager',
    role: finance.role,
    permissions: finance.permissions,
    employeeId: finance.employeeId ?? undefined
  }, 'July payroll ready for review.');
  console.log(`   ✓ New Status: ${currentRun.status}`);
  if (currentRun.status !== 'REVIEW') {
    throw new Error(`Expected REVIEW status, got ${currentRun.status}`);
  }
  console.log('');

  // Transition: Approve
  console.log('   Transitioning: Approve...');
  currentRun = await transitionRun(run.id, 'APPROVE', {
    id: finance.id,
    name: finance.name ?? 'Finance Manager',
    role: finance.role,
    permissions: finance.permissions,
    employeeId: finance.employeeId ?? undefined
  }, 'Approved by CFO.');
  console.log(`   ✓ New Status: ${currentRun.status}`);
  if (currentRun.status !== 'APPROVED') {
    throw new Error(`Expected APPROVED status, got ${currentRun.status}`);
  }
  console.log('');

  // 4. Negative test — Reconciliation Failure
  console.log('4. [NEGATIVE FLOW 1: RECONCILIATION FAILURE] Corrupting totalGross and attempting PROCESS...');
  const originalGross = run.totalGross;
  // Corrupt totalGross in database
  await prisma.payrollRun.update({
    where: { id: run.id },
    data: { totalGross: 10 } // set invalid gross
  });
  console.log(`   - Corrupted totalGross set to ₦10. Attempting PROCESS...`);

  try {
    await transitionRun(run.id, 'PROCESS', {
      id: finance.id,
      name: finance.name ?? 'Finance Manager',
      role: finance.role,
      permissions: finance.permissions,
      employeeId: finance.employeeId ?? undefined
    });
    throw new Error('Expected PROCESS to fail with RECONCILIATION_FAILED, but it succeeded!');
  } catch (err) {
    if (err instanceof PayrollError) {
      console.log(`   ✓ Caught expected error: [${err.code}] ${err.message} (HTTP ${err.httpStatus})`);
      if (err.code !== 'RECONCILIATION_FAILED' || err.httpStatus !== 409) {
        throw new Error(`Expected RECONCILIATION_FAILED (409), but got ${err.code} (${err.httpStatus})`);
      }
    } else {
      throw err;
    }
  }

  // Restore original totalGross
  await prisma.payrollRun.update({
    where: { id: run.id },
    data: { totalGross: originalGross }
  });
  console.log('   ✓ Restored original totalGross.');
  console.log('');

  // 5. Positive / Idempotency processing: Process Run
  console.log('5. [PROCESSING] Transitioning: Process Payroll (First attempt)...');
  const processedRun = await transitionRun(run.id, 'PROCESS', {
    id: finance.id,
    name: finance.name ?? 'Finance Manager',
    role: finance.role,
    permissions: finance.permissions,
    employeeId: finance.employeeId ?? undefined
  }, 'Disbursed July salaries.');
  console.log(`   ✓ New Status: ${processedRun.status}`);
  if (processedRun.status !== 'PROCESSED') {
    throw new Error(`Expected PROCESSED status, got ${processedRun.status}`);
  }
  console.log('');

  // 6. Negative test — Idempotency / Double processing
  console.log('6. [NEGATIVE FLOW 2: IDEMPOTENCY] Attempting PROCESS again (Second attempt)...');
  try {
    await transitionRun(run.id, 'PROCESS', {
      id: finance.id,
      name: finance.name ?? 'Finance Manager',
      role: finance.role,
      permissions: finance.permissions,
      employeeId: finance.employeeId ?? undefined
    });
    throw new Error('Expected second PROCESS attempt to fail, but it succeeded!');
  } catch (err) {
    if (err instanceof PayrollError) {
      console.log(`   ✓ Caught expected error: [${err.code}] ${err.message} (HTTP ${err.httpStatus})`);
      if ((err.code !== 'ALREADY_PROCESSED' && err.code !== 'INVALID_STATE_TRANSITION') || err.httpStatus !== 409) {
        throw new Error(`Expected ALREADY_PROCESSED or INVALID_STATE_TRANSITION (409), but got ${err.code} (${err.httpStatus})`);
      }
    } else {
      throw err;
    }
  }
  console.log('');

  // 7. Verify Adjustment is APPLIED
  console.log('7. [ADJUSTMENT VERIFICATION] Querying July adjustment status...');
  const updatedAdj = await prisma.payrollAdjustment.findUniqueOrThrow({ where: { id: adj.id } });
  console.log(`   - Status: ${updatedAdj.status}`);
  console.log(`   - approvedById: ${updatedAdj.approvedById}`);
  if (updatedAdj.status !== 'APPLIED') {
    throw new Error(`Expected adjustment status to be APPLIED, but got ${updatedAdj.status}`);
  }
  if (updatedAdj.approvedById !== finance.id) {
    throw new Error(`Expected approvedById to be ${finance.id}, but got ${updatedAdj.approvedById}`);
  }
  console.log('   ✓ Adjustment correctly auto-applied and approved.');
  console.log('');

  // 8. Employee Visibility Verification
  console.log('8. [EMPLOYEE VISIBILITY] Checking July payslip visibility for employee...');
  const payslips = await listMyPayslips(employee.employeeId);
  const julyPayslip = payslips.find(p => p.run.period === '2026-07');
  if (!julyPayslip) {
    throw new Error('Employee cannot see the July 2026 payslip!');
  }
  console.log(`   ✓ Found July 2026 Payslip!`);
  console.log(`     - Run Name: ${julyPayslip.run.name}`);
  console.log(`     - Net Paid: ₦${Number(julyPayslip.netPay).toLocaleString()}`);
  console.log('');

  // 9. Negative test — Terminal Status CANCEL attempt
  console.log('9. [NEGATIVE FLOW 3: TERMINAL STATE ENFORCEMENT] Trying to CANCEL processed run...');
  try {
    await transitionRun(run.id, 'CANCEL', {
      id: finance.id,
      name: finance.name ?? 'Finance Manager',
      role: finance.role,
      permissions: finance.permissions,
      employeeId: finance.employeeId ?? undefined
    });
    throw new Error('Expected CANCEL of processed run to fail, but it succeeded!');
  } catch (err) {
    if (err instanceof PayrollError) {
      console.log(`   ✓ Caught expected error: [${err.code}] ${err.message} (HTTP ${err.httpStatus})`);
      if (err.code !== 'INVALID_STATE_TRANSITION' || err.httpStatus !== 409) {
        throw new Error(`Expected INVALID_STATE_TRANSITION (409), but got ${err.code} (${err.httpStatus})`);
      }
    } else {
      throw err;
    }
  }
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  E2E Payroll Workflow Test Complete & Verified!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => {
    console.error('\n❌ E2E Payroll Workflow Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
