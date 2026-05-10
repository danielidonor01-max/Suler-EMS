import { EmployeeResponseDTO } from '../dto/employee.dto';
import { EmployeeStatus } from '@/config/enums';

// We simulate the backend returning the DTO representation.
export const mockEmployeesDatabase: EmployeeResponseDTO[] = [
  {
    id: 'e1b2c3d4-0001-4123-8abc-123456789001',
    staffId: 'SUL-001',
    fullName: 'Alex Simmons',
    email: 'alex.s@sulerms.com',
    departmentName: 'Engineering',
    roleName: 'Software Engineer',
    status: EmployeeStatus.ACTIVE,
    hireDate: '2021-01-15T09:00:00Z',
    joinedDaysAgo: 1205,
  },
  {
    id: 'e1b2c3d4-0002-4123-8abc-123456789002',
    staffId: 'SUL-002',
    fullName: 'Rachel Meyer',
    email: 'r.meyer@sulerms.com',
    departmentName: 'Research & Development',
    roleName: 'Lead Researcher',
    status: EmployeeStatus.ACTIVE,
    hireDate: '2020-03-02T09:00:00Z',
    joinedDaysAgo: 1524,
  },
  {
    id: 'e1b2c3d4-0003-4123-8abc-123456789003',
    staffId: 'SUL-003',
    fullName: 'James Taggart',
    email: 'j.taggart@sulerms.com',
    departmentName: 'Sales & Marketing',
    roleName: 'Account Manager',
    status: EmployeeStatus.ON_LEAVE, // Simulating an employee out on leave
    hireDate: '2022-07-08T09:00:00Z',
    joinedDaysAgo: 665,
  },
  {
    id: 'e1b2c3d4-0004-4123-8abc-123456789004',
    staffId: 'SUL-004',
    fullName: 'Linda Blair',
    email: 'l.blair@sulerms.com',
    departmentName: 'Human Resources',
    roleName: 'HR Specialist',
    status: EmployeeStatus.ACTIVE,
    hireDate: '2019-11-20T09:00:00Z',
    joinedDaysAgo: 1627,
  },
  {
    id: 'e1b2c3d4-0005-4123-8abc-123456789005',
    staffId: 'SUL-005',
    fullName: 'Marcus Johnson',
    email: 'm.johnson@sulerms.com',
    departmentName: 'Operations',
    roleName: 'Logistics Coordinator',
    status: EmployeeStatus.INACTIVE, // Simulating a suspended/inactive state
    hireDate: '2023-01-10T09:00:00Z',
    joinedDaysAgo: 480,
  },
  {
    id: 'e1b2c3d4-0006-4123-8abc-123456789006',
    staffId: 'SUL-006',
    fullName: 'Sophia Chen',
    email: 's.chen@sulerms.com',
    departmentName: 'Finance',
    roleName: 'Financial Analyst',
    status: EmployeeStatus.TERMINATED, // Operational realism (will be filtered out by default usually)
    hireDate: '2018-05-14T09:00:00Z',
    joinedDaysAgo: 2184,
  },
  {
    id: 'e1b2c3d4-0007-4123-8abc-123456789007',
    staffId: 'SUL-007',
    fullName: 'David Okafor',
    email: 'd.okafor@sulerms.com',
    departmentName: 'Engineering',
    roleName: 'Frontend Engineer',
    status: EmployeeStatus.ACTIVE,
    hireDate: '2023-11-01T09:00:00Z',
    joinedDaysAgo: 185,
  },
];
