export interface FamilyProfileInput {
  avatar_url?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  email_verified?: boolean;
  /** Street or full address line when available on profile. */
  address_line?: string | null;
}

export interface ProfileCompletionDetail {
  completed: number;
  total: number;
  percent: number;
}

const FAMILY_FIELDS: Array<{
  key: keyof FamilyProfileInput;
  check: (p: FamilyProfileInput) => boolean;
}> = [
  { key: "avatar_url", check: (p) => Boolean(p.avatar_url?.trim()) },
  { key: "phone", check: (p) => Boolean(p.phone?.trim()) },
  { key: "city", check: (p) => Boolean(p.city?.trim()) },
  { key: "state", check: (p) => Boolean(p.state?.trim()) },
  { key: "zip", check: (p) => Boolean(p.zip?.trim()) },
  { key: "email_verified", check: (p) => Boolean(p.email_verified) },
  {
    key: "address_line",
    check: (p) =>
      Boolean(p.address_line?.trim()) ||
      Boolean(p.city?.trim() && p.state?.trim() && p.zip?.trim()),
  },
];

export function getFamilyProfileCompletionDetail(
  profile: FamilyProfileInput,
): ProfileCompletionDetail {
  const completed = FAMILY_FIELDS.filter((f) => f.check(profile)).length;
  const total = FAMILY_FIELDS.length;
  const percent =
    total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  return { completed, total, percent };
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
  return { completed, total, percent };
}

export function calculateChefProfileCompletion(
  input: ChefProfileCompletionInput,
): number {
  return getChefProfileCompletionDetail(input).percent;
}

export function profileCompletionLabel(percent: number): string {
  return percent >= 100 ? "Profile Complete" : "Complete your profile";
}
