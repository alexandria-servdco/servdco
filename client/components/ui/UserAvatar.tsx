import { cn } from "@/lib/utils";
import { getInitials, resolveAvatarUrl } from "@/lib/avatar";

type UserAvatarProps = {
  name?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-12 h-12 text-xs",
  lg: "w-20 h-20 text-sm",
};

export function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const resolved = resolveAvatarUrl(imageUrl);
  const initials = getInitials(name);

  if (resolved) {
    return (
      <img
        src={resolved}
        alt={name ? `${name} avatar` : "Profile"}
        className={cn(
          "rounded-full object-cover border border-white/10 bg-[#1A1A1A]",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold border border-white/10 bg-gradient-to-br from-[#FF7A59]/30 to-[#2A2A2A] text-white",
        sizeClasses[size],
        className,
      )}
      aria-label={name ? `${name} initials` : "User initials"}
    >
      {initials}
    </div>
  );
}
