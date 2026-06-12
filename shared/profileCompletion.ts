export interface FamilyProfileInput {
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  email?: string | null;
}

export function calculateFamilyProfileCompletion(
  profile: FamilyProfileInput,
): number {
  const fields = [
    profile.full_name?.trim(),
    profile.phone?.trim(),
    profile.city?.trim(),
    profile.state?.trim(),
    profile.zip?.trim(),
    profile.email?.trim(),
  ];
  const filled = fields.filter(Boolean).length;
  if (filled === 0) return 0;
  return Math.min(100, Math.round((filled / fields.length) * 100));
}

export interface ChefProfileCompletionInput {
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  bio?: string | null;
  cuisines?: string[] | null;
  availabilityCount: number;
  documentsSubmittedCount: number;
  verification_status?: string | null;
}

const REQUIRED_DOC_TYPES = 3;

export function calculateChefProfileCompletion(
  input: ChefProfileCompletionInput,
): number {
  const checks = [
    Boolean(input.full_name?.trim()),
    Boolean(input.avatar_url?.trim()),
    Boolean(input.city?.trim() && input.state?.trim()),
    Boolean(input.phone?.trim()),
    Boolean(input.bio?.trim()),
    Boolean(input.cuisines?.length),
    input.availabilityCount > 0,
    input.documentsSubmittedCount >= REQUIRED_DOC_TYPES,
    input.verification_status === "approved",
  ];
  const filled = checks.filter(Boolean).length;
  return Math.min(100, Math.round((filled / checks.length) * 100));
}

export function profileCompletionLabel(percent: number): string {
  return percent >= 100 ? "Profile Complete" : "Complete your profile";
}
