/**
 * Standard API response shapes — use in server handlers and client parsers.
 */
export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export interface ApiSuccessResponse<T = Record<string, unknown>> {
  success: true;
  data?: T;
  [key: string]: unknown;
}

export type ApiResponse<T = Record<string, unknown>> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

export function isApiErrorResponse(
  body: unknown,
): body is ApiErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as ApiErrorResponse).success === false &&
    typeof (body as ApiErrorResponse).error?.message === "string"
  );
}

export function apiErrorCode(
  status: number,
  fallback = "REQUEST_FAILED",
): string {
  if (status === 400) return "VALIDATION_ERROR";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 405) return "METHOD_NOT_ALLOWED";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "INTERNAL_ERROR";
  return fallback;
}
