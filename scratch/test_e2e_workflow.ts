import { PrismaClient } from '@prisma/client';
import { submitLeave, transitionLeave, getLeaveRequest } from '../src/modules/leave/domain/leave.service';

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
  console.log('  Suler EMS — E2E Leave Approval Workflow Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Resolve actors
  console.log('1. Resolving actor permissions and profiles from database...');
  const employee = await getActorDetails('employee@suler.com');
  const manager = await getActorDetails('manager@suler.com');
  const hr = await getActorDetails('hr@suler.com');

  console.log(`   - Employee: ${employee.name} (${employee.role}), employeeId: ${employee.employeeId}`);
  console.log(`   - Manager: ${manager.name} (${manager.role})`);
  console.log(`   - HR: ${hr.name} (${hr.role})`);
  console.log('');

  // 2. Submit Leave Request as Employee
  console.log('2. Submitting leave request as employee...');
  const startDate = new Date('2026-06-25');
  const endDate = new Date('2026-06-30');
  
  if (!employee.employeeId) {
    throw new Error('Employee user has no employeeId link!');
  }

  const leaveRequest = await submitLeave({
    employeeId: employee.employeeId,
    type: 'ANNUAL',
    startDate,
    endDate,
    reason: 'Family summer vacation in Nigeria (E2E Test)',
    actor: {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      permissions: employee.permissions
    }
  });

  console.log(`   ✓ Submitted! ID: ${leaveRequest.id}, Status: ${leaveRequest.status}`);
  console.log('');

  // 3. Verify it is SUBMITTED
  let currentReq = await getLeaveRequest(leaveRequest.id, { includeHistory: true });
  console.log(`3. Verification (Step 1): Status in Tracker is expected to be SUBMITTED`);
  console.log(`   - Status: ${currentReq.status}`);
  if (currentReq.status !== 'SUBMITTED') {
    throw new Error(`Expected SUBMITTED, but got ${currentReq.status}`);
  }
  console.log(`   ✓ Check Passed.`);
  console.log('');

  // 4. Manager Approval
  console.log('4. Transitioning: Manager Approval...');
  const managerTransition = await transitionLeave({
    leaveRequestId: leaveRequest.id,
    action: 'APPROVE_MANAGER',
    comment: 'Approved by Lagos Operations Manager. Looks good.',
    actor: {
      id: manager.id,
      name: manager.name,
      role: manager.role,
      permissions: manager.permissions
    }
  });
  console.log(`   ✓ Completed! New Status: ${managerTransition.status}`);
  console.log('');

  // 5. Verify it is MANAGER_APPROVED
  currentReq = await getLeaveRequest(leaveRequest.id, { includeHistory: true });
  console.log(`5. Verification (Step 2): Status expected to be MANAGER_APPROVED`);
  console.log(`   - Status: ${currentReq.status}`);
  if (currentReq.status !== 'MANAGER_APPROVED') {
    throw new Error(`Expected MANAGER_APPROVED, but got ${currentReq.status}`);
  }
  console.log(`   ✓ Check Passed.`);
  console.log('');

  // 6. HR Approval
  console.log('6. Transitioning: HR Approval...');
  const hrTransition = await transitionLeave({
    leaveRequestId: leaveRequest.id,
    action: 'APPROVE_HR',
    comment: 'HR final sign-off. Compliance checked.',
    actor: {
      id: hr.id,
      name: hr.name,
      role: hr.role,
      permissions: hr.permissions
    }
  });
  console.log(`   ✓ Completed! New Status: ${hrTransition.status}`);
  console.log('');

  // 7. Verify it is APPROVED
  currentReq = await getLeaveRequest(leaveRequest.id, { includeHistory: true });
  console.log(`7. Verification (Step 3): Final Status expected to be APPROVED`);
  console.log(`   - Status: ${currentReq.status}`);
  if (currentReq.status !== 'APPROVED') {
    throw new Error(`Expected APPROVED, but got ${currentReq.status}`);
  }
  console.log(`   ✓ Check Passed.`);
  console.log('');

  // 8. Verify History and Audit Chain
  console.log('8. Verifying full audit chain in database...');
  const auditEntries = await prisma.workflowAuditEntry.findMany({
    where: { instanceId: currentReq.workflowInstanceId! },
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
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  E2E Workflow Test Successful! All checks passed.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => {
    console.error('\n❌ E2E Workflow Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
