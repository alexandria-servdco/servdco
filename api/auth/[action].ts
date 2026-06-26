import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? "");

  try {
    switch (action) {
      case "login": {
        const { handleAuthLogin } = await import("../_lib/handlers/authLogin.js");
        return handleAuthLogin(req, res);
      }
      case "signup": {
        const { handleAuthSignup } = await import("../_lib/handlers/authSignup.js");
        return handleAuthSignup(req, res);
      }
      case "resend-confirmation": {
        const { handleAuthResendConfirmation } = await import(
          "../_lib/handlers/authResendConfirmation.js"
        );
        return handleAuthResendConfirmation(req, res);
      }
      default:
        return res.status(404).json({
          error: "This auth action is not available.",
          code: "NOT_FOUND",
        });
    }
  } catch (err) {
    console.error(`[auth.${action}]`, err instanceof Error ? err.message : err);
    return res.status(500).json({
      error: "Something unexpected happened. Please try again in a moment.",
      code: "SERVER_ERROR",
      title: "Something unexpected happened",
      message: "We've logged this issue automatically.",
      guidance:
        "Please try again in a moment. If the problem continues, contact support.",
    });
  }
}
