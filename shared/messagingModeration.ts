/**
 * Extensible messaging moderation hooks — no AI, rule-based only.
 * Wire into send flows (client + future server) without redesigning messaging UI.
 */

export type MessageModerationFlag =
  | "off_platform_payment"
  | "sensitive_data"
  | "none";

export type MessageModerationResult = {
  flag: MessageModerationFlag;
  /** Optional user-facing hint when a rule matches; empty when none. */
  hint: string;
};

const OFF_PLATFORM_PATTERNS: RegExp[] = [
  /\bvenmo\b/i,
  /\bcash\s*app\b/i,
  /\bzelle\b/i,
  /\bpaypal\.me\b/i,
  /\bpay\s+outside\b/i,
  /\boff[\s-]?platform\b/i,
  /\bwire\s+transfer\b/i,
  /\bdirect\s+deposit\b/i,
];

const SENSITIVE_PATTERNS: RegExp[] = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\bssn\b/i,
  /\bsocial\s+security\b/i,
  /\b(?:\d{4}[\s-]?){3}\d{4}\b/,
];

/** Evaluate draft message text against platform safety rules. */
export function evaluateMessageModeration(content: string): MessageModerationResult {
  const text = content.trim();
  if (!text) return { flag: "none", hint: "" };

  if (OFF_PLATFORM_PATTERNS.some((re) => re.test(text))) {
    return {
      flag: "off_platform_payment",
      hint: "Keep payments on Servd Co. Off-platform transactions are not protected by platform policies.",
    };
  }

  if (SENSITIVE_PATTERNS.some((re) => re.test(text))) {
    return {
      flag: "sensitive_data",
      hint: "Avoid sharing sensitive personal or payment information in messages.",
    };
  }

  return { flag: "none", hint: "" };
}
