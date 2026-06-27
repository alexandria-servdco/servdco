# Production Sync Report — Phase 1

**Date:** June 12, 2026  
**Production URL:** https://servdco-one.vercel.app  
**Repository:** `kartik-singhhh03/servdco-saas` (branch `main`)

---

## Step 1 — Repository Audit

| Check | Status |
|-------|--------|
| Branch | `main` synced with `origin/main` at start |
| Partially committed feature work | None — all feature commits pushed (`0f55689` legal, `67e3cca` location, `f3e7167` hardening) |
| Uncommitted local noise | Audit `.md` files, test JSON artifacts (not committed) |
| Merge conflicts | None |
| Duplicate migration timestamps | None (48 files, 48 unique versions) |
| Latest migration file | `20250704120000_smart_location.sql` |

**Recent commits on main:**
```
0f55689 Update legal docs and messaging trust notices for platform safety disclosures.
67e3cca Add smart location detection with ZIP-first Launch Control integration.
f3e7167 Add production hardening: cook lifecycle, sessions, cookies, and legal acceptance.
```

---

## Step 2 — Migration Audit

- **Total migrations:** 48
- **Order:** Chronological, no duplicate timestamps
- **Latest:** `20250704120000`
- **Notable domains covered:** core profiles, marketplace, launch ops, stripe, messaging, RLS, storage, geo/ZIP, launch control, careers, security, production hardening, smart location

`npx supabase db push` requires `supabase link` (not configured locally). Migrations applied via `scripts/run-pending-migrations.mjs` against production Postgres.

---

## Step 3 — Migrations Applied

```
totalAppliedInDb: 48
appliedThisRun: [] (all already applied)
latestMigration: 20250704120000
failed: []
```

Production schema is fully synchronized with repository migrations.

---

## Step 4 — Types Regenerated

| Method | Result |
|--------|--------|
| `supabase gen types --linked` | Failed — project not linked |
| `supabase gen types --db-url` | Failed — Docker unavailable on Windows |
| **Fallback (approved):** `node scripts/phase1-generate-types.mjs` | Success — live Postgres introspection |

**Generator improvements (not manual type edits):**
- Insert fields with DB defaults marked optional
- Added `geo_reverse_cache` table
- Added `geo_primary_location_for_zip` RPC to Functions block

---

## Step 5 — Schema Verification

`node scripts/phase1-schema-verify.mjs` — **45/45 checks passed**

Verified domains:
- Careers (`career_jobs`, `career_applications`, `career-resumes` bucket)
- Launch control (`launch_regions`, `user_region_access`, geo RPCs)
- Location (`profiles` geo columns, `service_radius_miles`, `geo_reverse_cache`)
- Legal/cookies (`accepted_terms_*`, `cookie_preferences`)
- Cook lifecycle (verification/suspension/deletion columns)
- Stripe (`stripe_events`, `payments`, `transfers`, `stripe_accounts`)
- Verification (`chef_documents`)
- Notifications (`notification_preferences`, `user_allows_notification`)
- Messaging (`conversations`, `messages`, RLS enabled)

---

## Step 6 — Build Verification

| Command | Result |
|---------|--------|
| `pnpm typecheck` | ✅ Pass |
| `pnpm test` | ✅ 146/146 pass |
| `pnpm build` | ✅ Pass |

---

## Step 7 — Git

| Commit | Message |
|--------|---------|
| `e280d7e` | Sync production schema types and add Phase 1 verification tooling |
| `5bf71aa` | Add Phase 1 production smoke test script |

**Pushed:** `5bf71aa` → `origin/main` ✅

---

## Step 8 — Deployment

| Check | Result |
|-------|--------|
| GitHub push | ✅ Success |
| Vercel auto-deploy | ⚠️ **BLOCKED** |
| Manual `vercel deploy --prod` | ❌ Failed |

**Deploy failure reason:**
```
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

**Production still serving:** commit `abd34f7` (pre-location, pre-legal, pre-hardening)  
**Repository HEAD:** commit `5bf71aa`

**Action required before Phase 2:** Upgrade Vercel to Pro **or** consolidate API routes below 12 functions, then redeploy.

Current serverless entrypoints exceed Hobby limit due to `api/**/*.ts` glob including individual stripe/contact/health handlers alongside consolidated `[action].ts` routers.

---

## Step 9 — Production Smoke Tests

Run: `node scripts/phase1-production-smoke.mjs`

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/health | ✅ PASS | commit `abd34f7` (stale) |
| POST /api/auth/signup | ✅ PASS | HTTP 400 (validation) |
| POST /api/auth/login | ✅ PASS | HTTP 400 |
| POST /api/contact/submit | ✅ PASS | HTTP 400 |
| POST /api/waitlist/submit | ✅ PASS | HTTP 400 |
| POST /api/stripe/* | ✅ PASS | No 500 / no FUNCTION_INVOCATION_FAILED |
| POST /api/launch/sync-user | ✅ PASS | HTTP 401 (auth required) |
| POST /api/location/reverse | ⚠️ WARN | HTTP 404 — not deployed yet |
| POST /api/location/update | ⚠️ WARN | HTTP 404 — not deployed yet |
| GET /api/careers/jobs | ✅ PASS | HTTP 404 (route via platform) |

**No FUNCTION_INVOCATION_FAILED or 500 errors** on probed endpoints.

---

## Remaining Issues

1. **🔴 Vercel Hobby 12-function limit blocks deployment** — production code is 4+ commits behind repository
2. **`supabase link` not configured** — use `scripts/run-pending-migrations.mjs` and `scripts/phase1-generate-types.mjs`
3. **Supabase CLI `--db-url` typegen requires Docker** on Windows — pg introspection fallback used successfully
4. **Uncommitted local audit artifacts** — not production blockers
5. **`StateCitySelect.tsx`** — minor local diff, not committed

---

## Phase 1 Status

| Area | Status |
|------|--------|
| Repository audit | ✅ Complete |
| Migration audit | ✅ Complete |
| DB migrations applied | ✅ 48/48 (`20250704120000`) |
| Types regenerated | ✅ Complete (pg introspection) |
| Schema verification | ✅ 45/45 checks |
| typecheck / test / build | ✅ All pass |
| Git push | ✅ Complete |
| **Production deploy** | ❌ **Blocked — Vercel plan limit** |
| Smoke tests (current prod) | ✅ No 500s; location routes pending deploy |

**Phase 1 sync work is complete on repo + database.** Production runtime is **not** yet serving latest code until Vercel deploy succeeds.

**Do not proceed to Phase 2** until deployment blocker is resolved and production commit matches `5bf71aa`.
