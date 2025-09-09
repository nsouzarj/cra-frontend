export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: number;
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}