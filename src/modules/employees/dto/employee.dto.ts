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
  fullName: string; // Aggregated by backend
  email: string;
  departmentName: string; // Joined by backend
  roleName: string; // Joined by backend
  status: EmployeeStatusType;
  hireDate: string;
  joinedDaysAgo: number; // Computed by backend
  nin?: string;
  bvn?: string;
  tin?: string;
  grade?: string;
  branch?: string;
}


// Complex querying parameters simulating robust backend search/filter
export interface EmployeeQueryParams extends QueryParams {
  status?: EmployeeStatusType | 'All';
  departmentId?: UUID | 'All';
}
