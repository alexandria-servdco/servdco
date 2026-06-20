import type { VercelRequest } from "@vercel/node";
import { getServiceRoleClient } from "./supabase/serviceRole.js";
import { verifySupabaseUser, requireAdmin } from "./auth.js";

export async function authorizeEmailEventRequest(
  req: VercelRequest,
): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const user = await verifySupabaseUser(token);
  if (!user) return null;

  return { userId: user.id };
}

export async function canSendBookingEmail(
  userId: string,
  bookingId: string,
): Promise<boolean> {
  if (await requireAdmin(userId)) return true;

  const client = getServiceRoleClient();
  const { data: booking } = await client
    .from("bookings")
    .select("family_id, chef_profile_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return false;
  if (booking.family_id === userId) return true;

  const { data: chefProfile } = await client
    .from("chef_profiles")
    .select("user_id")
    .eq("id", booking.chef_profile_id)
    .maybeSingle();

  return chefProfile?.user_id === userId;
}

export async function canSendDocumentEmail(
  userId: string,
  documentId: string,
): Promise<boolean> {
  if (await requireAdmin(userId)) return true;

  const client = getServiceRoleClient();
  const { data: doc } = await client
    .from("chef_documents")
    .select("chef_profile_id")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return false;

  const { data: chefProfile } = await client
    .from("chef_profiles")
    .select("user_id")
    .eq("id", doc.chef_profile_id)
    .maybeSingle();

  return chefProfile?.user_id === userId;
}
