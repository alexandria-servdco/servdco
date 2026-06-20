# GA4 Debug Report — Servd Co Production

**Date:** 2026-06-20  
**Property:** Servd Co Production  
**URL:** https://servdco-one.vercel.app  
**Measurement ID:** `VITE_GA_MEASUREMENT_ID` (G-… prefix)

---

## Symptom

Google Analytics 4 Realtime overview shows **0 active users** despite production traffic.

---

## Investigation Checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Env var set in Vercel | PASS | `VITE_GA_MEASUREMENT_ID` in build |
| ID in JS bundle | PASS | `G-` pattern in production assets |
| gtag script loads | PASS | CSP allows `googletagmanager.com` |
| collect requests allowed | PASS | CSP `connect-src` includes `google-analytics.com` |
| `initAnalytics()` called | PASS | `client/main.tsx` or App bootstrap |
| `window.gtag` defined | PASS | Set in `analytics.ts` |
| `send_page_view: false` + manual tracking | PASS | By design — uses `trackPageView` |
| Route change page views | PASS | `PageMetaManager.tsx` calls `trackPageView(pathname)` |
| Production build flag | PASS | `isProductionBuild()` gates debug object |
| Ad blockers / consent | UNKNOWN | User browser may block GA |
| Realtime delay | INFO | GA4 Realtime can lag 30–60 seconds |

---

## Root Causes Identified (Historical)

### 1. CSP Blocking (Fixed — commit `1dcca17`)

**Problem:** Content-Security-Policy did not allow Google Tag Manager or Analytics collect endpoints.

**Fix in `vercel.json`:**
- `script-src`: added `https://www.googletagmanager.com`
- `connect-src`: added `https://www.google-analytics.com`
- `img-src`: added `https://www.google-analytics.com`

### 2. Manual Page Views Only

`initAnalytics` sets `{ send_page_view: false }`. Automatic SPA page views do NOT fire unless `PageMetaManager` runs.

**Verify:** React Router wraps app with `PageMetaManager` in `App.tsx` — confirmed.

### 3. Realtime vs Standard Reports

Realtime shows last 30 minutes. If testing alone with ad blocker, count stays 0.

---

## Runtime Verification Steps

Open production in **incognito without ad blocker**:

```javascript
// 1. Analytics initialized
window.__SERVDCO_ANALYTICS__
// Expected: { enabled: true, measurementId: "G-XXXXXXXX" }

// 2. gtag available
typeof window.gtag  // "function"

// 3. Manual event
window.gtag('event', 'debug_test', { debug: true })

// 4. Network tab — filter "collect"
// Should see POST/GET to google-analytics.com/g/collect
```

Navigate 2–3 routes, wait 60 seconds, refresh GA4 Realtime.

---

## Events Wired in Codebase

| Event | Source |
|-------|--------|
| `page_view` | `PageMetaManager` |
| `signup_started` | Family/Cook registration |
| `signup_completed` | Family registration success |
| `booking_submitted` | ChefProfile booking |
| `contact_form_submission` | Contact page |

---

## Consent Mode

**Current:** No Google Consent Mode v2 implemented.

If EU traffic or strict privacy policy required, add:

```javascript
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
});
// Update on user accept
```

Until consent granted, Realtime may undercount.

---

## Debug Mode (Development)

Add temporarily for staging:

```javascript
gtag('config', MEASUREMENT_ID, { debug_mode: true });
```

Check browser console for `[GA]` debug logs. **Do not enable in production long-term.**

---

## Automated Probe

```bash
node scripts/verify-production-observability.mjs
```

Checks CSP headers and bundle for measurement ID pattern.

---

## Verdict

| Area | Status |
|------|--------|
| Code initialization | **PASS** |
| CSP configuration | **PASS** |
| Route tracking | **PASS** |
| Realtime showing users | **NEEDS LIVE BROWSER TEST** |

**Conclusion:** Infrastructure for GA4 is correctly configured post-CSP fix. Realtime showing 0 is likely due to:
1. No unblocked browser session during test window
2. Ad/privacy blockers
3. GA4 processing delay

**Recommendation:** Run verified browser test (steps above) during active session. If `collect` requests appear in Network tab but Realtime stays 0 for 5+ minutes, verify measurement ID matches GA4 property exactly in Vercel env.

---

## Related Files

- `client/lib/analytics.ts` — init + track helpers
- `client/components/seo/PageMetaManager.tsx` — SPA page views
- `vercel.json` — CSP headers
- `GA4_PRODUCTION_VERIFICATION.md` — prior verification (2026-06-20)
