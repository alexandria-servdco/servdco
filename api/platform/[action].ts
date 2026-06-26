import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleWaitlistSubmit } from "../_lib/handlers/waitlistSubmit.js";
import { handleSecurityEnforce } from "../_lib/handlers/securityEnforce.js";
import { handlePlatformAnnouncements } from "../_lib/handlers/platformAnnouncements.js";
import { handleCareersApplicationNotify } from "../_lib/handlers/careersApplicationNotify.js";

const ACTIONS = {
  waitlist: handleWaitlistSubmit,
  enforce: handleSecurityEnforce,
  announcements: handlePlatformAnnouncements,
  "careers-application-notify": handleCareersApplicationNotify,
} as const;

type PlatformAction = keyof typeof ACTIONS;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? "") as PlatformAction;
  const routeHandler = ACTIONS[action];

  if (!routeHandler) {
    return res.status(404).json({ error: "Unknown platform action." });
  }

  return routeHandler(req, res);
}
