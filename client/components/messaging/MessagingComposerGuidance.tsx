const SENSITIVE_ITEMS = [
  "passwords",
  "banking credentials",
  "social security numbers",
  "government IDs",
  "payment card numbers",
  "verification codes",
] as const;

export function MessagingComposerGuidance() {
  return (
    <p
      className="px-3 sm:px-4 pb-1 text-[9px] sm:text-[10px] text-[#6B6B6B] leading-relaxed"
      id="messaging-composer-guidance"
    >
      Do not share: {SENSITIVE_ITEMS.map((item) => `• ${item}`).join(" ")}
    </p>
  );
}
