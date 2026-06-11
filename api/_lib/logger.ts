/**
 * Serverless / API route logger (Vercel functions).
 */

export type ApiLogContext = {
  route?: string;
  eventId?: string;
  userId?: string;
  [key: string]: unknown;
};

export const apiLogger = {
  info: (message: string, ctx?: ApiLogContext) => {
    console.info(JSON.stringify({ level: "info", message, ...ctx }));
  },
  warn: (message: string, ctx?: ApiLogContext) => {
    console.warn(JSON.stringify({ level: "warn", message, ...ctx }));
  },
  error: (message: string, ctx?: ApiLogContext) => {
    console.error(JSON.stringify({ level: "error", message, ...ctx }));
  },
};
