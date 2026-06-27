import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? "");

  try {
    switch (action) {
      case "permanent-delete": {
        const { handleAdminPermanentDelete } = await import(
          "../_lib/handlers/adminPermanentDelete.js"
        );
        return handleAdminPermanentDelete(req, res);
      }
      default:
        return res.status(404).json({ error: "Unknown admin action." });
    }
  } catch (err) {
    console.error(`[admin.${action}]`, err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Admin action failed." });
  }
}
