# Legal & Trust/Safety Hardening Report

**Date:** June 12, 2026  
**Production URL:** https://servdco-one.vercel.app

## Summary

Updated Terms, Privacy Policy, and Cookie Policy with accurate platform messaging disclosures. Standardized company mailing address. Added professional in-conversation trust notice, composer guidance, and extensible moderation hooks.

---

## Legal Sections Added

### Terms of Service — §8 Platform Communication & Safety
- Purpose of internal messaging (bookings + support)
- Conditional access/disclosure purposes (fraud, abuse, disputes, policy enforcement, off-platform prevention, legal compliance, security)
- Clarification: **not** routine real-time monitoring
- Consent by use of messaging system

### Privacy Policy — §7 Platform Messaging
- Secure storage of messages and metadata
- Booking-related content; payments via Stripe (not in messages)
- Authorized admin access purposes (safety, fraud, moderation, disputes, legal, integrity)
- Limited to authorized personnel on need-to-know basis

### Privacy Policy — §8 Data Retention (updated)
- Message retention for dispute/fraud/legal purposes with minimization

---

## Address Changes

**New canonical address (all legal/contact surfaces):**

```
106 Spring Street
Mechanicsburg, OH 43044
United States
```

**Replaced:**
- 1121 Worthington Woods Blvd, #6041, Columbus, OH 43085
- Atlanta, GA 30303 (Contact page placeholder)

**Centralized in:** `shared/companyAddress.ts`

---

## Messaging UI Additions

| Component | Purpose |
|-----------|---------|
| `MessagingTrustNotice` | Subtle, dismissible notice at top of each conversation |
| `MessagingComposerGuidance` | Lightweight “do not share” list below composer |
| `trustNoticeStorage.ts` | Per-user, per-conversation dismissal persistence (localStorage) |
| `shared/messagingModeration.ts` | Rule-based hooks for future off-platform / sensitive-data detection |

**Behavior:**
- Notice hidden in admin moderation view
- “Learn more” → `/terms#platform-communication`
- Draft moderation hints shown non-blockingly (extensible, not AI)

---

## Files Updated

**Legal / address**
- `client/pages/Terms.tsx`
- `client/components/legal/PrivacyPolicyContent.tsx`
- `client/pages/PrivacyPolicy.tsx`
- `client/pages/CookiePolicy.tsx`
- `client/components/legal/LegalSidebar.tsx`
- `client/components/legal/LegalTOC.tsx`
- `client/components/Footer.tsx`
- `client/pages/Contact.tsx`
- `shared/companyAddress.ts` (new)
- `shared/legalVersions.ts` → `2026-06-12`
- `api/_lib/legalVersions.ts`

**Messaging**
- `client/components/messaging/MessagingPanel.tsx`
- `client/components/messaging/MessagingTrustNotice.tsx` (new)
- `client/components/messaging/MessagingComposerGuidance.tsx` (new)
- `client/lib/messaging/trustNoticeStorage.ts` (new)
- `shared/messagingModeration.ts` (new)
- `shared/messagingModeration.test.ts` (new)

**Admin**
- `ADMIN_OPERATIONS_GUIDE.md`

---

## Database / Migrations

No schema changes required for this sprint.

Legal version bumps trigger existing re-acceptance flow via `LegalReacceptanceModal` when users log in with outdated `accepted_terms_version` / `accepted_privacy_version`.

---

## Verification

```bash
pnpm typecheck  ✅
pnpm test       ✅
pnpm build      ✅
```

---

## Remaining Legal Recommendations

1. **State privacy laws** — Consider CCPA/CPRA-specific disclosure addendum if serving California users at scale.
2. **Data Processing Agreement** — Document subprocessors (Supabase, Stripe, Resend, Vercel) in a dedicated subprocessor list.
3. **Message retention SLA** — Define exact retention period (e.g., 24 months post-booking) in Privacy Policy once finalized operationally.
4. **Report/abuse flow** — Add in-thread “Report conversation” for users (currently admin access is policy-only).
5. **Server-side moderation** — Mirror `evaluateMessageModeration` in API send handler before production enforcement of off-platform rules.
6. **Cookie Policy analytics** — Align cookie categories with `CookieConsentBanner` granular preferences if marketing cookies are added later.

---

## QA Checklist

| Item | Status |
|------|--------|
| Terms updated | ✅ |
| Privacy updated | ✅ |
| Address consistent | ✅ |
| Messaging notice renders | ✅ |
| Dismiss persists per conversation | ✅ |
| Learn more link | ✅ `/terms#platform-communication` |
| Admin view skips notice | ✅ |
| Mobile/desktop layout | ✅ (responsive classes) |
| No DB migration needed | ✅ |
