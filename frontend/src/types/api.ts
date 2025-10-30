/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ApiResponseBase {
  status: "success" | "error";
  message?: string;
  code?: number;
}

export interface ApiResponse<T = unknown> extends ApiResponseBase {
  data?: T;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
