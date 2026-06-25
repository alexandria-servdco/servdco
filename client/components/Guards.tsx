import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { isRecoveryPending } from "@/lib/auth/passwordRecovery";

function AuthLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoading, supabaseAuthEnabled } = useAuth();
  if (supabaseAuthEnabled && isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-[#A8A8A8] text-xs font-bold uppercase tracking-wider">
          Loading session...
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function RoleLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useCurrentUserRole();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-[#A8A8A8] text-xs font-bold uppercase tracking-wider">
          Loading profile...
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

/**
 * GuestGuard ensures that users who are already logged in
 * are automatically redirected to their appropriate dashboard,
 * while guest users can access login/register pages.
 */
export function GuestGuard() {
  const { isAuthenticated, passwordRecovery } = useAuth();
  const { role, isLoading } = useCurrentUserRole();

  if (passwordRecovery || isRecoveryPending()) {
    return <Navigate to="/reset-password" replace />;
  }

  if (isAuthenticated && isLoading) {
    return (
      <RoleLoadingGate>
        <div className="min-h-screen bg-[#111111]" />
      </RoleLoadingGate>
    );
  }

  if (isAuthenticated && role) {
    if (role === "family") {
      return <Navigate to="/family-dashboard" replace />;
    }
    if (role === "chef") {
      return <Navigate to="/chef-dashboard" replace />;
    }
    if (role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
  }

  return (
    <AuthLoadingGate>
      <Outlet />
    </AuthLoadingGate>
  );
}

/**
 * AuthGuard blocks unauthorized guest access
 * and redirects users to the login screen.
 */
export function AuthGuard() {
  const { isAuthenticated, passwordRecovery } = useAuth();
  const location = useLocation();

  if (passwordRecovery || isRecoveryPending()) {
    return <Navigate to="/reset-password" replace />;
  }

  return (
    <AuthLoadingGate>
      {!isAuthenticated ? (
        <Navigate to="/login" state={{ from: location }} replace />
      ) : (
        <Outlet />
      )}
    </AuthLoadingGate>
  );
}

interface RoleGuardProps {
  allowedRoles: ("family" | "chef" | "admin")[];
}

function dashboardPathForRole(role: string | null): string {
  if (role === "chef") return "/chef-dashboard";
  if (role === "admin") return "/admin-dashboard";
  return "/dashboard";
}

/**
 * RoleGuard prevents users from accessing pages meant for other roles.
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { role } = useCurrentUserRole();

  return (
    <RoleLoadingGate>
      {!role || !allowedRoles.includes(role) ? (
        <Navigate to="/unauthorized" replace />
      ) : (
        <Outlet />
      )}
    </RoleLoadingGate>
  );
}

/**
 * AdminGuard — production owner access. Only profile.role === 'admin' may proceed.
 * Non-admins redirect to their role dashboard (not /unauthorized).
 */
export function AdminGuard() {
  const { role, isLoading } = useCurrentUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-[#A8A8A8] text-xs font-bold uppercase tracking-wider">
          Verifying admin access...
        </p>
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return <Outlet />;
}
