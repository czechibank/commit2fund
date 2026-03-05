export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

export interface AppError {
  code: AppErrorCode;
  message: string;
  statusCode: number;
  details?: unknown;
}

export function validationError(message: string, details?: unknown): AppError {
  return { code: "VALIDATION_ERROR", message, statusCode: 422, details };
}

export function notFound(message = "Resource not found"): AppError {
  return { code: "NOT_FOUND", message, statusCode: 404 };
}

export function unauthorized(message = "Unauthorized"): AppError {
  return { code: "UNAUTHORIZED", message, statusCode: 401 };
}

export function forbidden(message = "Forbidden"): AppError {
  return { code: "FORBIDDEN", message, statusCode: 403 };
}

export function conflict(message: string): AppError {
  return { code: "CONFLICT", message, statusCode: 409 };
}

export function badRequest(message: string): AppError {
  return { code: "BAD_REQUEST", message, statusCode: 400 };
}

export function internalError(message = "Internal server error"): AppError {
  return { code: "INTERNAL_ERROR", message, statusCode: 500 };
}

export function fromUnknown(
  error: unknown,
  fallbackMessage = "An unexpected error occurred",
): AppError {
  if (error instanceof Error) {
    return internalError(error.message);
  }
  return internalError(fallbackMessage);
}
