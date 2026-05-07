import { z } from 'zod';
import { EmployeeStatus } from '@/config/enums';

// Central Zod Schema mimicking CreateEmployeeDTO
export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email format"),
  departmentId: z.string().uuid("Invalid department reference"),
  roleId: z.string().uuid("Invalid role reference"),
  hireDate: z.string().datetime({ message: "Invalid ISO date string" }),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial().extend({
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export type CreateEmployeeFormData = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeFormData = z.infer<typeof UpdateEmployeeSchema>;
