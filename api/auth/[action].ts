import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAuthLogin } from "../_lib/handlers/authLogin.js";
import { handleAuthSignup } from "../_lib/handlers/authSignup.js";

const ACTIONS = {
  login: handleAuthLogin,
  signup: handleAuthSignup,
} as const;

type AuthAction = keyof typeof ACTIONS;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? "") as AuthAction;
  const routeHandler = ACTIONS[action];

  if (!routeHandler) {
    return res.status(404).json({ error: "Unknown auth action." });
  }

  return routeHandler(req, res);
}
