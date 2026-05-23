import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * GuestGuard ensures that users who are already logged in
 * are automatically redirected to their appropriate dashboard,
 * while guest users can access login/register pages.
 */
export function GuestGuard() {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = localStorage.getItem("userRole");

  if (isAuthenticated) {
    if (userRole === "family") {
      return <Navigate to="/family-dashboard" replace />;
    } else if (userRole === "chef") {
      return <Navigate to="/chef-dashboard" replace />;
    } else if (userRole === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
  }

  return <Outlet />;
}

/**
 * AuthGuard blocks unauthorized guest access
 * and redirects users to the login screen.
 */
export function AuthGuard() {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

interface RoleGuardProps {
  allowedRoles: ("family" | "chef" | "admin")[];
}

/**
 * RoleGuard prevents users from accessing pages meant for other roles.
 * e.g., a family account cannot view /chef-dashboard or /admin-dashboard.
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const userRole = localStorage.getItem("userRole") as any;

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
