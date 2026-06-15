import { PrismaClient } from '@prisma/client';
import {
  submitExpenditure,
  transitionExpenditure,
  getExpenditure,
  ExpenditureError,
} from '../src/modules/finance/domain/expenditure.service';

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
  console.log('  Suler EMS — E2E Expenditure Workflow Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Resolve actors
  console.log('1. Resolving actor permissions and profiles from database...');
  const employee = await getActorDetails('employee@suler.com');
  const finance = await getActorDetails('finance@suler.com');

  console.log(`   - Requester (Employee): ${employee.name} (${employee.role}), employeeId: ${employee.employeeId}`);
  console.log(`   - Approver (Finance): ${finance.name} (${finance.role})`);
  console.log('');

  // Find the Port Harcourt budget (or any budget with available space)
  const budget = await prisma.budget.findFirstOrThrow({
    where: { name: 'Port Harcourt Logistics — Q3 2026' }
  });
  console.log(`Using Budget: ${budget.name}`);
  console.log(`   - Total: ₦${Number(budget.totalAmount).toLocaleString()}`);
  console.log(`   - Spent: ₦${Number(budget.spentAmount).toLocaleString()}`);
  console.log(`   - Remaining: ₦${(Number(budget.totalAmount) - Number(budget.spentAmount)).toLocaleString()}`);
  console.log('');

  // 2. Positive E2E workflow
  console.log('2. [POSITIVE FLOW] Submitting expenditure as employee...');
  const amount = 150000; // ₦150,000
  const expenditure = await submitExpenditure({
    budgetId: budget.id,
    amount,
    description: 'Purchase of office supplies for Port Harcourt logistics team (E2E Test)',
    actor: {
      id: employee.id,
      name: employee.name ?? 'Employee',
      role: employee.role,
      permissions: employee.permissions,
      employeeId: employee.employeeId ?? undefined
    }
  });

  console.log(`   ✓ Submitted! ID: ${expenditure.id}, Status: ${expenditure.status}`);
  console.log('');

  // Verify it is SUBMITTED
  let currentExp = await getExpenditure(expenditure.id, { includeHistory: true });
  console.log(`   Verification (Step 1): Status in Tracker is expected to be SUBMITTED`);
  console.log(`   - Status: ${currentExp.status}`);
  if (currentExp.status !== 'SUBMITTED') {
    throw new Error(`Expected SUBMITTED, but got ${currentExp.status}`);
  }
  console.log(`   ✓ Check Passed.`);
  console.log('');

  // Transition: Finance Approval
  console.log('   Transitioning: Finance Approval...');
  const approvedExp = await transitionExpenditure({
    expenditureId: expenditure.id,
    action: 'APPROVE_FINANCE',
    comment: 'Approved for disbursement. Budget allocated.',
    actor: {
      id: finance.id,
      name: finance.name ?? 'Finance Manager',
      role: finance.role,
      permissions: finance.permissions,
      employeeId: finance.employeeId ?? undefined
    }
  });
  console.log(`   ✓ Completed! New Status: ${approvedExp.status}`);
  console.log('');

  // Verify it is APPROVED
  currentExp = await getExpenditure(expenditure.id, { includeHistory: true });
  console.log(`   Verification (Step 2): Status expected to be APPROVED`);
  console.log(`   - Status: ${currentExp.status}`);
  if (currentExp.status !== 'APPROVED') {
    throw new Error(`Expected APPROVED, but got ${currentExp.status}`);
  }
  console.log(`   ✓ Check Passed.`);
  console.log('');

  // Transition: Disbursement
  console.log('   Transitioning: Disbursement...');
  const disbursedExp = await transitionExpenditure({
    expenditureId: expenditure.id,
    action: 'DISBURSE',
    comment: 'Disbursed via bank transfer.',
    paymentMethod: 'BANK_TRANSFER',
    actor: {
      id: finance.id,
      name: finance.name ?? 'Finance Manager',
      role: finance.role,
      permissions: finance.permissions,
      employeeId: finance.employeeId ?? undefined
    }
  });
  console.log(`   ✓ Completed! New Status: ${disbursedExp.status}`);
  console.log('');

  // Verify it is DISBURSED
  currentExp = await getExpenditure(expenditure.id, { includeHistory: true });
  console.log(`   Verification (Step 3): Final Status expected to be DISBURSED`);
  console.log(`   - Status: ${currentExp.status}`);
  if (currentExp.status !== 'DISBURSED') {
    throw new Error(`Expected DISBURSED, but got ${currentExp.status}`);
  }
  console.log(`   ✓ Check Passed.`);
  console.log('');

  // Verify budget spentAmount updated
  const updatedBudget = await prisma.budget.findUniqueOrThrow({ where: { id: budget.id } });
  const expectedSpent = Number(budget.spentAmount) + amount;
  console.log(`   Verification (Step 4): Budget spentAmount expected to be ₦${expectedSpent.toLocaleString()}`);
  console.log(`   - Current Spent: ₦${Number(updatedBudget.spentAmount).toLocaleString()}`);
  if (Number(updatedBudget.spentAmount) !== expectedSpent) {
    throw new Error(`Expected spentAmount to be ${expectedSpent}, but got ${updatedBudget.spentAmount}`);
  }
  console.log(`   ✓ Check Passed.`);
  console.log('');

  // Verify Audit Trail
  console.log('   Verifying full audit chain in database...');
  const auditEntries = await prisma.workflowAuditEntry.findMany({
    where: { instanceId: currentExp.workflowInstanceId! },
    orderBy: { timestamp: 'asc' }
  });

  console.log(`   - Found ${auditEntries.length} audit trail entries:`);
  auditEntries.forEach((entry, idx) => {
    console.log(`     [Entry ${idx + 1}] Action: ${entry.action} | ${entry.fromState} ➔ ${entry.toState} | Actor: ${entry.actorName} (${entry.actorRole})`);
  });

  if (auditEntries.length !== 3) {
    throw new Error(`Expected 3 audit trail entries, found ${auditEntries.length}`);
  }
  console.log(`   ✓ Audit Chain Verification Passed.`);
  console.log('');

  // 3. Negative E2E Workflow: Overspend
  console.log('3. [NEGATIVE FLOW 1: OVERSPEND] Submitting expenditure > remaining budget...');
  // Remaining budget on the Port Harcourt budget
  const phBudgetLive = await prisma.budget.findUniqueOrThrow({ where: { id: budget.id } });
  const phRemaining = Number(phBudgetLive.totalAmount) - Number(phBudgetLive.spentAmount);
  const overspendAmount = phRemaining + 50000; // ₦50,000 above remaining

  console.log(`   Remaining Budget: ₦${phRemaining.toLocaleString()}`);
  console.log(`   Attempting to spend: ₦${overspendAmount.toLocaleString()}`);

  const overExp = await submitExpenditure({
    budgetId: budget.id,
    amount: overspendAmount,
    description: 'Overspend expenditure (Negative Test)',
    actor: {
      id: employee.id,
      name: employee.name ?? 'Employee',
      role: employee.role,
      permissions: employee.permissions,
      employeeId: employee.employeeId ?? undefined
    }
  });

  console.log(`   ✓ Submitted! ID: ${overExp.id}, Status: ${overExp.status}`);

  // Finance Approval (should succeed, since check is on DISBURSE)
  await transitionExpenditure({
    expenditureId: overExp.id,
    action: 'APPROVE_FINANCE',
    comment: 'Approve overspent expenditure. Should fail during disbursement.',
    actor: {
      id: finance.id,
      name: finance.name ?? 'Finance Manager',
      role: finance.role,
      permissions: finance.permissions,
      employeeId: finance.employeeId ?? undefined
    }
  });
  console.log(`   ✓ Approved! Status: APPROVED`);

  // Disburse (should fail with BUDGET_EXCEEDED / 409)
  console.log('   Attempting disbursement (should fail)...');
  try {
    await transitionExpenditure({
      expenditureId: overExp.id,
      action: 'DISBURSE',
      comment: 'Disburse funds (should fail).',
      actor: {
        id: finance.id,
        name: finance.name ?? 'Finance Manager',
        role: finance.role,
        permissions: finance.permissions,
        employeeId: finance.employeeId ?? undefined
      }
    });
    throw new Error('Expected DISBURSE to fail with BUDGET_EXCEEDED, but it succeeded!');
  } catch (err) {
    if (err instanceof ExpenditureError) {
      console.log(`   ✓ Caught expected error: [${err.code}] ${err.message} (HTTP ${err.httpStatus})`);
      if (err.code !== 'BUDGET_EXCEEDED' || err.httpStatus !== 409) {
        throw new Error(`Expected BUDGET_EXCEEDED (409), but got ${err.code} (${err.httpStatus})`);
      }
    } else {
      throw err;
    }
  }
  console.log('');

  // 4. Negative E2E Workflow: Transition terminal status
  console.log('4. [NEGATIVE FLOW 2: INVALID STATE TRANSITION] Trying to transition DISBURSED expenditure...');
  console.log(`   Attempting to transition disbursed ID ${expenditure.id} to CANCELLED...`);
  try {
    await transitionExpenditure({
      expenditureId: expenditure.id,
      action: 'CANCEL',
      comment: 'Attempting to cancel disbursed funds.',
      actor: {
        id: employee.id,
        name: employee.name ?? 'Employee',
        role: employee.role,
        permissions: employee.permissions,
        employeeId: employee.employeeId ?? undefined
      }
    });
    throw new Error('Expected transition to fail with INVALID_STATE_TRANSITION, but it succeeded!');
  } catch (err) {
    if (err instanceof ExpenditureError) {
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
  console.log('  E2E Expenditure Workflow Test Complete & Verified!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => {
    console.error('\n❌ E2E Expenditure Workflow Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
