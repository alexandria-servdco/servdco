# Servd Co — Messaging Architecture

**Date:** 2026-06-20  
**Status:** Partial — components exist; full marketplace loop incomplete

---

## Business Requirement

Families and cooks must communicate about bookings (dietary needs, arrival, changes). Admins need moderation visibility for trust & safety.

---

## Current Implementation

### Existing Components

| Component | Path | Role |
|-----------|------|------|
| `MessagingHub` | `client/components/messaging/MessagingHub.tsx` | Family/Cook inbox UI |
| `MessagingPanel` | `client/components/messaging/MessagingPanel.tsx` | Thread view + compose |
| `AdminMessagingHub` | `client/components/messaging/AdminMessagingHub.tsx` | Admin moderation view |

### Hooks & Services

- `useMessagingEnabled` — feature flag gate
- `useConversations` / `useUnreadMessageCount` — conversation list
- Supabase realtime on `messages` table (expected)

### Admin Integration

- Admin sidebar includes "Messaging" nav item
- `AdminMessagingHub` logs actions via `AdminAuditService`

---

## Target Architecture

```
Family/Cook Dashboard
        │
        ▼
  MessagingHub ──► Conversation list (paginated)
        │
        ▼
  MessagingPanel ◄──► Supabase Realtime (messages)
        │                    │
        │                    ├── Insert message
        │                    ├── Read receipts
        │                    └── Typing indicators (optional)
        ▼
  NotificationService + Email (new message)
        │
        ▼
  AdminMessagingHub (read-only + flag/delete)
```

---

## Data Model (Recommended)

### `conversations`

| Column | Notes |
|--------|-------|
| id | uuid |
| booking_id | nullable FK — tie to booking context |
| family_id | uuid |
| chef_id | uuid |
| last_message_at | timestamptz |
| created_at | timestamptz |

### `messages`

| Column | Notes |
|--------|-------|
| id | uuid |
| conversation_id | FK |
| sender_id | uuid |
| body | text |
| attachment_url | nullable |
| read_at | nullable |
| created_at | timestamptz |

### RLS Policies

- Family/Cook: read/write only their conversations
- Admin: read all; write for moderation notes only

---

## Features Matrix

| Feature | Status | Priority |
|---------|--------|----------|
| Conversation list | Partial | P0 |
| Send/receive text | Partial | P0 |
| Realtime delivery | Needs verification | P0 |
| Read receipts | Pending | P1 |
| Typing indicators | Pending | P2 |
| Attachments | Pending | P2 |
| Email on new message | Pending | P1 |
| In-app notification | Pending | P1 |
| Admin moderation view | UI exists | P1 |
| Audit logs | Partial | P1 |
| Pagination | Pending | P1 |

---

## Integration Points

1. **Booking flow** — auto-create conversation on booking acceptance
2. **Notifications** — `category: message` on insert
3. **Email** — Resend template "New message from {name}"
4. **Admin** — link from booking detail → conversation

---

## Implementation Plan

### Phase A (Marketplace Blocker)
1. Verify Supabase tables + RLS deployed
2. End-to-end test: family sends → cook receives realtime
3. Wire notification + email on new message

### Phase B (Polish)
4. Read receipts + unread badges
5. Server-side pagination on conversation/message lists
6. Admin search by user/booking

### Phase C (Trust)
7. Attachment upload (Supabase storage, MIME validation)
8. Report/block flow
9. Retention policy + audit export

---

## Gap Analysis

**Why admin has Messaging but marketplace feels incomplete:**
- Nav and admin hub were built ahead of family/cook realtime wiring
- Feature flag may disable messaging in production
- Booking → conversation auto-link may not be implemented

**Action:** Run E2E messaging test on production with two test accounts.
