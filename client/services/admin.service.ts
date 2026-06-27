import { DocumentsSupabaseService } from "@/services/supabase/documents.service";
import { InterestSupabaseService } from "@/services/supabase/interest.service";
import { AdminModerationSupabaseService } from "@/services/supabase/admin-moderation.service";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import { NotificationsSupabaseService } from "@/services/supabase/notifications.service";
import { getSupabaseClient } from "@/lib/supabase/client";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";
import {
  adminDocumentStatusSchema,
  chefVerificationStatusSchema,
  interestSchema,
  formatZodError,
} from "@shared/validation";

async function notifyChefForDocument(
  chefProfileId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  metadata: Record<string, unknown>,
) {
  const client = getSupabaseClient();
  if (!client) return;

  const { data: chef } = await client
    .from("chef_profiles")
    .select("user_id")
    .eq("id", chefProfileId)
    .maybeSingle();

  if (!chef?.user_id) return;

  await NotificationsSupabaseService.createForUser({
    userId: chef.user_id,
    title,
    message,
    type,
    metadata,
  }).catch(() => {});
}

export const AdminService = {
  async getDocuments() {
    assertSupabaseConfigured();
    return DocumentsSupabaseService.list();
  },

  async verifyDocument(
    id: string,
    status: "pending" | "approved" | "rejected",
    reviewNotes?: string,
  ) {
    assertSupabaseConfigured();
    const statusParsed = adminDocumentStatusSchema.safeParse(status);
    if (!statusParsed.success) {
      throw new Error(formatZodError(statusParsed.error));
    }
    const doc = await DocumentsSupabaseService.updateStatus(
      id,
      statusParsed.data,
      reviewNotes,
    );

    const actionMap = {
      approved: "document.approved",
      rejected: "document.rejected",
      pending: "document.resubmit_requested",
    } as const;

    await AdminAuditService.log({
      action: actionMap[statusParsed.data],
      entityType: "chef_document",
      entityId: id,
      metadata: {
        chef_profile_id: doc.chef_profile_id,
        document_type: doc.type,
        review_notes: reviewNotes ?? null,
      },
    });

    return { success: true, document: doc };
  },

  async requestDocumentResubmission(id: string, reviewNotes: string) {
    assertSupabaseConfigured();
    if (!reviewNotes.trim()) {
      throw new Error("Resubmission instructions are required.");
    }

    const doc = await DocumentsSupabaseService.updateStatus(
      id,
      "pending",
      reviewNotes.trim(),
    );

    await notifyChefForDocument(
      doc.chef_profile_id,
      "Document Resubmission Requested",
      `Please resubmit your ${doc.type}. ${reviewNotes.trim()}`,
      "warning",
      { document_id: id, event: "document_resubmit_requested" },
    );

    await AdminAuditService.log({
      action: "document.resubmit_requested",
      entityType: "chef_document",
      entityId: id,
      metadata: {
        chef_profile_id: doc.chef_profile_id,
        document_type: doc.type,
        review_notes: reviewNotes.trim(),
      },
    });

    return { success: true, document: doc };
  },

  async getInterestRequests() {
    assertSupabaseConfigured();
    return InterestSupabaseService.list();
  },

  async submitInterest(params: {
    name: string;
    email: string;
    city: string;
    state: string;
    role: "family" | "chef" | "both";
  }) {
    assertSupabaseConfigured();
    const parsed = interestSchema.safeParse(params);
    if (parsed.success === false) {
      throw new Error(formatZodError(parsed.error));
    }
    return InterestSupabaseService.register({
      name: parsed.data.name,
      email: parsed.data.email,
      city: parsed.data.city,
      state: parsed.data.state,
      role: parsed.data.role,
    });
  },

  async submitDocuments(params: {
    chefProfileId: string;
    documents: Array<{
      type: string;
      url: string;
      storagePath?: string;
      bucket?: string;
    }>;
  }) {
    assertSupabaseConfigured();
    const docs = await DocumentsSupabaseService.submit(params);
    return { success: true, documents: docs };
  },

  async listOrphanedDocuments() {
    assertSupabaseConfigured();
    return DocumentsSupabaseService.listOrphaned();
  },

  async removeOrphanedDocument(id: string) {
    assertSupabaseConfigured();
    await DocumentsSupabaseService.softDelete(id);
    return { success: true };
  },

  async updateChefStatus(
    id: string,
    status: "approved" | "pending" | "rejected" | "suspended",
    rejectionReason?: string,
  ) {
    assertSupabaseConfigured();
    const parsed = chefVerificationStatusSchema.safeParse(status);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }
    await AdminModerationSupabaseService.updateChefVerification(
      id,
      parsed.data,
      rejectionReason,
    );
    return { success: true };
  },

  async suspendCookAccount(userId: string, reason?: string) {
    assertSupabaseConfigured();
    await AdminModerationSupabaseService.suspendCookAccount(userId, reason);
    return { success: true };
  },

  async permanentDeleteUser(userId: string, confirmEmail: string) {
    assertSupabaseConfigured();
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client unavailable");

    const { data: session } = await client.auth.getSession();
    const token = session.session?.access_token;
    if (!token) throw new Error("Admin session required.");

    const res = await fetch("/api/admin/permanent-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, confirmEmail }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      throw new Error(body.message ?? body.error ?? "Permanent delete failed.");
    }
    return { success: true };
  },
};
