import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Permission Codes ────────────────────────────────────────────────────────
const ALL_PERMISSIONS = [
  { code: 'workforce:view',   name: 'View Workforce' },
  { code: 'workforce:create', name: 'Create Workforce Member' },
  { code: 'workforce:edit',   name: 'Edit Workforce Member' },
  { code: 'workforce:delete', name: 'Suspend Workforce Member' },
  { code: 'workforce:promote',name: 'Promote Workforce Member' },
  { code: 'hub:manage',       name: 'Manage Operational Hubs' },
  { code: 'dept:manage',      name: 'Manage Departments' },
  { code: 'org:edit',         name: 'Edit Org Chart' },
  { code: 'leave:view',       name: 'View Leave Requests' },
  { code: 'leave:submit',     name: 'Submit Leave Requests' },
  { code: 'leave:approve',    name: 'Approve Leave Requests' },
  { code: 'attendance:view',  name: 'View Attendance' },
  { code: 'attendance:manage',name: 'Manage Attendance' },
  { code: 'payroll:view',     name: 'View Payroll' },
  { code: 'payroll:edit',     name: 'Edit Payroll' },
  { code: 'payroll:approve',  name: 'Approve Payroll' },
  { code: 'payroll:process',  name: 'Process Payroll Run' },
  { code: 'finance:view',     name: 'View Finance' },
  { code: 'finance:allocate', name: 'Allocate Finance Budget' },
  { code: 'finance:approve',  name: 'Approve Finance Transactions' },
  { code: 'finance:disburse', name: 'Disburse Funds' },
  { code: 'audit:view',       name: 'View Audit Logs' },
  { code: 'role:manage',      name: 'Manage Roles' },
  { code: 'command:view',     name: 'View Command Center' },
  { code: 'security:manage',  name: 'Manage Security' },
  { code: 'data:export',      name: 'Export Data' },
  { code: 'data:manage',      name: 'Manage Data' },
  { code: 'data:backup',      name: 'Backup Data' },
  { code: 'data:restore',     name: 'Restore Data' },
  { code: 'settings:manage',  name: 'Manage Settings' },
  { code: 'reports:generate', name: 'Generate Reports' },
  { code: 'analytics:view',   name: 'View Analytics' },
  { code: 'strategy:simulate',name: 'Run Strategy Simulations' },
];

// ─── Role → Permission Mapping ────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map(p => p.code), // All permissions
  HR_ADMIN: [
    'workforce:view', 'workforce:create', 'workforce:edit',
    'leave:view', 'leave:approve',
    'attendance:view',
    'payroll:view',
    'audit:view',
    'analytics:view',
  ],
  FINANCE_MANAGER: [
    'payroll:view', 'payroll:approve', 'payroll:process',
    'finance:view', 'finance:allocate', 'finance:approve', 'finance:disburse',
    'audit:view',
    'analytics:view',
    'reports:generate',
    'data:export',
  ],
  MANAGER: [
    'workforce:view',
    'leave:view', 'leave:submit',
    'attendance:view',
    'analytics:view',
    'reports:generate',
  ],
  EMPLOYEE: [
    'leave:view', 'leave:submit',
    'attendance:view',
    'workforce:view',
  ],
};

// ─── UAT Seed Accounts ────────────────────────────────────────────────────────
const SEED_USERS = [
  {
    name: 'Super Admin',
    email: 'admin@suler.com',
    password: 'Admin123!',
    role: 'SUPER_ADMIN',
    staffId: 'SUL-ADMIN-001',
    jobTitle: 'Chief Executive Administrator',
    branch: 'Lagos',
  },
  {
    name: 'HR Administrator',
    email: 'hr@suler.com',
    password: 'Admin123!',
    role: 'HR_ADMIN',
    staffId: 'SUL-HR-001',
    jobTitle: 'Head of Human Resources',
    branch: 'Lagos',
  },
  {
    name: 'Finance Manager',
    email: 'finance@suler.com',
    password: 'Admin123!',
    role: 'FINANCE_MANAGER',
    staffId: 'SUL-FIN-001',
    jobTitle: 'Chief Financial Officer',
    branch: 'Abuja',
  },
  {
    name: 'Operations Manager',
    email: 'manager@suler.com',
    password: 'Admin123!',
    role: 'MANAGER',
    staffId: 'SUL-MGR-001',
    jobTitle: 'Operations Manager',
    branch: 'Port Harcourt',
  },
  {
    name: 'Staff Employee',
    email: 'employee@suler.com',
    password: 'Admin123!',
    role: 'EMPLOYEE',
    staffId: 'SUL-EMP-001',
    jobTitle: 'Staff Practitioner',
    branch: 'Lagos',
  },
];

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Suler EMS — Identity Lifecycle Seed v2.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── Step 1: Departments ──────────────────────────────────────────────────────
  const lagosHq = await prisma.department.upsert({
    where: { code: 'LAG-HQ' },
    update: { name: 'Lagos Headquarters' },
    create: { name: 'Lagos Headquarters', code: 'LAG-HQ' },
  });
  const abujaOps = await prisma.department.upsert({
    where: { code: 'ABJ-OPS' },
    update: { name: 'Abuja Operations' },
    create: { name: 'Abuja Operations', code: 'ABJ-OPS' },
  });
  const phcLog = await prisma.department.upsert({
    where: { code: 'PHC-LOG' },
    update: { name: 'Port Harcourt Logistics' },
    create: { name: 'Port Harcourt Logistics', code: 'PHC-LOG' },
  });
  const deptMap: Record<string, typeof lagosHq> = {
    Lagos: lagosHq,
    Abuja: abujaOps,
    'Port Harcourt': phcLog,
  };
  console.log('✓ Departments seeded: Lagos HQ, Abuja Ops, Port Harcourt Logistics');

  // ── Step 2: Permissions ──────────────────────────────────────────────────────
  const permMap: Record<string, { id: string }> = {};
  for (const perm of ALL_PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name },
      create: { code: perm.code, name: perm.name },
    });
    permMap[perm.code] = p;
  }
  console.log(`✓ Permissions seeded: ${ALL_PERMISSIONS.length} permissions`);

  // ── Step 3: Roles ────────────────────────────────────────────────────────────
  const roleMap: Record<string, { id: string }> = {};
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        permissions: { set: permCodes.map(code => ({ id: permMap[code].id })) },
      },
      create: {
        name: roleName,
        description: `${roleName} — system-managed role`,
        permissions: { connect: permCodes.map(code => ({ id: permMap[code].id })) },
      },
    });
    roleMap[roleName] = role;
  }
  console.log(`✓ Roles seeded: ${Object.keys(ROLE_PERMISSIONS).join(', ')}`);

  // ── Step 4: Employees + Users ─────────────────────────────────────────────
  for (const account of SEED_USERS) {
    const dept = deptMap[account.branch] || lagosHq;
    const role = roleMap[account.role];
    const passwordHash = await bcrypt.hash(account.password, 12);
    const [firstName, ...rest] = account.name.split(' ');
    const lastName = rest.join(' ') || firstName;

    // Create Employee record
    const employee = await prisma.employee.upsert({
      where: { email: account.email },
      update: {
        jobTitle: account.jobTitle,
        branch: account.branch,
        departmentId: dept.id,
        status: 'ACTIVE',
      },
      create: {
        staffId: account.staffId,
        firstName,
        lastName,
        email: account.email,
        jobTitle: account.jobTitle,
        branch: account.branch,
        departmentId: dept.id,
        status: 'ACTIVE',
      },
    });

    // Create User auth record linked to Employee
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        passwordHash,
        roleId: role.id,
        employeeId: employee.id,
        isActive: true,
      },
      create: {
        email: account.email,
        name: account.name,
        passwordHash,
        roleId: role.id,
        employeeId: employee.id,
        isActive: true,
      },
    });

    // Audit: provision event
    await prisma.securityEvent.create({
      data: {
        type: 'LOGIN_SUCCESS',
        description: `[SEED] Account provisioned for ${account.name} with role ${account.role}`,
        metadata: { email: account.email, role: account.role, seedVersion: '2.0' },
      },
    });

    console.log(`  ✓ ${account.role.padEnd(16)} ${account.email}  /  ${account.password}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Identity Lifecycle Seed Complete ✓');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
