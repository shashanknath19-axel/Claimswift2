export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  requestId?: string;
  // Backward-compatible fields for transitional payloads.
  success?: boolean;
  errorCode?: string;
  timestamp?: string;
  path?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  code?: string;
  message: string;
  requestId?: string;
  timestamp?: string;
  path?: string;
  errorCode?: string;
  errors?: string[];
}
