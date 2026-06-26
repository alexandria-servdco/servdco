/** Central rate-limit policies — keys map to Upstash sliding windows. */
export type RateLimitPolicyKey =
  | "signup"
  | "login"
  | "contact"
  | "waitlist"
  | "messaging"
  | "booking_create"
  | "review_submit"
  | "email_event"
  | "careers_notify"
  | "stripe_default";

export type RateLimitPolicy = {
  /** Upstash key prefix */
  prefix: string;
  /** Max requests per window */
  limit: number;
  /** Window duration (e.g. "1 h", "30 m") */
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
  /** Scope for identity key */
  scope: "ip" | "user";
};

export const RATE_LIMIT_POLICIES: Record<RateLimitPolicyKey, RateLimitPolicy> = {
  signup: { prefix: "rl:signup", limit: 5, window: "1 h", scope: "ip" },
  login: { prefix: "rl:login", limit: 20, window: "1 h", scope: "ip" },
  contact: { prefix: "rl:contact", limit: 10, window: "1 h", scope: "ip" },
  waitlist: { prefix: "rl:waitlist", limit: 10, window: "1 h", scope: "ip" },
  messaging: { prefix: "rl:messaging", limit: 30, window: "1 m", scope: "user" },
  booking_create: { prefix: "rl:booking", limit: 10, window: "1 h", scope: "user" },
  review_submit: { prefix: "rl:review", limit: 5, window: "1 d", scope: "user" },
  email_event: { prefix: "rl:email", limit: 20, window: "1 m", scope: "ip" },
  careers_notify: { prefix: "rl:careers", limit: 10, window: "1 h", scope: "ip" },
  stripe_default: { prefix: "rl:stripe", limit: 30, window: "1 m", scope: "ip" },
};
