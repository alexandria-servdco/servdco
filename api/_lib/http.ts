import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiErrorCode } from "../../shared/apiResponse.js";

export function json(
  res: VercelResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  res.status(status).json(body);
}

/** Standard error envelope — no stack traces, consistent shape. */
export function apiError(
  res: VercelResponse,
  status: number,
  message: string,
  code?: string,
): void {
  json(res, status, {
    success: false,
    error: {
      code: code ?? apiErrorCode(status),
      message,
    },
  });
}

export function apiSuccess(
  res: VercelResponse,
  status: number,
  data: Record<string, unknown> = {},
): void {
  json(res, status, { success: true, ...data });
}

export function methodNotAllowed(res: VercelResponse): void {
  apiError(res, 405, "Method not allowed");
}

export function readBearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}
