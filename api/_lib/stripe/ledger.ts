import { getServiceRoleClient } from "../supabase/serviceRole.js";

export async function writePaymentAuditLog(params: {
  action: string;
  paymentId: string;
  actorId?: string | null;
  bookingId?: string | null;
  metadata?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}): Promise<void> {
  const client = getServiceRoleClient();
  await client.from("audit_logs").insert({
    actor_id: params.actorId ?? null,
    action: params.action,
    entity_type: "payments",
    entity_id: params.paymentId,
    new_values: params.newValues ?? null,
    metadata: {
      booking_id: params.bookingId ?? null,
      ...params.metadata,
    },
    created_at: new Date().toISOString(),
  });
}

export async function writeAdminAuditLog(params: {
  action: string;
  adminUserId: string;
  entityType: string;
  entityId: string;
  result: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const client = getServiceRoleClient();
  await client.from("audit_logs").insert({
    actor_id: params.adminUserId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    new_values: { result: params.result },
    metadata: {
      admin_action: true,
      ...params.metadata,
    },
    created_at: new Date().toISOString(),
  });
}

export async function createUserNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const client = getServiceRoleClient();
  await client.from("notifications").insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    read: false,
    metadata: params.metadata ?? {},
    created_at: new Date().toISOString(),
  });
}
