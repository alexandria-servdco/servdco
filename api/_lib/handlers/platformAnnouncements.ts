import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getServiceRoleClient } from "../supabase/serviceRole.js";

interface GlobalAnnouncement {
  id: string;
  title: string;
  body: string;
  active: boolean;
}

export async function handlePlatformAnnouncements(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = getServiceRoleClient();
    const { data, error } = await client
      .from("platform_settings")
      .select("value")
      .eq("key", "global_announcements")
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: "Failed to load announcements" });
    }

    const raw = data?.value;
    let parsed: GlobalAnnouncement[] = [];
    if (raw) {
      const value = typeof raw === "string" ? JSON.parse(raw) : raw;
      parsed = Array.isArray(value) ? value : [];
    }

    const announcements = parsed.filter((item) => item.active);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ announcements });
  } catch {
    return res.status(500).json({ error: "Failed to load announcements" });
  }
}
