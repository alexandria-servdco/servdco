import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  CareerApplication,
  CareerApplicationStatus,
  CareerJob,
  CareerJobStatus,
} from "@shared/careers";
import { EmailService } from "@/services/email.service";
import { SupabaseQueryError } from "./fallback";

export const careersQueryKeys = {
  all: ["careers"] as const,
  jobs: () => [...careersQueryKeys.all, "jobs"] as const,
  publishedJobs: () => [...careersQueryKeys.all, "jobs", "published"] as const,
  job: (id: string) => [...careersQueryKeys.all, "job", id] as const,
  applications: () => [...careersQueryKeys.all, "applications"] as const,
};

function mapJob(row: Record<string, unknown>): CareerJob {
  return row as unknown as CareerJob;
}

function mapApplication(
  row: Record<string, unknown> & { career_jobs?: { title: string } | null },
): CareerApplication {
  const { career_jobs, ...rest } = row;
  return {
    ...(rest as unknown as CareerApplication),
    job_title: career_jobs?.title ?? null,
  };
}

export const CareersSupabaseService = {
  async listPublishedJobs(): Promise<CareerJob[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("career_jobs")
      .select("*")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map(mapJob);
  },

  async getPublishedJob(id: string): Promise<CareerJob | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("career_jobs")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    return data ? mapJob(data) : null;
  },

  async listAllJobs(): Promise<CareerJob[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("career_jobs")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map(mapJob);
  },

  async upsertJob(
    input: Omit<CareerJob, "created_at" | "updated_at" | "published_at"> & {
      id?: string;
      published_at?: string | null;
    },
  ): Promise<CareerJob> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id ?? null;
    const now = new Date().toISOString();

    const payload = {
      ...input,
      published_at:
        input.status === "published"
          ? input.published_at ?? now
          : input.status === "draft"
            ? null
            : input.published_at ?? null,
      updated_by: userId,
      updated_at: now,
      ...(input.id ? {} : { created_by: userId, created_at: now }),
    };

    const { data, error } = await client
      .from("career_jobs")
      .upsert(payload)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return mapJob(data);
  },

  async setJobStatus(id: string, status: CareerJobStatus): Promise<CareerJob> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const now = new Date().toISOString();
    const { data, error } = await client
      .from("career_jobs")
      .update({
        status,
        published_at: status === "published" ? now : undefined,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return mapJob(data);
  },

  async deleteJob(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const { error } = await client
      .from("career_jobs")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: authData.user?.id ?? null,
      })
      .eq("id", id);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  async listApplications(): Promise<CareerApplication[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("career_applications")
      .select("*, career_jobs(title)")
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map((row) => mapApplication(row as never));
  },

  async updateApplication(
    id: string,
    updates: Partial<Pick<CareerApplication, "status" | "notes">>,
  ): Promise<CareerApplication> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("career_applications")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, career_jobs(title)")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return mapApplication(data as never);
  },

  async submitApplication(params: {
    job_id?: string | null;
    name: string;
    email: string;
    phone?: string | null;
    linkedin?: string | null;
    portfolio?: string | null;
    cover_letter?: string | null;
    resumeFile?: File | null;
  }): Promise<CareerApplication> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const applicationId = crypto.randomUUID();
    const now = new Date().toISOString();
    let resumeStoragePath: string | null = null;

    if (params.resumeFile) {
      const ext =
        params.resumeFile.name.split(".").pop()?.toLowerCase() || "pdf";
      resumeStoragePath = `applications/${applicationId}/resume.${ext}`;
      const { error: uploadError } = await client.storage
        .from("career-resumes")
        .upload(resumeStoragePath, params.resumeFile, { upsert: false });

      if (uploadError) {
        throw new SupabaseQueryError(uploadError.message);
      }
    }

    const { error } = await client.from("career_applications").insert({
      id: applicationId,
      job_id: params.job_id ?? null,
      name: params.name,
      email: params.email,
      phone: params.phone ?? null,
      linkedin: params.linkedin || null,
      portfolio: params.portfolio || null,
      cover_letter: params.cover_letter ?? null,
      resume_storage_path: resumeStoragePath,
    });

    if (error) throw new SupabaseQueryError(error.message, error);

    void EmailService.sendCareerApplicationNotify(applicationId);

    return {
      id: applicationId,
      job_id: params.job_id ?? null,
      name: params.name,
      email: params.email,
      phone: params.phone ?? null,
      linkedin: params.linkedin || null,
      portfolio: params.portfolio || null,
      resume_storage_path: resumeStoragePath,
      resume_bucket: "career-resumes",
      cover_letter: params.cover_letter ?? null,
      status: "applied",
      notes: null,
      created_at: now,
      updated_at: now,
    };
  },

  async getResumeSignedUrl(path: string): Promise<string | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client.storage
      .from("career-resumes")
      .createSignedUrl(path, 60 * 15);

    if (error) throw new SupabaseQueryError(error.message, error);
    return data?.signedUrl ?? null;
  },
};
