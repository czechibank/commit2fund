import { type AppError } from "@/lib/errors";
import { randomUUID } from "crypto";

interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationMeta;
  };
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function formatSuccess<T>(
  data: T,
  message: string,
  pagination?: PaginationMeta,
): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
      ...(pagination ? { pagination } : {}),
    },
  };
}

export function formatError(error: AppError): ApiErrorResponse {
  return {
    success: false,
    message: error.message,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
    },
  };
}
