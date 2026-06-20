import { getSupabaseClient } from "@/lib/supabase/client";
import type { ChefDocument } from "@/lib/launchOpsTypes";
import { SupabaseQueryError } from "./fallback";

const DOC_TYPE_LABELS: Record<string, string> = {
  servsafe_certificate: "ServSafe Certificate",
  insurance: "Insurance",
  background_check: "Background Check",
  id_verification: "ID Verification",
};

const LABEL_TO_ENUM: Record<string, string> = {
  "ServSafe Certificate": "servsafe_certificate",
  Insurance: "insurance",
  "Background Check": "background_check",
  "ID Verification": "id_verification",
};

export const documentQueryKeys = {
  all: ["chef_documents"] as const,
  list: () => [...documentQueryKeys.all, "list"] as const,
  own: (chefProfileId: string) =>
    [...documentQueryKeys.all, "own", chefProfileId] as const,
};

async function resolveChefNames(ids: string[]): Promise<Map<string, string>> {
  const client = getSupabaseClient();
  const map = new Map<string, string>();
  if (!client || ids.length === 0) return map;

  const { data } = await client
    .from("chef_profiles")
    .select("id, display_name")
    .in("id", ids);

  for (const row of data ?? []) {
    map.set(row.id, row.display_name);
  }
  return map;
}

async function resolveStorageUrl(
  bucket: string,
  path: string,
): Promise<string> {
  if (path.startsWith("http")) return path;
  const client = getSupabaseClient();
  if (!client) return path;
  if (bucket === "cook-documents") {
    const { data } = await client.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? path;
  }
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function mapRow(
  row: {
    id: string;
    chef_profile_id: string;
    document_type: string;
    status: string;
    storage_bucket: string;
    storage_path: string;
    submitted_at: string;
    review_notes?: string | null;
  },
  chefNames: Map<string, string>,
): Promise<ChefDocument> {
  const url = await resolveStorageUrl(row.storage_bucket, row.storage_path);
  return {
    id: row.id,
    chef_profile_id: row.chef_profile_id,
    chef_name: chefNames.get(row.chef_profile_id) ?? "Cook",
    type: DOC_TYPE_LABELS[row.document_type] ?? row.document_type,
    status: row.status as ChefDocument["status"],
    url,
    submitted_at: row.submitted_at,
    review_notes: row.review_notes ?? undefined,
  };
}

export const DocumentsSupabaseService = {
  async listForChef(chefProfileId: string): Promise<ChefDocument[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_documents")
      .select("*")
      .eq("chef_profile_id", chefProfileId)
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = data ?? [];
    const chefNames = await resolveChefNames([chefProfileId]);
    return Promise.all(rows.map((row) => mapRow(row, chefNames)));
  },

  async list(): Promise<ChefDocument[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_documents")
      .select("*")
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = data ?? [];
    const chefNames = await resolveChefNames([
      ...new Set(rows.map((r) => r.chef_profile_id)),
    ]);
    return Promise.all(rows.map((row) => mapRow(row, chefNames)));
  },

  async resubmit(params: {
    documentId: string;
    url: string;
    storagePath: string;
    bucket?: string;
  }): Promise<ChefDocument> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const now = new Date().toISOString();
    const { data, error } = await client
      .from("chef_documents")
      .update({
        storage_path: params.storagePath,
        storage_bucket: params.bucket ?? "cook-documents",
        status: "pending",
        review_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: now,
        updated_at: now,
      })
      .eq("id", params.documentId)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    const chefNames = await resolveChefNames([data.chef_profile_id]);
    return mapRow(data, chefNames);
  },

  async listOrphaned(): Promise<
    Array<{
      id: string;
      chef_name: string;
      document_type: string;
      storage_path: string | null;
      submitted_at: string;
    }>
  > {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_documents")
      .select("id, chef_profile_id, document_type, storage_path, storage_bucket, submitted_at")
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);

    const rows = data ?? [];
    const chefNames = await resolveChefNames([
      ...new Set(rows.map((r) => r.chef_profile_id)),
    ]);

    const orphaned: Array<{
      id: string;
      chef_name: string;
      document_type: string;
      storage_path: string | null;
      submitted_at: string;
    }> = [];

    for (const row of rows) {
      if (!row.storage_path?.trim()) {
        orphaned.push({
          id: row.id,
          chef_name: chefNames.get(row.chef_profile_id) ?? "Cook",
          document_type: row.document_type,
          storage_path: row.storage_path,
          submitted_at: row.submitted_at,
        });
        continue;
      }
      if (row.storage_bucket === "cook-documents") {
        const { error: storageErr } = await client.storage
          .from(row.storage_bucket)
          .createSignedUrl(row.storage_path, 60);
        if (storageErr) {
          orphaned.push({
            id: row.id,
            chef_name: chefNames.get(row.chef_profile_id) ?? "Cook",
            document_type: row.document_type,
            storage_path: row.storage_path,
            submitted_at: row.submitted_at,
          });
        }
      }
    }
    return orphaned;
  },

  async softDelete(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { error } = await client
      .from("chef_documents")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  async submit(params: {
    chefProfileId: string;
    documents: Array<{
      type: string;
      url: string;
      storagePath?: string;
      bucket?: string;
    }>;
  }): Promise<ChefDocument[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const now = new Date().toISOString();
    const inserts = params.documents.map((doc) => ({
      chef_profile_id: params.chefProfileId,
      document_type: (LABEL_TO_ENUM[doc.type] ?? "id_verification") as
        | "servsafe_certificate"
        | "insurance"
        | "background_check"
        | "id_verification",
      storage_bucket: doc.bucket ?? "cook-documents",
      storage_path: doc.storagePath ?? doc.url,
      status: "pending" as const,
      submitted_at: now,
      created_at: now,
      updated_at: now,
    }));

    const { data, error } = await client
      .from("chef_documents")
      .insert(inserts)
      .select("*");

    if (error) throw new SupabaseQueryError(error.message, error);
    const chefNames = await resolveChefNames([params.chefProfileId]);
    return Promise.all((data ?? []).map((row) => mapRow(row, chefNames)));
  },

  async updateStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    reviewNotes?: string,
  ): Promise<ChefDocument> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const { data, error } = await client
      .from("chef_documents")
      .update({
        status,
        review_notes: reviewNotes ?? null,
        reviewed_by: authData.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    const chefNames = await resolveChefNames([data.chef_profile_id]);
    return mapRow(data, chefNames);
  },
};

