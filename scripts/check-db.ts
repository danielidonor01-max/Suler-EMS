import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { email: true, isActive: true }
  });
  console.log('--- Current Users in SQLite ---');
  console.log(users);
  await prisma.$disconnect();
}

check();
