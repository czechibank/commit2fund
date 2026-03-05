import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { type AppError, validationError } from "@/lib/errors";
import { formatSuccess, formatError, type PaginationMeta } from "@/lib/response";
import { type ZodType } from "zod/v4";

export function validateWithResult<T>(schema: ZodType<T>, data: unknown): ResultAsync<T, AppError> {
  const result = schema.safeParse(data);
  if (result.success) {
    return okAsync(result.data);
  }
  const details = result.error.issues.map((issue) => ({
    code: "VALIDATION_ERROR" as const,
    field: issue.path.join("."),
    message: issue.message,
  }));
  return errAsync(validationError("Validation error", details));
}

export async function toApiResponse<T>(
  result: ResultAsync<T, AppError>,
  message: string,
  statusCode = 200,
): Promise<Response> {
  const r = await result;
  if (r.isOk()) {
    return Response.json(formatSuccess(r.value, message), { status: statusCode });
  }
  return Response.json(formatError(r.error), { status: r.error.statusCode });
}

export async function toPaginatedApiResponse<T, B>(
  result: ResultAsync<T, AppError>,
  message: string,
  extract: (data: T) => { body: B; pagination: PaginationMeta },
): Promise<Response> {
  const r = await result;
  if (r.isOk()) {
    const { body, pagination } = extract(r.value);
    return Response.json(formatSuccess(body, message, pagination), { status: 200 });
  }
  return Response.json(formatError(r.error), { status: r.error.statusCode });
}
