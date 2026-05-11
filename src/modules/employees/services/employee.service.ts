import { PaginatedResponse, Result } from '@/types/api';
import { EmployeeQueryParams, EmployeeResponseDTO } from '../dto/employee.dto';

export class EmployeeService {
  /**
   * Fetches employees from the API with filtering and pagination.
   */
  static async getEmployees(
    params: EmployeeQueryParams
  ): Promise<Result<PaginatedResponse<EmployeeResponseDTO>>> {
    try {
      // Construct query parameters
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.status && params.status !== 'All') query.append('status', params.status);
      if (params.search) query.append('search', params.search);

      const response = await fetch(`/api/employees?${query.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: {
            code: result.code || 'API_ERROR',
            message: result.message || 'Failed to fetch employees.',
          },
        };
      }

      // Note: In this phase, we simplify the meta mapping to match existing UI
      return {
        success: true,
        data: {
          data: result.data,
          meta: {
            total: result.data.length,
            page: params.page || 1,
            limit: params.limit || 10,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      };
    } catch (e: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: e.message || 'An unexpected network error occurred.',
        },
      };
    }
  }
}

