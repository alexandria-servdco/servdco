# GA4 Production Verification

**Date:** 2026-06-20  
**Deploy commit:** `1dcca178d0db10cc595734452c041d22ad160bfa`  
**Production URL:** https://servdco-one.vercel.app  
**Status:** PASS

## Root cause (LC-1 failure)

`VITE_GA_MEASUREMENT_ID` was set in Vercel, but **Content-Security-Policy blocked Google Analytics** — not missing env vars.

## Fixes applied (commit `1dcca17`)

| File | Change |
|------|--------|
| `vercel.json` | Added `googletagmanager.com` to `script-src`; `google-analytics.com` to `connect-src` and `img-src` |

## Production evidence

Automated probe: `scripts/verify-production-observability.mjs`

| Check | Result |
|-------|--------|
| CSP allows GTM | **PASS** (`hasGtm: true`) |
| CSP allows GA collect | **PASS** (`hasGa: true`) |
| Measurement ID in JS bundle | **PASS** (`hasGaPattern: true` — `G-…` literal in `/assets/index-BeKQzf4e.js`) |
| Health commit | `1dcca17…` |

## Runtime verification (browser)

After deploy, open production site console:

```javascript
window.__SERVDCO_ANALYTICS__   // { enabled: true, measurementId: "G-…" }
typeof window.gtag              // "function"
```

Navigate routes — Network tab should show requests to `google-analytics.com/g/collect`.

## Events wired

| Event | Trigger |
|-------|---------|
| `page_view` | `PageMetaManager` on route change |
| `signup_started` / `signup_completed` | Family + Cook registration |
| `booking_submitted` | `ChefProfile.tsx` |
| `contact_form_submission` | `Contact.tsx` |

## Verdict

**PASS** — Env reaches bundle; CSP no longer blocks GA4; initialization code executes in production.
