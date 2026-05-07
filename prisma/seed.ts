import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Nigerian Localization Seed ---');

  // 1. Departments & Branches
  const lagosHq = await prisma.department.upsert({
    where: { code: 'LAG-HQ' },
    update: {},
    create: { name: 'Lagos Headquarters', code: 'LAG-HQ' }
  });

  const abujaBranch = await prisma.department.upsert({
    where: { code: 'ABJ-OPS' },
    update: {},
    create: { name: 'Abuja Operations', code: 'ABJ-OPS' }
  });

  const phPort = await prisma.department.upsert({
    where: { code: 'PHC-LOG' },
    update: {},
    create: { name: 'Port Harcourt Logistics', code: 'PHC-LOG' }
  });

  console.log('Departments and Branches localized');

  // 2. Roles & Permissions
  const empView = await prisma.permission.upsert({
    where: { code: 'employee:view' },
    update: {},
    create: { code: 'employee:view', name: 'View Staff Records' }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { 
      name: 'SUPER_ADMIN', 
      permissions: { connect: [{ id: empView.id }] } 
    }
  });

  console.log('Roles & Permissions localized');

  // 3. Employees & Users (Nigerian Context)
  const adminEmp = await prisma.employee.upsert({
    where: { email: 'chinedu.okoro@suler.ems' },
    update: {},
    create: {
      staffId: 'SUL-001',
      firstName: 'Chinedu',
      lastName: 'Okoro',
      email: 'chinedu.okoro@suler.ems',
      jobTitle: 'Chief Technology Officer',
      grade: 'M3',
      branch: 'Lagos',
      departmentId: lagosHq.id,
      status: 'ACTIVE',
      nin: '12345678901',
      tin: 'TIN-00192837',
      pensionPFA: 'Stanbic IBTC Pension',
      pensionNumber: 'PEN-123456789'
    }
  });

  const passwordHash = await bcrypt.hash('password123', 12);

  await prisma.user.upsert({
    where: { email: 'chinedu.okoro@suler.ems' },
    update: {
        passwordHash: passwordHash,
        roleId: adminRole.id,
        employeeId: adminEmp.id
    },
    create: {
      email: 'chinedu.okoro@suler.ems',
      name: 'Chinedu Okoro',
      passwordHash: passwordHash,
      roleId: adminRole.id,
      employeeId: adminEmp.id
    }
  });

  console.log('Nigerian staff records seeded: admin@suler.ems (password123)');
  console.log('--- Localization Seed Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
