/**
 * Suler EMS — Demo Organization Seed v3.0
 *
 * Builds a realistic 25-user organization across 3 departments with:
 *   - Roles + 33 permissions (role-permission map)
 *   - Salary structures for every employee
 *   - One active multi-category Budget per department + org-wide
 *   - 15 expenditures spread across statuses
 *   - 10 leave requests + matching workflow instances + audit entries
 *   - 1 fully processed payroll run for the previous month
 *
 * Idempotent: safe to re-run. Uses upsert on unique keys; resource entities
 * with no natural key are wiped + recreated to avoid duplicate test data.
 *
 * Run with: `npm run db:seed`
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { computePayroll } from '../src/modules/payroll/domain/calculations';
import { DEFAULT_NG_RATES } from '../src/modules/payroll/domain/types';

const prisma = new PrismaClient();

// ─── Permissions ─────────────────────────────────────────────────────────────
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

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map(p => p.code),
  HR_ADMIN: [
    'workforce:view', 'workforce:create', 'workforce:edit',
    'leave:view', 'leave:approve',
    'attendance:view', 'attendance:manage',
    'payroll:view',
    'audit:view',
    'analytics:view',
    'reports:generate',
  ],
  FINANCE_MANAGER: [
    'payroll:view', 'payroll:edit', 'payroll:approve', 'payroll:process',
    'finance:view', 'finance:allocate', 'finance:approve', 'finance:disburse',
    'audit:view',
    'analytics:view',
    'reports:generate',
    'data:export',
  ],
  MANAGER: [
    'workforce:view',
    'leave:view', 'leave:submit', 'leave:approve',
    'attendance:view',
    'analytics:view',
    'reports:generate',
    'finance:view',
  ],
  EMPLOYEE: [
    'leave:view', 'leave:submit',
    'attendance:view',
    'workforce:view',
    'finance:view',
  ],
};

// ─── 25-User Demo Organization ───────────────────────────────────────────────
// 1 Super Admin + 2 HR + 3 Managers + 3 Finance + 16 Employees = 25

interface SeedUser {
  staffId: string;
  name: string;
  email: string;
  role: keyof typeof ROLE_PERMISSIONS;
  jobTitle: string;
  branch: 'Lagos' | 'Abuja' | 'Port Harcourt';
  basicSalary: number;
  housing: number;
  transport: number;
}

const STAFF: SeedUser[] = [
  // — Executive —
  { staffId: 'SUL-ADMIN-001', name: 'Olumide Adeyemi',    email: 'admin@suler.com',    role: 'SUPER_ADMIN',     jobTitle: 'Chief Executive Administrator', branch: 'Lagos',         basicSalary: 850_000, housing: 200_000, transport: 100_000 },

  // — HR —
  { staffId: 'SUL-HR-001',    name: 'Chiamaka Obi',        email: 'hr@suler.com',       role: 'HR_ADMIN',        jobTitle: 'Head of Human Resources',       branch: 'Lagos',         basicSalary: 520_000, housing: 130_000, transport: 70_000 },
  { staffId: 'SUL-HR-002',    name: 'Folake Bankole',      email: 'hr2@suler.com',      role: 'HR_ADMIN',        jobTitle: 'HR Business Partner',           branch: 'Lagos',         basicSalary: 380_000, housing: 95_000,  transport: 50_000 },

  // — Managers —
  { staffId: 'SUL-MGR-001',   name: 'Ibrahim Yusuf',       email: 'manager@suler.com',  role: 'MANAGER',         jobTitle: 'Lagos Operations Manager',      branch: 'Lagos',         basicSalary: 480_000, housing: 120_000, transport: 65_000 },
  { staffId: 'SUL-MGR-002',   name: 'Aisha Mohammed',      email: 'manager2@suler.com', role: 'MANAGER',         jobTitle: 'Abuja Operations Manager',      branch: 'Abuja',         basicSalary: 470_000, housing: 117_000, transport: 63_000 },
  { staffId: 'SUL-MGR-003',   name: 'Tunde Bakare',        email: 'manager3@suler.com', role: 'MANAGER',         jobTitle: 'Port Harcourt Logistics Lead',  branch: 'Port Harcourt', basicSalary: 460_000, housing: 115_000, transport: 60_000 },

  // — Finance —
  { staffId: 'SUL-FIN-001',   name: 'Adaeze Nnamdi',       email: 'finance@suler.com',  role: 'FINANCE_MANAGER', jobTitle: 'Chief Financial Officer',       branch: 'Abuja',         basicSalary: 620_000, housing: 155_000, transport: 80_000 },
  { staffId: 'SUL-FIN-002',   name: 'Emeka Okafor',        email: 'finance2@suler.com', role: 'FINANCE_MANAGER', jobTitle: 'Treasury & Disbursement Lead',  branch: 'Abuja',         basicSalary: 410_000, housing: 100_000, transport: 55_000 },
  { staffId: 'SUL-FIN-003',   name: 'Yetunde Salami',      email: 'finance3@suler.com', role: 'FINANCE_MANAGER', jobTitle: 'Accounts Payable Officer',      branch: 'Lagos',         basicSalary: 340_000, housing: 85_000,  transport: 45_000 },

  // — Employees (16) —
  { staffId: 'SUL-EMP-001',   name: 'Kemi Adekunle',       email: 'employee@suler.com', role: 'EMPLOYEE',        jobTitle: 'Senior Engineer',               branch: 'Lagos',         basicSalary: 360_000, housing: 90_000,  transport: 50_000 },
  { staffId: 'SUL-EMP-002',   name: 'Bola Akinwale',       email: 'bola@suler.com',     role: 'EMPLOYEE',        jobTitle: 'Engineer',                      branch: 'Lagos',         basicSalary: 280_000, housing: 70_000,  transport: 40_000 },
  { staffId: 'SUL-EMP-003',   name: 'Chinedu Eze',         email: 'chinedu@suler.com',  role: 'EMPLOYEE',        jobTitle: 'Junior Engineer',               branch: 'Lagos',         basicSalary: 210_000, housing: 52_500,  transport: 30_000 },
  { staffId: 'SUL-EMP-004',   name: 'Ngozi Okoro',         email: 'ngozi@suler.com',    role: 'EMPLOYEE',        jobTitle: 'Product Designer',              branch: 'Lagos',         basicSalary: 320_000, housing: 80_000,  transport: 45_000 },
  { staffId: 'SUL-EMP-005',   name: 'Yusuf Garba',         email: 'yusuf@suler.com',    role: 'EMPLOYEE',        jobTitle: 'Operations Analyst',            branch: 'Lagos',         basicSalary: 240_000, housing: 60_000,  transport: 35_000 },
  { staffId: 'SUL-EMP-006',   name: 'Hauwa Bello',         email: 'hauwa@suler.com',    role: 'EMPLOYEE',        jobTitle: 'Compliance Officer',            branch: 'Abuja',         basicSalary: 290_000, housing: 72_500,  transport: 42_000 },
  { staffId: 'SUL-EMP-007',   name: 'Sani Abubakar',       email: 'sani@suler.com',     role: 'EMPLOYEE',        jobTitle: 'Field Coordinator',             branch: 'Abuja',         basicSalary: 220_000, housing: 55_000,  transport: 32_000 },
  { staffId: 'SUL-EMP-008',   name: 'Maryam Idris',        email: 'maryam@suler.com',   role: 'EMPLOYEE',        jobTitle: 'Procurement Specialist',        branch: 'Abuja',         basicSalary: 260_000, housing: 65_000,  transport: 38_000 },
  { staffId: 'SUL-EMP-009',   name: 'Aliyu Bello',         email: 'aliyu@suler.com',    role: 'EMPLOYEE',        jobTitle: 'Admin Officer',                 branch: 'Abuja',         basicSalary: 200_000, housing: 50_000,  transport: 28_000 },
  { staffId: 'SUL-EMP-010',   name: 'Zainab Lawal',        email: 'zainab@suler.com',   role: 'EMPLOYEE',        jobTitle: 'Communications Officer',        branch: 'Abuja',         basicSalary: 230_000, housing: 57_500,  transport: 33_000 },
  { staffId: 'SUL-EMP-011',   name: 'Obinna Uche',         email: 'obinna@suler.com',   role: 'EMPLOYEE',        jobTitle: 'Logistics Officer',             branch: 'Port Harcourt', basicSalary: 250_000, housing: 62_500,  transport: 36_000 },
  { staffId: 'SUL-EMP-012',   name: 'Chioma Nwosu',        email: 'chioma@suler.com',   role: 'EMPLOYEE',        jobTitle: 'Warehouse Supervisor',          branch: 'Port Harcourt', basicSalary: 280_000, housing: 70_000,  transport: 40_000 },
  { staffId: 'SUL-EMP-013',   name: 'Tobi Olawale',        email: 'tobi@suler.com',     role: 'EMPLOYEE',        jobTitle: 'Driver Lead',                   branch: 'Port Harcourt', basicSalary: 180_000, housing: 45_000,  transport: 25_000 },
  { staffId: 'SUL-EMP-014',   name: 'Funmi Adesina',       email: 'funmi@suler.com',    role: 'EMPLOYEE',        jobTitle: 'Inventory Analyst',             branch: 'Port Harcourt', basicSalary: 230_000, housing: 57_500,  transport: 33_000 },
  { staffId: 'SUL-EMP-015',   name: 'Ifeanyi Okonkwo',     email: 'ifeanyi@suler.com',  role: 'EMPLOYEE',        jobTitle: 'Safety Officer',                branch: 'Port Harcourt', basicSalary: 260_000, housing: 65_000,  transport: 38_000 },
  { staffId: 'SUL-EMP-016',   name: 'Blessing Anosike',    email: 'blessing@suler.com', role: 'EMPLOYEE',        jobTitle: 'Junior Logistics Officer',      branch: 'Port Harcourt', basicSalary: 190_000, housing: 47_500,  transport: 27_000 },
];

const DEFAULT_PASSWORD = 'Admin123!';

function nameParts(full: string): [string, string] {
  const [first, ...rest] = full.split(' ');
  return [first, rest.join(' ') || first];
}

async function clearDemoData() {
  // Wipe entities that lack a natural unique key. Order matters for FKs.
  await prisma.workflowAuditEntry.deleteMany();
  await prisma.workflowInstance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.payrollAdjustment.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.expenditure.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.statutoryRate.deleteMany();
  await prisma.securityEvent.deleteMany();
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Suler EMS — Demo Organization Seed v3.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await clearDemoData();
  console.log('✓ Cleared transactional demo data');

  // ── Departments ──
  const lagosHq = await prisma.department.upsert({
    where: { code: 'LAG-HQ' }, update: { name: 'Lagos Headquarters' },
    create: { name: 'Lagos Headquarters', code: 'LAG-HQ' },
  });
  const abujaOps = await prisma.department.upsert({
    where: { code: 'ABJ-OPS' }, update: { name: 'Abuja Operations' },
    create: { name: 'Abuja Operations', code: 'ABJ-OPS' },
  });
  const phcLog = await prisma.department.upsert({
    where: { code: 'PHC-LOG' }, update: { name: 'Port Harcourt Logistics' },
    create: { name: 'Port Harcourt Logistics', code: 'PHC-LOG' },
  });
  const deptMap = { Lagos: lagosHq, Abuja: abujaOps, 'Port Harcourt': phcLog } as const;
  console.log('✓ Departments: Lagos HQ, Abuja Ops, Port Harcourt Logistics');

  // ── Permissions ──
  const permMap: Record<string, { id: string }> = {};
  for (const perm of ALL_PERMISSIONS) {
    permMap[perm.code] = await prisma.permission.upsert({
      where: { code: perm.code }, update: { name: perm.name },
      create: { code: perm.code, name: perm.name },
    });
  }
  console.log(`✓ Permissions: ${ALL_PERMISSIONS.length}`);

  // ── Roles ──
  const roleMap: Record<string, { id: string }> = {};
  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    roleMap[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: { permissions: { set: codes.map(c => ({ id: permMap[c].id })) } },
      create: {
        name: roleName,
        description: `${roleName} — system-managed role`,
        permissions: { connect: codes.map(c => ({ id: permMap[c].id })) },
      },
    });
  }
  console.log(`✓ Roles: ${Object.keys(ROLE_PERMISSIONS).join(', ')}`);

  // ── Statutory Rates ──
  await prisma.statutoryRate.createMany({
    data: [
      { code: 'PENSION_EMPLOYEE_PCT', name: 'Employee Pension', type: 'PERCENTAGE',
        value: { value: DEFAULT_NG_RATES.pensionEmployeeRate } as any,
        effectiveFrom: new Date('2024-01-01') },
      { code: 'PENSION_EMPLOYER_PCT', name: 'Employer Pension', type: 'PERCENTAGE',
        value: { value: DEFAULT_NG_RATES.pensionEmployerRate } as any,
        effectiveFrom: new Date('2024-01-01') },
      { code: 'NHF_PCT', name: 'National Housing Fund', type: 'PERCENTAGE',
        value: { value: DEFAULT_NG_RATES.nhfRate } as any,
        effectiveFrom: new Date('2024-01-01') },
      { code: 'NHIS_PCT', name: 'NHIS', type: 'PERCENTAGE',
        value: { value: DEFAULT_NG_RATES.nhisRate } as any,
        effectiveFrom: new Date('2024-01-01') },
      { code: 'CRA_PCT', name: 'Consolidated Relief Allowance %', type: 'PERCENTAGE',
        value: { value: DEFAULT_NG_RATES.craPercentage } as any,
        effectiveFrom: new Date('2024-01-01') },
      { code: 'CRA_FIXED', name: 'CRA Fixed Component (annual)', type: 'FIXED',
        value: { value: DEFAULT_NG_RATES.craFixed } as any,
        effectiveFrom: new Date('2024-01-01') },
    ],
  });
  console.log('✓ Statutory Rates: 6');

  // ── Employees + Users + Salary Structures ──
  const employeeIdByEmail: Record<string, string> = {};
  const userIdByEmail: Record<string, string> = {};
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const account of STAFF) {
    const dept = deptMap[account.branch];
    const [firstName, lastName] = nameParts(account.name);

    const employee = await prisma.employee.upsert({
      where: { email: account.email },
      update: {
        jobTitle: account.jobTitle, branch: account.branch,
        departmentId: dept.id, status: 'ACTIVE',
      },
      create: {
        staffId: account.staffId,
        firstName, lastName, email: account.email,
        jobTitle: account.jobTitle, branch: account.branch,
        departmentId: dept.id, status: 'ACTIVE',
      },
    });
    employeeIdByEmail[account.email] = employee.id;

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, roleId: roleMap[account.role].id, employeeId: employee.id, isActive: true },
      create: {
        email: account.email, name: account.name, passwordHash,
        roleId: roleMap[account.role].id, employeeId: employee.id, isActive: true,
      },
    });
    userIdByEmail[account.email] = user.id;

    await prisma.salaryStructure.create({
      data: {
        employeeId: employee.id,
        effectiveDate: new Date('2026-01-01'),
        isActive: true,
        basicSalary: account.basicSalary,
        housingAllowance: account.housing,
        transportAllowance: account.transport,
        changedById: user.id,
        reason: 'Initial salary structure (seed)',
      },
    });
  }
  console.log(`✓ Staff provisioned: ${STAFF.length} (Employees + Users + Salary)`);

  const adminId = userIdByEmail['admin@suler.com'];
  const financeId = userIdByEmail['finance@suler.com'];
  const managerLagosId = userIdByEmail['manager@suler.com'];
  const hrId = userIdByEmail['hr@suler.com'];

  // ── Budgets (org-wide + per dept) ──
  const orgCategories = [
    { name: 'Personnel',            allocatedAmount: 150_000_000, code: 'PERS' },
    { name: 'Technology & Tools',   allocatedAmount: 35_000_000,  code: 'TECH' },
    { name: 'Travel & Logistics',   allocatedAmount: 25_000_000,  code: 'TRVL' },
    { name: 'Facilities',           allocatedAmount: 20_000_000,  code: 'FAC'  },
    { name: 'Marketing & Comms',    allocatedAmount: 12_000_000,  code: 'MKT'  },
    { name: 'Contingency',          allocatedAmount: 8_000_000,   code: 'CONT' },
  ];
  const orgBudget = await prisma.budget.create({
    data: {
      name: 'FY2026 Operating Budget',
      fiscalYear: 'FY2026', period: 'ANNUAL',
      totalAmount: 250_000_000, currency: 'NGN',
      allocatedAmount: orgCategories.reduce((s, c) => s + c.allocatedAmount, 0),
      status: 'ACTIVE', createdById: adminId,
      approvedById: financeId, approvedAt: new Date(),
      description: 'Organization-wide annual operating envelope',
      categories: { create: orgCategories },
    },
    include: { categories: true },
  });

  const lagosCategories = [
    { name: 'Office Supplies',  allocatedAmount: 1_500_000, code: 'OFF-SUP' },
    { name: 'Team Off-sites',   allocatedAmount: 4_000_000, code: 'OFFSITE' },
    { name: 'Cloud Infra',      allocatedAmount: 7_000_000, code: 'CLOUD'   },
    { name: 'Subscriptions',    allocatedAmount: 3_500_000, code: 'SUB'     },
  ];
  const lagosBudget = await prisma.budget.create({
    data: {
      name: 'Lagos HQ — Q3 2026', fiscalYear: 'FY2026', period: 'Q3',
      departmentId: lagosHq.id, totalAmount: 18_000_000,
      allocatedAmount: lagosCategories.reduce((s, c) => s + c.allocatedAmount, 0),
      status: 'ACTIVE', createdById: managerLagosId,
      approvedById: financeId, approvedAt: new Date(),
      categories: { create: lagosCategories },
    },
    include: { categories: true },
  });

  const phcCategories = [
    { name: 'Fuel & Maintenance',  allocatedAmount: 4_500_000, code: 'FUEL' },
    { name: 'Warehouse Ops',       allocatedAmount: 3_000_000, code: 'WH'   },
    { name: 'Field Allowances',    allocatedAmount: 2_000_000, code: 'FLD'  },
  ];
  await prisma.budget.create({
    data: {
      name: 'Port Harcourt Logistics — Q3 2026', fiscalYear: 'FY2026', period: 'Q3',
      departmentId: phcLog.id, totalAmount: 9_500_000,
      allocatedAmount: phcCategories.reduce((s, c) => s + c.allocatedAmount, 0),
      status: 'ACTIVE', createdById: userIdByEmail['manager3@suler.com'],
      approvedById: financeId, approvedAt: new Date(),
      categories: { create: phcCategories },
    },
  });
  console.log('✓ Budgets: 3 (1 org-wide + 2 departmental)');

  // ── Expenditures (15 across statuses) ──
  const techCat = orgBudget.categories.find(c => c.code === 'TECH')!;
  const trvlCat = orgBudget.categories.find(c => c.code === 'TRVL')!;
  const cloudCat = lagosBudget.categories.find(c => c.code === 'CLOUD')!;
  const subCat = lagosBudget.categories.find(c => c.code === 'SUB')!;
  const offsiteCat = lagosBudget.categories.find(c => c.code === 'OFFSITE')!;

  const expenditures: Array<{
    budgetId: string; categoryId: string; amount: number; description: string;
    vendor: string; requesterEmail: string; status: string; approvedBy?: string;
    disbursedBy?: string; paymentMethod?: string;
  }> = [
    { budgetId: lagosBudget.id, categoryId: cloudCat.id,   amount: 1_200_000, description: 'AWS Q3 reserved instances',     vendor: 'Amazon Web Services',  requesterEmail: 'employee@suler.com',     status: 'DISBURSED', approvedBy: financeId, disbursedBy: userIdByEmail['finance2@suler.com'], paymentMethod: 'BANK_TRANSFER' },
    { budgetId: lagosBudget.id, categoryId: subCat.id,     amount: 480_000,   description: 'Linear & GitHub seats (annual)', vendor: 'Linear / GitHub',      requesterEmail: 'employee@suler.com', status: 'DISBURSED', approvedBy: financeId, disbursedBy: financeId,            paymentMethod: 'CARD' },
    { budgetId: lagosBudget.id, categoryId: cloudCat.id,   amount: 350_000,   description: 'Sentry monitoring upgrade',      vendor: 'Sentry.io',            requesterEmail: 'bola@suler.com',     status: 'DISBURSED', approvedBy: financeId, disbursedBy: financeId,            paymentMethod: 'CARD' },
    { budgetId: lagosBudget.id, categoryId: offsiteCat.id, amount: 2_500_000, description: 'Lagos team off-site venue',      vendor: 'Eko Hotel & Suites',   requesterEmail: 'manager@suler.com',  status: 'APPROVED',  approvedBy: financeId },
    { budgetId: orgBudget.id,   categoryId: techCat.id,    amount: 3_200_000, description: 'MacBook Pro M4 ×4 for new hires',vendor: 'iStore Nigeria',       requesterEmail: 'hr@suler.com',       status: 'APPROVED',  approvedBy: financeId },
    { budgetId: orgBudget.id,   categoryId: trvlCat.id,    amount: 680_000,   description: 'Abuja → Lagos quarterly review', vendor: 'Air Peace',            requesterEmail: 'manager2@suler.com', status: 'SUBMITTED' },
    { budgetId: orgBudget.id,   categoryId: trvlCat.id,    amount: 420_000,   description: 'PH client visit (3 staff)',      vendor: 'Dana Airlines',        requesterEmail: 'manager3@suler.com', status: 'SUBMITTED' },
    { budgetId: lagosBudget.id, categoryId: subCat.id,     amount: 280_000,   description: 'Notion enterprise upgrade',      vendor: 'Notion Labs',          requesterEmail: 'ngozi@suler.com',    status: 'SUBMITTED' },
    { budgetId: orgBudget.id,   categoryId: techCat.id,    amount: 1_800_000, description: 'Office firewall hardware',       vendor: 'Fortinet Partner NG',  requesterEmail: 'admin@suler.com',    status: 'SUBMITTED' },
    { budgetId: lagosBudget.id, categoryId: offsiteCat.id, amount: 950_000,   description: 'Quarterly team dinner',          vendor: 'Nkoyo Restaurant',     requesterEmail: 'manager@suler.com',  status: 'DRAFT' },
    { budgetId: orgBudget.id,   categoryId: techCat.id,    amount: 540_000,   description: 'Figma org seats renewal',        vendor: 'Figma Inc.',           requesterEmail: 'ngozi@suler.com',    status: 'DRAFT' },
    { budgetId: orgBudget.id,   categoryId: trvlCat.id,    amount: 220_000,   description: 'Compliance audit travel',        vendor: 'PwC Nigeria',          requesterEmail: 'hr@suler.com',       status: 'DRAFT' },
    { budgetId: orgBudget.id,   categoryId: techCat.id,    amount: 4_500_000, description: 'On-prem server refresh',         vendor: 'Dell Technologies',    requesterEmail: 'admin@suler.com',    status: 'REJECTED' },
    { budgetId: lagosBudget.id, categoryId: cloudCat.id,   amount: 1_100_000, description: 'CloudFlare enterprise tier',     vendor: 'CloudFlare',           requesterEmail: 'bola@suler.com',     status: 'REJECTED' },
    { budgetId: orgBudget.id,   categoryId: trvlCat.id,    amount: 380_000,   description: 'PH driver weekly stipend',       vendor: 'Field Petty Cash',     requesterEmail: 'manager3@suler.com', status: 'DRAFT' },
  ];

  let totalDisbursedLagos = 0;
  for (const e of expenditures) {
    await prisma.expenditure.create({
      data: {
        budgetId: e.budgetId,
        categoryId: e.categoryId,
        amount: e.amount,
        description: e.description,
        vendor: e.vendor,
        requestedById: employeeIdByEmail[e.requesterEmail],
        status: e.status,
        approvedById: e.approvedBy,
        disbursedById: e.disbursedBy,
        paymentMethod: e.paymentMethod,
        paymentDate: e.status === 'DISBURSED' ? new Date() : null,
        rejectReason: e.status === 'REJECTED' ? 'Out of scope for current quarter' : null,
      },
    });
    if (e.status === 'DISBURSED' && e.budgetId === lagosBudget.id) totalDisbursedLagos += e.amount;
  }

  // Reflect disbursed spend on budget/category aggregates (matches what
  // transitionExpenditure does at runtime).
  for (const e of expenditures.filter(x => x.status === 'DISBURSED')) {
    await prisma.budget.update({
      where: { id: e.budgetId }, data: { spentAmount: { increment: e.amount } },
    });
    await prisma.budgetCategory.update({
      where: { id: e.categoryId }, data: { spentAmount: { increment: e.amount } },
    });
  }
  console.log(`✓ Expenditures: ${expenditures.length} (3 disbursed, 2 approved, 4 submitted, 4 draft, 2 rejected)`);

  // ── Leave Requests + Workflow Instances ──
  const employeesForLeave = ['employee@suler.com', 'bola@suler.com', 'chinedu@suler.com', 'ngozi@suler.com', 'yusuf@suler.com',
                             'hauwa@suler.com', 'sani@suler.com', 'maryam@suler.com', 'aliyu@suler.com', 'zainab@suler.com'];

  const leavePlan: Array<{ email: string; type: string; days: number; status: string; reason: string }> = [
    { email: 'employee@suler.com', type: 'ANNUAL', days: 5, status: 'APPROVED',         reason: 'Family vacation' },
    { email: 'bola@suler.com',     type: 'SICK',   days: 2, status: 'APPROVED',         reason: 'Recovery from flu' },
    { email: 'chinedu@suler.com',  type: 'ANNUAL', days: 7, status: 'MANAGER_APPROVED', reason: 'Wedding trip' },
    { email: 'ngozi@suler.com',    type: 'ANNUAL', days: 3, status: 'SUBMITTED',        reason: 'Personal' },
    { email: 'yusuf@suler.com',    type: 'SICK',   days: 1, status: 'SUBMITTED',        reason: 'Doctor appointment' },
    { email: 'hauwa@suler.com',    type: 'ANNUAL', days: 4, status: 'SUBMITTED',        reason: 'Visiting family' },
    { email: 'sani@suler.com',     type: 'ANNUAL', days: 6, status: 'REJECTED',         reason: 'Travel — declined due to project deadline' },
    { email: 'maryam@suler.com',   type: 'SICK',   days: 3, status: 'REJECTED',         reason: 'Insufficient documentation' },
    { email: 'aliyu@suler.com',    type: 'ANNUAL', days: 2, status: 'DRAFT',            reason: 'Long weekend' },
    { email: 'zainab@suler.com',   type: 'ANNUAL', days: 5, status: 'DRAFT',            reason: 'Pending detail' },
  ];

  for (const lp of leavePlan) {
    const employee = await prisma.employee.findUniqueOrThrow({ where: { email: lp.email } });
    const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + lp.days * 24 * 60 * 60 * 1000);

    const instance = await prisma.workflowInstance.create({
      data: {
        workflowId: 'leave-workflow', version: 1,
        currentState: lp.status, resourceId: 'pending',
      },
    });
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id, type: lp.type,
        startDate: start, endDate: end,
        status: lp.status, reason: lp.reason,
        workflowInstanceId: instance.id,
      },
    });
    await prisma.workflowInstance.update({
      where: { id: instance.id }, data: { resourceId: request.id },
    });

    // Audit trail — minimal, just SUBMITTED → status entry
    if (lp.status !== 'DRAFT') {
      await prisma.workflowAuditEntry.create({
        data: {
          instanceId: instance.id, actorId: userIdByEmail[lp.email] ?? adminId,
          actorName: STAFF.find(s => s.email === lp.email)?.name ?? 'System',
          actorRole: STAFF.find(s => s.email === lp.email)?.role ?? 'EMPLOYEE',
          fromState: 'DRAFT', toState: 'SUBMITTED',
          action: 'submit', comment: lp.reason,
        },
      });
    }
    if (['MANAGER_APPROVED', 'APPROVED', 'REJECTED'].includes(lp.status)) {
      await prisma.workflowAuditEntry.create({
        data: {
          instanceId: instance.id, actorId: managerLagosId,
          actorName: 'Ibrahim Yusuf', actorRole: 'MANAGER',
          fromState: 'SUBMITTED',
          toState: lp.status === 'REJECTED' ? 'REJECTED' : 'MANAGER_APPROVED',
          action: lp.status === 'REJECTED' ? 'reject' : 'approve',
        },
      });
    }
    if (lp.status === 'APPROVED') {
      await prisma.workflowAuditEntry.create({
        data: {
          instanceId: instance.id, actorId: hrId,
          actorName: 'Chiamaka Obi', actorRole: 'HR_ADMIN',
          fromState: 'MANAGER_APPROVED', toState: 'APPROVED',
          action: 'finalize',
        },
      });
    }
  }
  console.log(`✓ Leave Requests + Workflows: ${leavePlan.length}`);

  // ── Prior-month Payroll Run (PROCESSED) ──
  const now = new Date();
  const priorMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const priorPeriod = `${priorMonth.getFullYear()}-${String(priorMonth.getMonth() + 1).padStart(2, '0')}`;

  const payrollRun = await prisma.payrollRun.create({
    data: {
      name: `${priorPeriod} — Organization Wide`,
      period: priorPeriod, departmentId: null,
      status: 'PROCESSED',
      createdById: financeId, approvedById: financeId, processedById: financeId,
      approvedAt: new Date(now.getFullYear(), now.getMonth(), 1),
      processedAt: new Date(now.getFullYear(), now.getMonth(), 2),
      rateSnapshot: DEFAULT_NG_RATES as any,
    },
  });

  let totalGross = 0, totalNet = 0, totalDeductions = 0, totalEmployerContrib = 0;
  for (const account of STAFF) {
    const employee = await prisma.employee.findUniqueOrThrow({ where: { email: account.email } });
    const result = computePayroll({
      salary: {
        basicSalary: account.basicSalary,
        housingAllowance: account.housing,
        transportAllowance: account.transport,
      },
    });
    await prisma.payrollEntry.create({
      data: {
        runId: payrollRun.id, employeeId: employee.id,
        basicSalary: account.basicSalary,
        housingAllowance: account.housing,
        transportAllowance: account.transport,
        grossPay: result.grossPay,
        paye: result.paye,
        pensionEmployee: result.pensionEmployee,
        pensionEmployer: result.pensionEmployer,
        nhf: result.nhf, nhis: result.nhis,
        totalDeductions: result.totalDeductions,
        netPay: result.netPay,
      },
    });
    totalGross += result.grossPay; totalNet += result.netPay;
    totalDeductions += result.totalDeductions; totalEmployerContrib += result.pensionEmployer;
  }
  await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: { totalGross, totalNet, totalDeductions, totalEmployerContrib, entryCount: STAFF.length },
  });
  console.log(`✓ Payroll Run ${priorPeriod}: ${STAFF.length} entries — Gross ₦${totalGross.toLocaleString()}, Net ₦${totalNet.toLocaleString()}`);

  // ── Provisioning audit events ──
  for (const account of STAFF) {
    await prisma.securityEvent.create({
      data: {
        type: 'LOGIN_SUCCESS',
        description: `[SEED v3] Account provisioned for ${account.name} (${account.role})`,
        metadata: { email: account.email, role: account.role, branch: account.branch },
      },
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo Organization Seed Complete ✓');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  All accounts share password: ${DEFAULT_PASSWORD}`);
  console.log('  Try:');
  console.log('    admin@suler.com     — Super Admin (all access)');
  console.log('    hr@suler.com        — HR Admin');
  console.log('    finance@suler.com   — Finance Manager');
  console.log('    manager@suler.com   — Lagos Operations Manager');
  console.log('    employee@suler.com  — Regular Employee');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => { console.error('[SEED ERROR]', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
