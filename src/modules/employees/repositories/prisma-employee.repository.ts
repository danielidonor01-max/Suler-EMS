import prisma from "@/lib/prisma";
import { Result } from "@/types/api";
import { UUID } from "@/types/common";
import { EmployeeResponseDTO } from "../dto/employee.dto";

export class PrismaEmployeeRepository {
  async findAll(): Promise<Result<EmployeeResponseDTO[]>> {
    try {
      const employees = await prisma.employee.findMany({
        where: { deletedAt: null },
        include: { 
          department: true,
          user: {
            include: { role: true }
          }
        }
      });
      
      const data: EmployeeResponseDTO[] = employees.map(emp => ({
        id:           emp.id,
        staffId:      emp.staffId,
        firstName:    emp.firstName,
        lastName:     emp.lastName,
        fullName:     `${emp.firstName} ${emp.lastName}`,
        email:        emp.email,
        phone:        emp.phone || undefined,
        jobTitle:     emp.jobTitle,
        department:   { id: emp.department.id, name: emp.department.name },
        departmentName: emp.department.name,
        roleName:     emp.user?.role.name || 'Staff',
        status:       emp.status as any,
        hireDate:     emp.createdAt.toISOString(),
        joinedDaysAgo: Math.floor((Date.now() - emp.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        nin:          emp.nin || undefined,
        bvn:          emp.bvn || undefined,
        tin:          emp.tin || undefined,
        grade:        emp.grade || undefined,
        branch:       emp.branch,
        bankName:          emp.bankName,
        bankCode:          emp.bankCode,
        bankAccountNumber: emp.bankAccountNumber,
      }));

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  async findById(id: UUID): Promise<Result<EmployeeResponseDTO>> {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id, deletedAt: null },
        include: { 
          department: true,
          user: {
            include: { role: true }
          }
        }
      });

      if (!employee) return { success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } };

      const data: EmployeeResponseDTO = {
        id:           employee.id,
        staffId:      employee.staffId,
        firstName:    employee.firstName,
        lastName:     employee.lastName,
        fullName:     `${employee.firstName} ${employee.lastName}`,
        email:        employee.email,
        phone:        employee.phone || undefined,
        jobTitle:     employee.jobTitle,
        department:   { id: employee.department.id, name: employee.department.name },
        departmentName: employee.department.name,
        roleName:     employee.user?.role.name || 'Staff',
        status:       employee.status as any,
        hireDate:     employee.createdAt.toISOString(),
        joinedDaysAgo: Math.floor((Date.now() - employee.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        nin:          employee.nin || undefined,
        bvn:          employee.bvn || undefined,
        tin:          employee.tin || undefined,
        grade:        employee.grade || undefined,
        branch:       employee.branch,
        bankName:          employee.bankName,
        bankCode:          employee.bankCode,
        bankAccountNumber: employee.bankAccountNumber,
      };

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }
}
