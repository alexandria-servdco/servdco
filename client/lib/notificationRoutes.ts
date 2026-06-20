/** Map notification content to in-app routes. */

export type NotifCategory =
  | "all"
  | "booking"
  | "verification"
  | "payment"
  | "message"
  | "admin";

export function inferCategory(title: string, message: string): NotifCategory {
  const text = `${title} ${message}`.toLowerCase();
  if (text.includes("booking") || text.includes("session")) return "booking";
  if (
    text.includes("document") ||
    text.includes("verification") ||
    text.includes("approved")
  )
    return "verification";
  if (
    text.includes("payment") ||
    text.includes("payout") ||
    text.includes("refund")
  )
    return "payment";
  if (text.includes("message") || text.includes("contact")) return "message";
  if (text.includes("admin") || text.includes("announcement")) return "admin";
  return "all";
}

function baseDashboard(pathname: string): "family" | "chef" | "admin" {
  if (pathname.includes("admin-dashboard")) return "admin";
  if (pathname.includes("chef-dashboard")) return "chef";
  return "family";
}

export function inferNotificationRoute(
  title: string,
  message: string,
  currentPath: string,
): string | null {
  const text = `${title} ${message}`.toLowerCase();
  const role = baseDashboard(currentPath);

  if (text.includes("message") || text.includes("new message")) {
    if (role === "admin") return "/admin-dashboard/messaging";
    if (role === "chef") return "/chef-dashboard/messages";
    return "/family-dashboard/messages";
  }

  if (text.includes("booking") || text.includes("session")) {
    if (role === "admin") return "/admin-dashboard/bookings";
    if (role === "chef") return "/chef-dashboard/bookings";
    return "/family-dashboard/bookings";
  }

  if (
    text.includes("document") ||
    text.includes("verification") ||
    text.includes("servsafe")
  ) {
    if (role === "admin") return "/admin-dashboard/documents";
    if (role === "chef") return "/chef-dashboard/verification";
    return null;
  }

  if (text.includes("payment") || text.includes("payout")) {
    if (role === "admin") return "/admin-dashboard/payouts";
    if (role === "chef") return "/chef-dashboard/earnings";
    return "/family-dashboard/bookings";
  }

  if (text.includes("contact")) {
    if (role === "admin") return "/admin-dashboard/contact";
  }

  if (text.includes("review")) {
    if (role === "chef") return "/chef-dashboard/reviews";
    return "/family-dashboard/history";
  }

  return null;
}
