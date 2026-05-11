import { PrismaEmployeeRepository } from '@/modules/employees/repositories/prisma-employee.repository';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { withAuth } from '@/lib/api/with-auth';

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
