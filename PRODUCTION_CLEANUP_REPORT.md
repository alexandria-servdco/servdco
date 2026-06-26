# Production Launch Cleanup Report

**Date:** 2026-06-26  
**Branch:** main (local)  
**Status:** Complete — typecheck, tests (134/134), and production build passed

---

## Summary

ServdCo production cleanup removed placeholder Checkr/blog/referral surfaces, implemented a real cook verification queue, full careers management (admin + public + DB + storage), persisted notification preferences, and replaced fake SMS controls with informational copy. All changes preserve existing Stripe, booking, auth, messaging, payout, launch-control, and notification delivery workflows unless explicitly extended for preference filtering.

---

## 1. Checkr Removal → Cook Verification Queue

### Removed
- Checkr branding, “Sync Checkr API”, mock cooks, fake background-check statuses, disabled sync buttons
- All Checkr references in `client/` (grep clean)

### Replaced with
- **Cook Verification Queue** in `client/components/admin/VerificationCenter.tsx`
- Real `chef_documents` records only: view document, view cook profile, approve, reject, request resubmission, notes, status tracking
- Wired through existing `AdminDashboard` document actions and preview modal

---

## 2. Blog Removal

### Removed (frontend — prior sprint + this sprint)
- `client/pages/Blog.tsx`
- Blog route from `client/App.tsx`, navbar, footer, sitemap, SEO routes

### Removed (backend / database)
- Migration `supabase/migrations/20250627100000_production_launch_cleanup.sql` drops:
  - `public.blog_posts` table
  - Policies: `blog_select_published`, `blog_admin_all`
  - Trigger: `blog_posts_set_updated_at`
  - Index: `idx_blog_published`

### Types
- `blog_posts` removed from `client/lib/supabase/database.types.ts`

### Retained (historical only)
- Older migration files that originally created `blog_posts` (immutable history)
- Architecture docs mentioning blog — not runtime dependencies

---

## 3. Careers System (new)

### Database (`20250627100000_production_launch_cleanup.sql`)
| Table | Purpose |
|-------|---------|
| `career_jobs` | Job postings with draft/published/archived lifecycle |
| `career_applications` | Applicant submissions with hiring pipeline status |

**Enums:** `career_job_status`, `career_application_status`  
**Storage bucket:** `career-resumes` (private, 10MB, PDF/DOC/DOCX)  
**RLS:** Public read published jobs; public insert applications; admin full access on both tables; admin read/delete resumes

### Files added
| Path | Role |
|------|------|
| `shared/careers.ts` | Shared types + status labels |
| `client/services/supabase/careers.service.ts` | CRUD, applications, resume upload/download |
| `client/components/admin/CareersPanel.tsx` | Admin jobs + applications UI |
| `client/components/careers/CareerApplicationForm.tsx` | Public application form + resume upload |
| `client/pages/Careers.tsx` | Published jobs listing + empty state |
| `client/pages/CareerJob.tsx` | Job detail page |
| `client/pages/CareerApply.tsx` | General application + success state |

### Admin capabilities
- Create / edit / publish / unpublish / archive / delete jobs
- View applications, search, filter by status, notes, pipeline: Applied → Under Review → Interview → Offer → Rejected → Hired
- Download resumes via signed URL

### Public capabilities
- `/careers` — published jobs only; professional empty state with general-application CTA
- `/careers/:jobId` — job details
- `/careers/apply` — general application form with validation + resume upload

### Routes added
- `/careers`, `/careers/apply`, `/careers/:jobId`
- Admin tab: **Careers** in `AdminDashboard`

### SEO
- `client/lib/seo/pageMeta.ts` — careers + careers/apply entries

---

## 4. Notification Preferences (persisted)

### Database
- `profiles.notification_preferences` JSONB column with defaults
- `user_allows_notification(user_id, category)` helper
- `insert_booking_notification` extended with `p_category` parameter
- `on_message_insert_notify_recipient` respects `message_notifications`
- `on_chef_document_status_change` uses `verification` category

### Files added
| Path | Role |
|------|------|
| `shared/notificationPreferences.ts` | Schema, defaults, parser |
| `client/components/settings/NotificationSettingsForm.tsx` | Shared settings UI |

### Files updated
| Path | Change |
|------|--------|
| `client/services/supabase/profiles.service.ts` | `updateNotificationPreferences()` |
| `client/pages/Dashboard.tsx` | Real notification form (family) |
| `client/pages/ChefDashboard.tsx` | Real notification form (cook) |
| `client/lib/auth/legacySession.ts` | Default preferences for legacy bridge |

**Categories:** booking, message, review, verification, marketing, announcement

---

## 5. SMS Settings

- Removed disabled SMS toggles from family and cook dashboards
- `NotificationSettingsForm` shows informational section only — no interactive SMS controls

---

## 6. Referral UI

- `client/components/referral/ReferralInviteCard.tsx` — **deleted** (was already removed from Dashboard)

---

## 7. Other placeholder cleanup

- `client/components/admin/SecurityDashboard.tsx` — `AdminInviteForm` converted to informational copy (no disabled “coming soon” button)

---

## Files removed

| File |
|------|
| `client/pages/Blog.tsx` |
| `client/components/referral/ReferralInviteCard.tsx` |

---

## Files added

| File |
|------|
| `supabase/migrations/20250627100000_production_launch_cleanup.sql` |
| `shared/careers.ts` |
| `shared/notificationPreferences.ts` |
| `client/services/supabase/careers.service.ts` |
| `client/components/admin/CareersPanel.tsx` |
| `client/components/careers/CareerApplicationForm.tsx` |
| `client/components/settings/NotificationSettingsForm.tsx` |
| `client/pages/Careers.tsx` |
| `client/pages/CareerJob.tsx` |
| `client/pages/CareerApply.tsx` |

---

## Files modified (key)

| File | Change |
|------|--------|
| `client/components/admin/VerificationCenter.tsx` | Real verification queue |
| `client/pages/AdminDashboard.tsx` | Careers nav + panel |
| `client/App.tsx` | Careers routes; blog removed |
| `client/components/Footer.tsx` | Careers link |
| `client/lib/supabase/database.types.ts` | Careers tables, notification_preferences, blog removed |
| `client/pages/Dashboard.tsx` | Notification prefs + password change |
| `client/pages/ChefDashboard.tsx` | Notification prefs + password change |
| `client/services/auth.service.ts` | `changePassword()` |
| `public/sitemap.xml` | Blog removed |

---

## Routes

| Removed | Added |
|---------|-------|
| `/blog` | `/careers` |
| | `/careers/apply` |
| | `/careers/:jobId` |

---

## APIs

No new Express/Vercel API routes. Careers and notification preferences use Supabase client + RLS directly.

---

## Database migrations

| Migration | Actions |
|-----------|---------|
| `20250627100000_production_launch_cleanup.sql` | Drop `blog_posts`; add `notification_preferences`; careers tables + RLS + storage; preference-aware notification functions |

### Tables removed
- `blog_posts`

### Tables added
- `career_jobs`
- `career_applications`

### Columns added
- `profiles.notification_preferences`

### RLS policies added
- `career_jobs_select_published`, `career_jobs_admin_all`
- `career_applications_insert_public`, `career_applications_admin_all`
- `career_resumes_admin_read`, `career_resumes_public_insert`, `career_resumes_admin_delete` (storage)

### RLS policies removed
- `blog_select_published`, `blog_admin_all`

### Storage buckets
- `career-resumes` (created/updated via migration)

---

## Components

| Removed | Added |
|---------|-------|
| Blog page | `CareersPanel`, `CareerApplicationForm`, `NotificationSettingsForm` |
| `ReferralInviteCard` | `Careers`, `CareerJob`, `CareerApply` pages |

---

## Testing

| Command | Result |
|---------|--------|
| `pnpm typecheck` | Pass |
| `pnpm test` | 134/134 pass |
| `pnpm build` | Pass |

### Manual verification recommended
- Family / cook settings: save notification prefs, reload, confirm persistence
- Admin verification queue: approve/reject/resubmit real documents
- Admin careers: create job → publish → apply on public page → review application
- Bookings, messaging, Stripe, launch control: regression smoke on staging

---

## Remaining technical debt

1. **Supabase CLI typegen on Windows** — requires Docker or `SUPABASE_ACCESS_TOKEN` for full regeneration; `scripts/regenerate-database-types.mjs` validates live schema against committed types
2. **Review notification category** — verify review triggers use `review` preference category if review-specific notifications exist
3. **Admin invites** — informational only; invites via Supabase Auth / internal ops
4. **Dev seed scripts** — retained for ops; not bundled in production

---

## Careers application emails (pre-launch completion)

| Event | Route | Trigger |
|-------|-------|---------|
| Applicant confirmation | `POST /api/careers/application-notify` | After `CareersSupabaseService.submitApplication` |
| Admin notification | Same route | Resend to `ADMIN_NOTIFY_EMAIL` + in-app admin notification |

Templates: `api/_lib/email/careerApplicationEmails.ts` (branded via `brandedTemplate.ts`)
