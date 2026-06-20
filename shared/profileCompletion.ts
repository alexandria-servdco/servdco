export interface FamilyProfileInput {
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  email_verified?: boolean;
  dietary_preferences?: string[] | null;
}

export interface ProfileCompletionDetail {
  completed: number;
  total: number;
  percent: number;
  missing: string[];
}

const FAMILY_FIELDS: Array<{
  key: keyof FamilyProfileInput;
  label: string;
  check: (p: FamilyProfileInput) => boolean;
}> = [
  { key: "phone", label: "Phone number", check: (p) => Boolean(p.phone?.trim()) },
  { key: "city", label: "City", check: (p) => Boolean(p.city?.trim()) },
  { key: "state", label: "State", check: (p) => Boolean(p.state?.trim()) },
  { key: "zip", label: "ZIP code", check: (p) => Boolean(p.zip?.trim()) },
  {
    key: "dietary_preferences",
    label: "Dietary preferences",
    check: (p) => Boolean(p.dietary_preferences?.length),
  },
  {
    key: "email_verified",
    label: "Email verification",
    check: (p) => Boolean(p.email_verified),
  },
];

export function getFamilyProfileCompletionDetail(
  profile: FamilyProfileInput,
): ProfileCompletionDetail {
  const missing = FAMILY_FIELDS.filter((f) => !f.check(profile)).map(
    (f) => f.label,
  );
  const completed = FAMILY_FIELDS.length - missing.length;
  const total = FAMILY_FIELDS.length;
  const percent =
    total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  return { completed, total, percent, missing };
}

export function getFamilyProfileMissingFields(
  profile: FamilyProfileInput,
): string[] {
  return getFamilyProfileCompletionDetail(profile).missing;
}

export function calculateFamilyProfileCompletion(
  profile: FamilyProfileInput,
): number {
  return getFamilyProfileCompletionDetail(profile).percent;
}

export interface ChefProfileCompletionInput {
  avatar_url?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  cuisines?: string[] | null;
  availabilityCount: number;
  servSafeSubmitted?: boolean;
  insuranceSubmitted?: boolean;
  backgroundCheckSubmitted?: boolean;
  verification_status?: string | null;
}

const CHEF_CHECKS: Array<(input: ChefProfileCompletionInput) => boolean> = [
  (i) => Boolean(i.avatar_url?.trim()),
  (i) => Boolean(i.bio?.trim()),
  (i) => Boolean(i.cuisines?.length),
  (i) => i.availabilityCount > 0,
  (i) => Boolean(i.city?.trim() && i.state?.trim()),
  (i) => Boolean(i.servSafeSubmitted),
  (i) => Boolean(i.insuranceSubmitted),
  (i) => Boolean(i.backgroundCheckSubmitted),
  (i) => i.verification_status === "approved",
];

export function getChefProfileCompletionDetail(
  input: ChefProfileCompletionInput,
): ProfileCompletionDetail {
  const completed = CHEF_CHECKS.filter((check) => check(input)).length;
  const total = CHEF_CHECKS.length;
  const percent =
    total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  return { completed, total, percent, missing: [] };
}

export function calculateChefProfileCompletion(
  input: ChefProfileCompletionInput,
): number {
  return getChefProfileCompletionDetail(input).percent;
}

export function profileCompletionLabel(percent: number): string {
  return percent >= 100 ? "Profile Complete" : "Complete your profile";
}
