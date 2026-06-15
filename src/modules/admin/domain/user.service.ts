/**
 * Admin user-management queries. Mutations live in role.service.ts
 * (changeUserRole) so role-related invariants stay co-located.
 */

import prisma from '@/lib/prisma';

export interface ListUsersFilter {
  roleId?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
}

export async function listAdminUsers(filter: ListUsersFilter = {}) {
  return prisma.user.findMany({
    where: {
      ...(filter.roleId ? { roleId: filter.roleId } : {}),
      ...(typeof filter.isActive === 'boolean' ? { isActive: filter.isActive } : {}),
      ...(filter.search
        ? {
            OR: [
              { email: { contains: filter.search, mode: 'insensitive' as const } },
              { name: { contains: filter.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ role: { name: 'asc' } }, { name: 'asc' }],
    take: filter.limit ?? 200,
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      version: true,
      lastLoginAt: true,
      role: { select: { id: true, name: true } },
      employee: {
        select: {
          id: true,
          staffId: true,
          jobTitle: true,
          branch: true,
          department: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });
}
