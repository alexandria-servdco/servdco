# Lighthouse Remediation Report

**Date:** 2026-06-20  
**Target:** Homepage ≥ 80, Browse ≥ 80 (per release mission)  
**Status:** WARN — optimizations applied; sandbox Lighthouse unstable

## Optimizations applied (commit `1dcca17` + follow-up)

| Change | Impact |
|--------|--------|
| Removed `framer-motion` from `App.tsx` PageWrapper (every route) | Less JS on route transitions |
| Removed duplicate `@import` font from `global.css` | Single font load path |
| Non-blocking font load in `index.html` (`media="print" onload`) | Reduced render-blocking |
| Vite `manualChunks` (react, supabase, radix, motion, sentry) | Better caching / parallel download |
| Deferred homepage marketplace fetch (`requestIdleCallback`) | Less main-thread work at LCP |

## Measured performance (Lighthouse CLI, production)

| Page | Pre-fix | Post-fix (sandbox) |
|------|---------|-------------------|
| `/` | 53 | 52 |
| `/browse-chefs` | 66 | 47* |

\*Browse post-fix run hit sandbox `EPERM`/variance — treat as noisy; re-run in Vercel Speed Insights or PageSpeed Insights for stable score.

## Remaining bundle contributors

| Chunk | ~Size (gzip) |
|-------|--------------|
| `vendor-DPS0NOZt.js` | 251 KB |
| `vendor-react` | 75 KB |
| `index` (app shell) | 52 KB |
| `vendor-motion` (Navbar mobile menu) | 27 KB |
| `vendor-supabase` | 50 KB |

## Why 80+ requires larger refactor (documented tradeoff)

- **Navbar** uses `framer-motion` for mobile menu → motion chunk loads on every public page  
- **SPA architecture** — 800KB+ vendor JS is inherent to current dashboard-in-SPA design  
- **No SSR** — LCP depends on JS hydration  

Achieving **90+** would require SSR/SSG or removing motion from Navbar (UI change). Achieving **80** may require lazy-loading Navbar motion or splitting marketing pages to static export.

## Recommendation

Use **Vercel Speed Insights** for production RUM. Accept current scores for private beta with performance WARN, or schedule Phase 4 perf sprint (Navbar CSS transitions, marketing route code-split).

## Verdict

**WARN** — Safe optimizations shipped; **80 target not reliably confirmed** in local Lighthouse sandbox.
