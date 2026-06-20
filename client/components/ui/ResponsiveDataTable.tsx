import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Desktop table wrapper — hidden below md. */
export function DesktopTableView({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("hidden md:block overflow-x-auto", className)}>{children}</div>;
}

/** Mobile card stack — hidden at md+. */
export function MobileCardStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("md:hidden space-y-3", className)}>{children}</div>;
}

export function MobileDataCard({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/8 bg-[#111111]/80 p-4 space-y-2",
        className,
      )}
    >
      {children}
      {actions ? (
        <div className="pt-2 flex flex-wrap gap-2 border-t border-white/5 mt-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function MobileFieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 py-1.5 border-b border-white/5 last:border-0",
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#A8A8A8] shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-xs text-white text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

/** Shared admin table card shell — responsive padding. */
export function AdminTableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-card-shell bg-[#1A1A1A] rounded-2xl md:rounded-3xl p-4 md:p-7 border border-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
