import { UUID } from '@/types/common';
import { QueryParams } from '@/types/query';
import { EmployeeStatusType } from '@/config/enums';

// The payload sent by the frontend to create a new Employee
export interface CreateEmployeeDTO {
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: UUID;
  roleId: UUID;
  hireDate: string;
  nin?: string;
  bvn?: string;
  tin?: string;
  pensionPFA?: string;
  pensionNumber?: string;
  grade?: string;
  branch?: string;
}

// The payload sent by the frontend to update an existing Employee
export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {
  status?: EmployeeStatusType;
}

// The rich response returned by the backend (contains joined data, formatted strings)
// Notice how this differs from the base EmployeeModel.
export interface EmployeeResponseDTO {
  id: UUID;
  staffId: string;
  /** Raw name parts so per-row consumers (salary structures, bank pickers) can format them their way. */
  firstName?: string;
  lastName?: string;
  /** Aggregated form, kept for any consumer still reading `fullName`. */
  fullName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  /** Joined department object. `departmentName` retained for backwards compat. */
  department?: { id: UUID; name: string } | null;
  departmentName: string;
  roleName: string;
  status: EmployeeStatusType;
  hireDate: string;
  joinedDaysAgo: number;
  nin?: string;
  bvn?: string;
  tin?: string;
  grade?: string;
  branch?: string | null;
  /** Bank disbursement fields — surfaced for the salary-structures + profile views. */
  bankName?: string | null;
  bankCode?: string | null;
  bankAccountNumber?: string | null;
}


// Complex querying parameters simulating robust backend search/filter
export interface EmployeeQueryParams extends QueryParams {
  status?: EmployeeStatusType | 'All';
  departmentId?: UUID | 'All';
}
