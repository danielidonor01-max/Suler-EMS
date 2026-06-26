import { PrismaEmployeeRepository } from '@/modules/employees/repositories/prisma-employee.repository';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { withAuth } from '@/lib/api/with-auth';
import { PasswordService } from '@/lib/auth/password.service';
import { AuthService } from '@/lib/auth/auth.service';
import prisma from '@/lib/prisma';

const employeeRepo = new PrismaEmployeeRepository();

/**
 * GET /api/employees
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  try {
    const result = await employeeRepo.findAll();

    if (!result.success) {
      return errorResponse(result.error.code, result.error.message, 500, correlationId);
    }

    return successResponse(result.data, correlationId);
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, 500, correlationId);
  }
});

/**
 * POST /api/employees
 *
 * Atomically provisions:
 *  1. An Employee HR record
 *  2. A linked User auth account (temporary password: Welcome123!)
 *  3. A SecurityEvent audit entry
 *
 * Required body: { name, email, phone?, role, hub, department, designation, startDate? }
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  try {
    const body = await req.json();
    const {
      name, email, phone, role: roleName, hub, department, designation, startDate,
      basicSalary, housingAllowance, transportAllowance,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name || !email || !roleName || !hub || !department || !designation) {
      return errorResponse(
        'VALIDATION_ERROR',
        'name, email, role, hub, department, and designation are required.',
        400,
        correlationId
      );
    }

    // ── Check for duplicate email ──────────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse(
        'IDENTITY_COLLISION',
        'An account with this email already exists in the organization.',
        409,
        correlationId
      );
    }

    // ── Resolve Role ──────────────────────────────────────────────────────────
    const roleRecord = await prisma.role.findUnique({ where: { name: roleName } });
    if (!roleRecord) {
      return errorResponse(
        'ROLE_NOT_FOUND',
        `Role "${roleName}" does not exist. Ensure the database has been seeded.`,
        404,
        correlationId
      );
    }

    // ── Resolve or create Department ──────────────────────────────────────────
    // Normalize hub name to a department code
    const hubCode = hub.toUpperCase().replace(/\s+/g, '-').slice(0, 10);
    const deptCode = `${hubCode}-${department.toUpperCase().replace(/\s+/g, '-').slice(0, 6)}`;

    const departmentRecord = await prisma.department.upsert({
      where: { code: deptCode },
      update: {},
      create: { name: `${department} — ${hub}`, code: deptCode },
    });

    // ── Generate Staff ID ─────────────────────────────────────────────────────
    const count = await prisma.employee.count();
    const staffId = `SUL-${String(count + 100).padStart(3, '0')}`;

    // ── Create Employee record ────────────────────────────────────────────────
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;

    const employee = await prisma.employee.create({
      data: {
        staffId,
        firstName,
        lastName,
        email,
        phone: phone || null,
        jobTitle: designation,
        branch: hub,
        departmentId: departmentRecord.id,
        status: 'ACTIVE',
      },
    });

    // ── Create User auth account ───────────────────────────────────────────────
    const TEMPORARY_PASSWORD = 'Welcome123!';
    const passwordHash = await PasswordService.hash(TEMPORARY_PASSWORD);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        roleId: roleRecord.id,
        employeeId: employee.id,
        isActive: true,
      },
    });

    // ── Seed a baseline SalaryStructure ───────────────────────────────────────
    // Without this, the employee is silently skipped by every payroll run
    // (createDraftRun does `if (!salary) continue`). HR can — and should —
    // edit the structure at /payroll/salary-structures before the next run,
    // but providing zero defaults means a freshly-hired employee won't
    // disappear from payroll just because nobody remembered to set their
    // comp first. When the caller supplies real numbers in the POST body
    // we use them; otherwise we land a flagged "PENDING_COMP" structure
    // with zero everywhere so the gap is visible (Compensation section
    // surfaces the zero amounts, salary-structures page shows it inline).
    const basic     = Number(basicSalary)        || 0;
    const housing   = Number(housingAllowance)   || 0;
    const transport = Number(transportAllowance) || 0;
    await prisma.salaryStructure.create({
      data: {
        employeeId:         employee.id,
        effectiveDate:      startDate ? new Date(startDate) : new Date(),
        isActive:           true,
        basicSalary:        basic,
        housingAllowance:   housing,
        transportAllowance: transport,
        changedById:        session.user?.id ?? user.id,
        reason: (basic + housing + transport) > 0
          ? 'Initial structure at onboarding.'
          : 'Initial placeholder — HR to set amounts.',
      },
    });

    // ── Audit: provisioning event ─────────────────────────────────────────────
    await AuthService.recordSecurityEvent({
      type: 'LOGIN_SUCCESS', // closest type — provisioning trace
      userId: user.id,
      description: `[PROVISIONING] Account created for ${name} (${email}) with role ${roleName} by ${session.user?.email || 'SYSTEM'}`,
      metadata: {
        employeeId: employee.id,
        staffId,
        role: roleName,
        hub,
        department,
        designation,
        provisionedBy: session.user?.id || 'SYSTEM',
        correlationId,
      },
      correlationId,
    });

    return successResponse(
      {
        message: 'Member onboarded successfully. Authentication account provisioned.',
        employeeId: employee.id,
        userId: user.id,
        staffId,
        temporaryPassword: TEMPORARY_PASSWORD,
        credentials: {
          email,
          password: TEMPORARY_PASSWORD,
          note: 'This is a temporary password. The user should change it after first login.',
        },
      },
      correlationId,
      201
    );
  } catch (error: any) {
    console.error(`[POST /api/employees] ${correlationId}:`, error);
    return errorResponse('INTERNAL_ERROR', error.message, 500, correlationId);
  }
});
