import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { enforceRateLimit } from "../rateLimit.js";
import { verifySupabaseUser } from "../auth.js";
import { sendDocumentAdminNotificationEmail } from "../email/documentVerificationEmails.js";

const requestSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(20),
  isResubmission: z.boolean().optional(),
});

export async function handleDocumentSubmitNotify(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (
    !(await enforceRateLimit(req, res, "document_notify", {
      route: "/api/platform/document-submit-notify",
    }))
  ) {
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7).trim();
  const user = await verifySupabaseUser(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const auth = { userId: user.id };

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const client = getServiceRoleClient();
  const { documentIds, isResubmission = false } = parsed.data;

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", auth.userId)
    .maybeSingle();

  const { data: documents, error } = await client
    .from("chef_documents")
    .select(
      "id, chef_profile_id, document_type, submitted_at, status, chef_profiles(display_name, user_id)",
    )
    .in("id", documentIds)
    .is("deleted_at", null);

  if (error) {
    console.error("[document.submit-notify] fetch", error);
    res.status(500).json({ error: "Could not load documents." });
    return;
  }

  if (!documents?.length) {
    res.status(404).json({ error: "Documents not found." });
    return;
  }

  const isAdmin = profile?.role === "admin";
  for (const doc of documents) {
    const chefProfile = doc.chef_profiles as {
      display_name?: string | null;
      user_id?: string;
    } | null;
    if (!isAdmin && chefProfile?.user_id !== auth.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const emailResults = await Promise.all(
    documents.map((doc) => {
      const chefProfile = doc.chef_profiles as {
        display_name?: string | null;
      } | null;
      return sendDocumentAdminNotificationEmail({
        chefName: chefProfile?.display_name?.trim() || "Cook",
        documentType: doc.document_type,
        documentId: doc.id,
        chefProfileId: doc.chef_profile_id,
        submittedAt: doc.submitted_at,
        isResubmission,
      });
    }),
  );

  res.status(200).json({
    success: true,
    notified: documents.length,
    emails: emailResults.map((r) => ({ sent: r.ok, id: r.id ?? null })),
  });
}
