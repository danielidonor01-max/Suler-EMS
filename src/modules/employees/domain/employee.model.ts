import { AuditMetadata, SoftDelete, UUID } from '@/types/common';
import { EmployeeStatusType } from '@/config/enums';

// The core business entity for Employee
export interface EmployeeModel extends AuditMetadata, SoftDelete {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: UUID;
  roleId: UUID;
  status: EmployeeStatusType;
  hireDate: string; // ISO 8601 Date
  // Note: Passwords and sensitive PII might be split into other aggregates, 
  // but keeping it simple for the domain boundary.
}

// The core business entity for Department
export interface DepartmentModel extends AuditMetadata, SoftDelete {
  id: UUID;
  name: string;
  code: string;
  managerId: UUID | null;
}
