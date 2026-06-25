# Turnstile Verification — Servd Co

**Date:** June 22, 2026  
**Provider:** Cloudflare Turnstile (Free tier)

---

## Integration Points

| Surface | Component | Server Route | Verified Server-Side |
|---------|-----------|--------------|----------------------|
| Family signup | `FamilyRegistration.tsx` | `POST /api/auth/signup` | ✅ |
| Cook signup | `ChefRegistration.tsx` (step 3) | `POST /api/auth/signup` | ✅ |
| Contact form | `Contact.tsx` | `POST /api/contact/submit` | ✅ |
| Waitlist | `WaitlistPage.tsx` | `POST /api/waitlist/submit` | ✅ |
| Admin invite (future) | `AdminInviteForm.tsx` | Not wired yet | Widget ready |

---

## Client Implementation

**Widget:** `client/components/security/TurnstileWidget.tsx`

Features:

- Loading state with spinner + screen-reader live region
- Expired challenge detection + retry button
- Error state + retry
- `aria-label`, `role="group"`, `aria-live="polite"`
- Reset via `resetKey` prop on submission failure

**Env:** `VITE_TURNSTILE_SITE_KEY`  
**Dev fallback:** Cloudflare test site key when unset in development

---

## Server Implementation

**Module:** `api/_lib/turnstile.ts`

- POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Sends `remoteip` from `getClientIp()` when available
- Skips verification when `TURNSTILE_SECRET_KEY` unset (local dev without keys)
- Logs failures to `security_events` via middleware

**Middleware:** `applySecurityMiddleware({ turnstile: true })`

---

## Verification Flow

```
User completes widget → token in request body (turnstileToken)
        ↓
applySecurityMiddleware → verifyTurnstileToken(token, ip)
        ↓
success → continue handler | failure → 400 CAPTCHA_FAILED + security_events row
```

---

## Test Procedure

### Local (test keys)

1. Set `VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA`
2. Set `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`
3. Run `pnpm dev:api:vercel` + `pnpm dev`
4. Submit contact form → expect 200
5. Submit without token (when secret set) → expect 400

### Production

1. Configure real Turnstile widget in Cloudflare dashboard
2. Deploy with production keys
3. Submit each protected form once
4. Admin → Security → confirm no `captcha_failure` spikes

### Automated

Static check in `scripts/security-e2e-verify.mjs`:

- Turnstile server module exists
- Signup/contact routes use `turnstile: true`
- CSP includes `challenges.cloudflare.com`

---

## Error Codes Handled

| Condition | HTTP | User Message |
|-----------|------|--------------|
| Missing token (secret configured) | 400 | CAPTCHA verification is required |
| Expired token | 400 | CAPTCHA expired. Please verify again. |
| Invalid token | 400 | CAPTCHA verification failed |
| Verify service down | 400 | CAPTCHA verification unavailable |

All failures logged as `captcha_failure` in `security_events`.

---

## Sign-off

| Check | Result |
|-------|--------|
| Widget on all required forms | ✅ |
| Server verify before user creation | ✅ |
| Server verify before contact/waitlist | ✅ |
| Accessibility (live region, retry) | ✅ |
| CSP compatible | ✅ |
| E2E static checks | ✅ PASS |
