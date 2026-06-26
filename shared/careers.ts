import { z } from "zod";

export const careerJobStatuses = ["draft", "published", "archived"] as const;
export type CareerJobStatus = (typeof careerJobStatuses)[number];

export const careerApplicationStatuses = [
  "applied",
  "under_review",
  "interview",
  "offer",
  "rejected",
  "hired",
] as const;
export type CareerApplicationStatus = (typeof careerApplicationStatuses)[number];

export const careerApplicationStatusLabels: Record<CareerApplicationStatus, string> = {
  applied: "Applied",
  under_review: "Under Review",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  hired: "Hired",
};

export interface CareerJob {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_range: string | null;
  description: string;
  requirements: string | null;
  benefits: string | null;
  status: CareerJobStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CareerApplication {
  id: string;
  job_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  portfolio: string | null;
  resume_storage_path: string | null;
  resume_bucket: string;
  cover_letter: string | null;
  status: CareerApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job_title?: string | null;
}

export const careerJobInputSchema = z.object({
  title: z.string().min(2).max(200),
  department: z.string().min(1).max(120),
  location: z.string().min(1).max(200),
  employment_type: z.string().min(1).max(80),
  salary_range: z.string().max(120).optional().nullable(),
  description: z.string().min(10),
  requirements: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),
  status: z.enum(careerJobStatuses),
});

export const careerApplicationInputSchema = z.object({
  job_id: z.string().uuid().optional().nullable(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  linkedin: z.string().url().optional().nullable().or(z.literal("")),
  portfolio: z.string().url().optional().nullable().or(z.literal("")),
  cover_letter: z.string().max(5000).optional().nullable(),
});
