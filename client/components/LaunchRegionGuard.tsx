import { Navigate, Outlet } from "react-router-dom";
import { useLaunchAccess } from "@/hooks/useLaunchAccess";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

function LaunchAccessLoading() {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <p className="text-[#A8A8A8] text-xs font-bold uppercase tracking-wider">
        Verifying market access...
      </p>
    </div>
  );
}

/**
 * LaunchRegionGuard — blocks marketplace routes for waitlisted / paused / maintenance users.
 * Admins always pass through.
 */
export function LaunchRegionGuard({
  requireMarketplace = true,
}: {
  requireMarketplace?: boolean;
}) {
  const { role, isLoading: roleLoading } = useCurrentUserRole();
  const { data: access, isLoading, isError } = useLaunchAccess(!roleLoading && role !== "admin");

  if (role === "admin") {
    return <Outlet />;
  }

  if (roleLoading || isLoading) {
    return <LaunchAccessLoading />;
  }

  if (isError || !access) {
    return <Navigate to="/waitlist-dashboard" replace />;
  }

  if (access.effectiveStatus === "maintenance") {
    return (
      <Navigate
        to={`/maintenance?region=${encodeURIComponent(access.regionState)}`}
        replace
      />
    );
  }

  if (!access.canAccessDashboard) {
    return <Navigate to="/waitlist-dashboard" replace />;
  }

  if (requireMarketplace && !access.canAccessMarketplace) {
    return <Navigate to="/waitlist-dashboard" replace />;
  }

  return <Outlet />;
}
