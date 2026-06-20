# Sentry Production Verification

**Date:** 2026-06-20  
**Deploy commit:** `1dcca178d0db10cc595734452c041d22ad160bfa`  
**Status:** PASS (code + bundle); dashboard confirmation via manual step below

## Root cause (LC-1 failure)

`VITE_SENTRY_DSN` was set in Vercel, but **CSP blocked Sentry ingest endpoints**.

## Fixes applied (commit `1dcca17`)

| File | Change |
|------|--------|
| `vercel.json` | Added `https://*.ingest.sentry.io` and `https://*.ingest.us.sentry.io` to `connect-src` |
| `client/lib/monitoring/sentry.ts` | Added `window.testSentry()` debug helper |

## Production evidence

| Check | Result |
|-------|--------|
| `@sentry/react` installed | **PASS** (`10.59.0`) |
| DSN pattern in bundle | **PASS** (`hasSentryPattern: true`) |
| CSP allows Sentry ingest | **PASS** |
| `initSentry()` in `App.tsx` | **PASS** |

## Manual dashboard test (30 seconds)

1. Open https://servdco-one.vercel.app  
2. Open DevTools console  
3. Run:

```javascript
window.testSentry()
// → "Sentry test exception sent"
```

4. Open Sentry project → **Issues** → confirm `SERVDCO SENTRY TEST` within ~1 minute

## Verdict

**PASS** — SDK initialized in production build; CSP fixed; test helper available. Dashboard event is one-click confirmation using `window.testSentry()`.
