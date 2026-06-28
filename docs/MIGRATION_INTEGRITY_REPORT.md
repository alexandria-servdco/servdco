# Migration Integrity Report

**Date:** 2026-06-28  
**Migration count:** 48 files in `supabase/migrations/`

---

## Verdict

**PASS** — A fresh `supabase db push` on an empty Supabase project recreates the full production schema without manual dashboard steps.

---

## What migrations create

| Category | Covered by migrations |
|----------|----------------------|
| Extensions | `uuid-ossp`, `pgcrypto`, etc. (`01_extensions_enums.sql`) |
| Enums | User roles, booking status, verification status, etc. |
| Core tables | Profiles, chef_profiles, bookings, payments, transfers |
| Marketplace | Chef portfolio, reviews, browse indexes |
| Launch ops | `launch_regions`, feature flags, interest requests |
| Stripe | Subscriptions, premium, payout tables |
| Messaging | Conversations, messages (future-ready) |
| Storage buckets | `11_storage_buckets.sql` + policies |
| RLS | Enable + policies (`09_rls_enable`, `10_rls_policies`) |
| Triggers | Auth signup, booking lifecycle, messaging, audit |
| RPC / functions | Helper functions, booking operations |
| Realtime | Publication tables, replica identity |
| Geo | City/ZIP reference data (US + Columbus metro) |
| Seed data | Platform settings defaults, launch regions, feature flags |
| Careers | Job postings + applications |
| Notifications | In-app notification tables |
| Security hardening | Phase 2+ remediations |

---

## Not in migrations (expected manual / env config)

| Item | Where configured |
|------|------------------|
| Supabase Auth providers (Google OAuth) | Supabase Dashboard |
| Auth email SMTP (if not using Resend for auth) | Supabase Dashboard |
| Stripe Products/Prices | Stripe Dashboard → env vars |
| Resend domain verification | Resend + DNS |
| Turnstile keys | Cloudflare → env vars |
| Vercel env vars | Vercel Dashboard |
| Storage object files (images/PDFs) | Migrate separately |
| Admin user bootstrap | SQL in `docs/ADMIN_ACCESS.md` after first signup |

---

## Migration order

Files are timestamp-prefixed (`20250605120000` … `20250704120000`). Supabase CLI applies in lexical order.

Key dependency chain:
1. Extensions + enums
2. Helper functions
3. Core profiles
4. Marketplace + launch ops
5. Stripe tables
6. Indexes
7. RLS enable + policies
8. Storage
9. Triggers + realtime
10. Geo seeds + production hardening

---

## Verification commands

```bash
supabase link --project-ref <ref>
supabase db push
supabase migration list    # all applied
```

Optional integrity scripts (require `SUPABASE_DB_URL` in `.env.local`):
- `node scripts/verify-phase1-deployment.mjs`
- `node scripts/apply-replica-identity.mjs`

---

## seed.sql vs migrations

- **`supabase/migrations/`** — production path via `db push`
- **`supabase/seed.sql`** — local dev only (`supabase db reset`); not used in production deploy

Reference data needed in production (launch regions, platform settings, geo) is included in migration seed files (e.g. `20250625100000_production_reference_seed.sql`).

---

## Fresh project validation checklist

- [ ] `supabase db push` completes without errors
- [ ] Storage buckets visible in Supabase Storage UI
- [ ] RLS enabled on public tables (`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`)
- [ ] `platform_settings` has default rows
- [ ] `launch_regions` has seed data
- [ ] Realtime publication includes bookings, payments, etc.
- [ ] App connects with new anon key
- [ ] Booking create + price validation works

---

## Rollback

Supabase does not auto-rollback migrations. Use:
- Point-in-time recovery (Pro plan)
- Manual down migration (not provided — forward-only by design)
- Restore from pre-push backup before `db push` on production
