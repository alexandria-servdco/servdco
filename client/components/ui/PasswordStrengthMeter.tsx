import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export type PasswordChecks = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

export function evaluatePassword(password: string): {
  checks: PasswordChecks;
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
} {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const label =
    score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  return { checks, score, label };
}

export function isPasswordStrongEnough(checks: PasswordChecks): boolean {
  if (!checks.length) return false;
  const diversity = [
    checks.uppercase,
    checks.lowercase,
    checks.number,
    checks.special,
  ].filter(Boolean).length;
  return diversity >= 2;
}

export const PASSWORD_REQUIREMENT_HINT =
  "Use at least 8 characters with two or more character types (letters, numbers, or symbols).";

type PasswordStrengthMeterProps = {
  password: string;
  className?: string;
};

const REQUIREMENTS: { key: keyof PasswordChecks; label: string; optional?: boolean }[] = [
  { key: "length", label: "At least 8 characters" },
  { key: "uppercase", label: "Uppercase letter", optional: true },
  { key: "lowercase", label: "Lowercase letter", optional: true },
  { key: "number", label: "Number", optional: true },
  { key: "special", label: "Symbol (optional)", optional: true },
];

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const { checks, score, label } = evaluatePassword(password);
  const diversity = [
    checks.uppercase,
    checks.lowercase,
    checks.number,
    checks.special,
  ].filter(Boolean).length;
  const meetsModerate = isPasswordStrongEnough(checks);

  if (!password) return null;

  const barColor =
    score <= 2
      ? "bg-red-500"
      : score === 3
        ? "bg-amber-500"
        : score === 4
          ? "bg-[#FF7A59]"
          : "bg-emerald-500";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barColor)}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#A8A8A8] shrink-0">
          {label}
        </span>
      </div>
      <p className="text-[10px] text-[#A8A8A8] leading-relaxed">
        {meetsModerate
          ? "Password meets requirements."
          : PASSWORD_REQUIREMENT_HINT}
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {REQUIREMENTS.map(({ key, label: reqLabel, optional }) => {
          const met = checks[key];
          const diversityMet = key === "length" ? met : diversity >= 2;
          const showMet =
            key === "length" ? met : optional ? diversityMet && met : met;
          return (
            <li
              key={key}
              className={cn(
                "flex items-center gap-1.5 text-[10px]",
                showMet ? "text-emerald-400" : "text-[#A8A8A8]",
              )}
            >
              {showMet ? <Check size={11} /> : <X size={11} className="opacity-50" />}
              {reqLabel}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
