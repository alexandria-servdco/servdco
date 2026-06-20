# Servd Co — Admin Management System Design

**Date:** 2026-06-20  
**Status:** Not implemented — operational risk for single-admin model

---

## Problem

Currently one admin account (Alexandria) holds full platform control. No invite flow, role separation, or delegated access for support/moderation staff.

---

## Proposed Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | All actions + manage other admins |
| **Admin** | Users, cooks, bookings, documents, regions, payouts |
| **Moderator** | Documents, reviews, messaging moderation, contact |
| **Support** | Read-only dashboards + booking status updates + contact replies |

---

## Data Model

### Option A: Extend `profiles.role`

```sql
-- Expand role enum
ALTER TYPE user_role ADD VALUE 'moderator';
ALTER TYPE user_role ADD VALUE 'support';
```

### Option B: Dedicated `admin_roles` table (recommended)

| Column | Type |
|--------|------|
| user_id | uuid FK profiles |
| role | super_admin / admin / moderator / support |
| invited_by | uuid |
| invited_at | timestamptz |
| accepted_at | timestamptz |
| revoked_at | nullable timestamptz |

---

## Admin Management Page

**Route:** `/admin-dashboard/admins`

### Features

1. **List admins** — name, email, role, last active
2. **Invite admin** — email + role → magic link or temp password
3. **Change role** — Super Admin only
4. **Remove admin** — soft revoke (`revoked_at`)
5. **Audit trail** — all admin management actions logged

### UI Components

- `AdminUsersTable` — paginated list
- `InviteAdminModal` — email + role select (`BrandSelect`)
- Confirm dialog on remove

---

## Authorization Middleware

### Client

```typescript
const ADMIN_PERMISSIONS = {
  super_admin: ["*"],
  admin: ["users", "chefs", "bookings", "documents", "regions", "payouts"],
  moderator: ["documents", "reviews", "messaging", "contact"],
  support: ["bookings:read", "bookings:update", "contact"],
};
```

Gate nav items and action buttons by permission.

### Server / RLS

- Supabase RLS policies check `admin_roles.role` for write operations
- API routes validate role before destructive actions

---

## Invite Flow

```
Super Admin → Invite form → Insert admin_roles (pending)
         → Send email (Resend) with signup link + role token
         → Invitee completes signup / accepts
         → accepted_at set, profile.role = admin
         → Audit log: admin.invited
```

---

## Audit Requirements

All admin management events:

| Action | Audit Key |
|--------|-----------|
| Invite sent | `admin.invited` |
| Role changed | `admin.role_changed` |
| Admin removed | `admin.revoked` |
| Login as admin | `admin.login` (optional) |

Extend `AdminAuditService` action types.

---

## Migration Path

1. Seed `admin_roles` with current admin as `super_admin`
2. Build read-only Admin Management page (list only)
3. Add invite + revoke with email
4. Refactor `AdminDashboard` nav guards to use permissions map
5. Add RLS policies for moderator/support scoping

---

## Security Notes

- Mandatory 2FA for Super Admin (future)
- Session timeout for admin routes
- IP allowlist optional for production
- Never expose service role key client-side

---

## Current Workaround

Single admin (`profiles.role = 'admin'`) with full access. Document all manual operations in audit logs where possible.

**Priority:** P1 — implement before scaling operations team.
