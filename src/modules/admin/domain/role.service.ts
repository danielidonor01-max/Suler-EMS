/**
 * RoleService — admin operations on roles & permissions.
 *
 * Constraints enforced (ARCHITECTURE.md §10 + §11):
 *   C1  Seed system role names cannot be deleted or renamed.
 *   C2  Every grant/revoke writes a SystemEvent + SecurityEvent.
 *   C3  Actor cannot remove their own session-essential permissions
 *       (specifically `role:manage`, which is what lets them edit roles).
 *   C4  At least one active SUPER_ADMIN must always exist.
 *   §11 User.version bumped for every affected user, inside the same
 *       transaction as the permission change. Client poller picks it up.
 */

import prisma from '@/lib/prisma';

/** System-protected role names — see ARCHITECTURE.md §10. */
export const SYSTEM_ROLE_NAMES = new Set([
  'SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_MANAGER', 'MANAGER', 'EMPLOYEE',
]);

/**
 * Permissions an actor MUST keep on their own role to continue managing
 * roles. If an actor tries to revoke any of these from a role they hold,
 * we block with 409 SELF_LOCKOUT_PREVENTED.
 */
export const SESSION_ESSENTIAL_PERMISSIONS = new Set([
  'role:manage',
]);

export interface Actor {
  id: string;
  name: string;
  role: string;
  permissions: string[];
}

export class RoleError extends Error {
  constructor(public code: string, message: string, public httpStatus = 400) {
    super(message);
    this.name = 'RoleError';
  }
}

export async function listRoles() {
  return prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: {
      permissions: { select: { id: true, code: true, name: true } },
      _count: { select: { users: true } },
    },
  });
}

export async function listPermissions() {
  return prisma.permission.findMany({
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  });
}

export async function getRole(id: string) {
  return prisma.role.findUniqueOrThrow({
    where: { id },
    include: {
      permissions: { select: { id: true, code: true, name: true } },
      _count: { select: { users: true } },
    },
  });
}

/**
 * Grant a permission to a role. Atomic: connects the permission, writes audit
 * events, and bumps `User.version` for every user assigned to this role.
 */
export async function grantPermission(roleId: string, permissionCode: string, actor: Actor) {
  const role = await prisma.role.findUniqueOrThrow({
    where: { id: roleId },
    include: { permissions: { select: { code: true } } },
  });
  const permission = await prisma.permission.findUnique({ where: { code: permissionCode } });
  if (!permission) {
    throw new RoleError('PERMISSION_NOT_FOUND', `Permission ${permissionCode} does not exist`, 404);
  }
  if (role.permissions.some(p => p.code === permissionCode)) {
    // Idempotent — already granted. Return current state without audit churn.
    return prisma.role.findUniqueOrThrow({ where: { id: roleId }, include: { permissions: true } });
  }

  return prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id: roleId },
      data: { permissions: { connect: { id: permission.id } } },
    });

    // §11 Bump User.version for every active user holding this role so their
    // next session-version poll triggers a refresh.
    await tx.user.updateMany({
      where: { roleId, isActive: true },
      data: { version: { increment: 1 } },
    });

    // C2 Audit trail — SystemEvent (operational) + SecurityEvent (governance).
    await tx.systemEvent.create({
      data: {
        type: 'PERMISSION_GRANTED',
        source: 'role-service',
        actorId: actor.id,
        resourceId: roleId,
        resourceType: 'Role',
        payload: { roleName: role.name, permission: permissionCode, actorRole: actor.role, op: 'grant' },
      },
    });
    await tx.securityEvent.create({
      data: {
        type: 'PERMISSION_DENIED', // closest existing type — clarified in description
        description: `[RBAC] +${permissionCode} added to role ${role.name} by ${actor.name}`,
        userId: actor.id,
        metadata: { event: 'PERMISSION_GRANTED', roleId, roleName: role.name, permission: permissionCode },
      },
    });

    return tx.role.findUniqueOrThrow({
      where: { id: roleId },
      include: { permissions: { select: { id: true, code: true, name: true } }, _count: { select: { users: true } } },
    });
  });
}

/**
 * Revoke a permission. Enforces C3 (self-lockout) and C4 (≥1 SUPER_ADMIN
 * with role:manage). Atomic with audit + version bump.
 */
export async function revokePermission(roleId: string, permissionCode: string, actor: Actor) {
  const role = await prisma.role.findUniqueOrThrow({
    where: { id: roleId },
    include: { permissions: { select: { code: true, id: true } } },
  });
  const permission = role.permissions.find(p => p.code === permissionCode);
  if (!permission) {
    // Idempotent — already not granted.
    return prisma.role.findUniqueOrThrow({
      where: { id: roleId },
      include: { permissions: { select: { id: true, code: true, name: true } }, _count: { select: { users: true } } },
    });
  }

  // C3 Self-lockout prevention: if the actor's own role is the one we're
  // editing AND the permission is session-essential, block.
  const actorUser = await prisma.user.findUnique({ where: { id: actor.id }, select: { roleId: true } });
  const editingOwnRole = actorUser?.roleId === roleId;
  if (editingOwnRole && SESSION_ESSENTIAL_PERMISSIONS.has(permissionCode)) {
    throw new RoleError(
      'SELF_LOCKOUT_PREVENTED',
      `Cannot remove ${permissionCode} from your own role — you would lose the ability to manage roles.`,
      409,
    );
  }

  // C4 ≥1 SUPER_ADMIN with role:manage. If we're removing role:manage from
  // SUPER_ADMIN itself, that would lock the entire platform out of role
  // management — block it regardless of self-lockout (different invariant).
  if (role.name === 'SUPER_ADMIN' && SESSION_ESSENTIAL_PERMISSIONS.has(permissionCode)) {
    throw new RoleError(
      'PLATFORM_LOCKOUT_PREVENTED',
      `Cannot remove ${permissionCode} from SUPER_ADMIN — no role would be able to manage permissions.`,
      409,
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id: roleId },
      data: { permissions: { disconnect: { id: permission.id } } },
    });
    await tx.user.updateMany({
      where: { roleId, isActive: true },
      data: { version: { increment: 1 } },
    });
    await tx.systemEvent.create({
      data: {
        type: 'PERMISSION_REVOKED',
        source: 'role-service',
        actorId: actor.id,
        resourceId: roleId,
        resourceType: 'Role',
        payload: { roleName: role.name, permission: permissionCode, actorRole: actor.role, op: 'revoke' },
      },
    });
    await tx.securityEvent.create({
      data: {
        type: 'PERMISSION_DENIED',
        description: `[RBAC] −${permissionCode} removed from role ${role.name} by ${actor.name}`,
        userId: actor.id,
        metadata: { event: 'PERMISSION_REVOKED', roleId, roleName: role.name, permission: permissionCode },
      },
    });
    return tx.role.findUniqueOrThrow({
      where: { id: roleId },
      include: { permissions: { select: { id: true, code: true, name: true } }, _count: { select: { users: true } } },
    });
  });
}

/**
 * Delete a role. C1 blocks deletion of any system role name. Even non-system
 * roles can only be deleted if no users hold them.
 */
export async function deleteRole(roleId: string) {
  const role = await prisma.role.findUniqueOrThrow({
    where: { id: roleId },
    include: { _count: { select: { users: true } } },
  });
  if (SYSTEM_ROLE_NAMES.has(role.name)) {
    throw new RoleError('SYSTEM_ROLE_PROTECTED', `${role.name} is a system role and cannot be deleted.`, 409);
  }
  if (role._count.users > 0) {
    throw new RoleError('ROLE_IN_USE', `${role.name} is assigned to ${role._count.users} user(s); reassign first.`, 409);
  }
  return prisma.role.delete({ where: { id: roleId } });
}

/**
 * Used by user-downgrade flows. The invariant is checked here so any caller
 * is safe; the endpoint that actually changes the user.roleId is
 * `changeUserRole` below.
 */
export async function assertCanDemoteSuperAdmin(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { role: { select: { name: true } } },
  });
  if (user.role.name !== 'SUPER_ADMIN') return; // not a super admin, nothing to assert

  const count = await prisma.user.count({
    where: { isActive: true, role: { name: 'SUPER_ADMIN' } },
  });
  if (count <= 1) {
    throw new RoleError(
      'LAST_SUPER_ADMIN_PROTECTED',
      'Cannot demote or deactivate the last SUPER_ADMIN. Promote another user first.',
      409,
    );
  }
}

/**
 * Reassign a user to a different role. Enforces:
 *   C4 — Cannot demote the last active SUPER_ADMIN.
 *   §11 — User.version bumped so the affected user picks up new permissions
 *         on the next session-version poll without re-login.
 *
 * Caller's role:manage permission is checked at the route layer.
 */
export async function changeUserRole(userId: string, newRoleId: string, actor: Actor) {
  const [user, newRole] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: { select: { id: true, name: true } } },
    }),
    prisma.role.findUniqueOrThrow({ where: { id: newRoleId }, select: { id: true, name: true } }),
  ]);

  if (user.role.id === newRole.id) {
    return user; // idempotent — same role, no audit churn
  }

  // C4: if the user is currently SUPER_ADMIN and the new role is not, we are
  // demoting them. Assert at least one OTHER active SUPER_ADMIN exists.
  if (user.role.name === 'SUPER_ADMIN' && newRole.name !== 'SUPER_ADMIN') {
    await assertCanDemoteSuperAdmin(userId);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { roleId: newRole.id, version: { increment: 1 } },
      include: { role: { select: { id: true, name: true } } },
    });

    await tx.systemEvent.create({
      data: {
        type: 'USER_ROLE_CHANGED',
        source: 'role-service',
        actorId: actor.id,
        resourceId: userId,
        resourceType: 'User',
        payload: {
          fromRole: user.role.name,
          toRole: newRole.name,
          actorRole: actor.role,
        },
      },
    });
    await tx.securityEvent.create({
      data: {
        type: 'PERMISSION_DENIED', // closest existing type; details in description
        description: `[RBAC] User ${user.id} role changed: ${user.role.name} → ${newRole.name} by ${actor.name}`,
        userId: actor.id,
        metadata: {
          event: 'USER_ROLE_CHANGED',
          targetUserId: userId,
          fromRole: user.role.name,
          toRole: newRole.name,
        },
      },
    });

    return updated;
  });
}
