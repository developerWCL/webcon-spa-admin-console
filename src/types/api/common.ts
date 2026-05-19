/**
 * Generic API Response and Request types
 *
 * These are the standard response shapes returned by the backend API.
 * All API endpoints should conform to these generic patterns.
 */

/**
 * Standard API Response wrapper for all endpoints
 *
 * @template T The type of data being returned
 *
 * @example
 * const response: ApiResponse<User> = await fetch('/api/users/1')
 * const response: ApiResponse<User[]> = await fetch('/api/users')
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: ApiMeta;
  timestamp?: string;
}

/**
 * Pagination metadata included in paginated responses
 */
export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

/**
 * Generic metadata that can be included in API responses
 */
export interface ApiMeta extends PaginationMeta {
  [key: string]: any;
}

/**
 * Standard error response from API
 */
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
  details?: Record<string, string[]>;
  timestamp?: string;
}

/**
 * Success response with paginated data
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: ApiResponse<any>): response is ApiError {
  return response.success === false;
}

/**
 * Type guard to check if response has pagination
 * Note: This checks for pagination metadata, not the response structure
 */
export function hasPagination<T = any>(
  response: ApiResponse<T>,
): response is ApiResponse<T> & { meta: PaginationMeta } {
  return response.meta !== undefined && "totalPages" in response.meta;
}
