import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAuthLogin } from "../_lib/handlers/authLogin.js";
import { handleAuthSignup } from "../_lib/handlers/authSignup.js";
import { handleAuthResendConfirmation } from "../_lib/handlers/authResendConfirmation.js";

const ACTIONS = {
  login: handleAuthLogin,
  signup: handleAuthSignup,
  "resend-confirmation": handleAuthResendConfirmation,
} as const;

type AuthAction = keyof typeof ACTIONS;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? "") as AuthAction;
  const routeHandler = ACTIONS[action];

  if (!routeHandler) {
    return res.status(404).json({
      error: "This auth action is not available.",
      code: "NOT_FOUND",
    });
  }

  try {
    return await routeHandler(req, res);
  } catch (err) {
    console.error(`[auth.${action}]`, err instanceof Error ? err.message : err);
    return res.status(500).json({
      error: "Something unexpected happened. Please try again in a moment.",
      code: "SERVER_ERROR",
      title: "Something unexpected happened",
      message: "We've logged this issue automatically.",
      guidance: "Please try again in a moment. If the problem continues, contact support.",
    });
  }
}
