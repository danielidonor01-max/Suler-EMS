// Standardized Error Response
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>; // e.g. validation errors
}

// Standardized Success Response
export interface SuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// The Result<T> pattern for pure service returns
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: ErrorResponse };
