# Servd Co — Notification Architecture

**Date:** 2026-06-20  
**Phase:** 5 — Notification System 2.0

---

## Overview

Servd Co notifications span in-app bell UI, Supabase realtime, Zustand client store, and (planned) email/SMS channels.

```
┌─────────────┐     postgres_changes      ┌──────────────────┐
│  Supabase   │ ────────────────────────► │ useRealtimeNotif │
│ notifications│                          └────────┬─────────┘
└─────────────┘                                   │
                                                  ▼
┌─────────────┐     mark read / dismiss    ┌──────────────────┐
│ Notification│ ◄───────────────────────── │ useNotification  │
│    Bell     │                            │     Store        │
└─────────────┘                            └──────────────────┘
        │                                           ▲
        │ toast on insert                           │
        └───────────────────────────────────────────┘
                    NotificationService
```

---

## Data Model

**Table:** `notifications` (Supabase)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | Recipient |
| title | text | Short headline |
| message | text | Body |
| type | enum | info / success / warning / error |
| read | boolean | Unread state |
| created_at | timestamptz | Sort key |

---

## Client Components

### NotificationBell (`client/components/ui/NotificationBell.tsx`)

**Phase 5 improvements:**
- Solid `#161616` background (fixes transparency bleed-through)
- `z-[200]` + `isolate` stacking context
- Category filter tabs: All, Booking, Verification, Payment, Message
- Category inferred from title/message keywords
- Branded scrollbars (global CSS)
- Unread dot: orange default; green/red/amber by type

### NotificationService (`client/services/notification.service.ts`)

- `markRead(id)` — single notification
- `markAllRead()` — bulk
- Sort: newest first

### Realtime Hook (`client/hooks/useRealtimeNotifications.ts`)

- Channel: `user-notifications:${userId}` (deduped from dashboard hook)
- Subscribes to `postgres_changes` on `notifications` filtered by `user_id`

---

## Categories (Target Schema)

| Category | Examples | Mandatory |
|----------|----------|-----------|
| Booking | Request, accepted, cancelled, completed | Partial |
| Verification | Document approved/rejected | Yes (status changes) |
| Payment | Payout, refund, charge | Yes (financial) |
| Message | New thread message | No |
| Admin | Announcements, moderation | No |
| Marketing | Promotions, referrals | No (opt-out) |

*Current implementation uses keyword inference until `category` column is added.*

---

## Notification Preferences (Planned — P1 #12)

**Settings → Notifications**

| Preference | Default | Can Disable |
|--------------|---------|-------------|
| Platform (in-app) | On | Partial |
| Email | On | Yes |
| SMS | Off | Yes |
| Booking updates | On | No (mandatory) |
| Verification updates | On | No |
| Payment updates | On | No |
| Marketing | Off | Yes |

Store in `notification_preferences` JSON on `profiles` or dedicated table.

---

## Email Integration (P1 #13)

Dual-write pattern on event:

1. Insert `notifications` row → realtime → bell
2. Queue transactional email via Resend (if preference allows)

| Trigger | Email + In-App |
|---------|----------------|
| Document uploaded | Cook + Admin |
| Document approved/rejected | Cook |
| Booking requested/accepted/cancelled/completed | Family + Cook |
| New message | Recipient |
| New review | Cook |
| Payout processed | Cook |
| Admin announcement | All users |

---

## Admin Considerations

- Admin bell uses same component on `AdminDashboard`
- Audit log separate from user notifications
- Future: admin broadcast → bulk insert per user

---

## Known Issues (Resolved)

| Issue | Resolution |
|-------|------------|
| Duplicate realtime channel crash | Renamed channel; removed duplicate subscription in `useRealtimeDashboard` |
| Transparent dropdown unreadable | Solid background in Phase 5 |
| Native scrollbar in panel | Global branded scrollbar CSS |
