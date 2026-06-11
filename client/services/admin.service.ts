import { DocumentsSupabaseService } from "@/services/supabase/documents.service";
import { InterestSupabaseService } from "@/services/supabase/interest.service";
import { AdminModerationSupabaseService } from "@/services/supabase/admin-moderation.service";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";
import {
  adminDocumentStatusSchema,
  chefVerificationStatusSchema,
  interestSchema,
  formatZodError,
} from "@shared/validation";

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

  async updateChefStatus(
    id: string,
    status: "approved" | "pending" | "rejected" | "suspended",
  ) {
    assertSupabaseConfigured();
    const parsed = chefVerificationStatusSchema.safeParse(status);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }
    await AdminModerationSupabaseService.updateChefVerification(
      id,
      parsed.data,
    );
    return { success: true };
  },
};
