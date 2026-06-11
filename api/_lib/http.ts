import type { VercelRequest, VercelResponse } from "@vercel/node";

export function json(
  res: VercelResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  res.status(status).json(body);
}

export function methodNotAllowed(res: VercelResponse): void {
  json(res, 405, { error: "Method not allowed" });
}

export function readBearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}
