# Performance Audit — Phase 4 (Pre-Optimization Baseline)

**Date:** June 12, 2026  
**Scope:** Audit only — no fixes applied at time of capture  
**Production URL:** https://servdco.vercel.app  
**Baseline commit:** `a2013b1` (Phase 2/3 certification)  
**Build command:** `pnpm build`  
**Lighthouse source:** `scripts/phase2-lighthouse-home.json` (mobile emulation, production)

---

## Executive Summary

The primary performance bottlenecks are **oversized marketing PNGs** (especially the homepage hero at ~766 KB) and a **monolithic vendor JavaScript chunk** (~808 KB) loaded on every route. PDF.js is bundled statically into the admin document viewer, adding ~1.2 MB worker payload to the dependency graph. Lighthouse Performance on the homepage is **59**; Accessibility **86**; Best Practices and SEO already **100**.

---

## Lighthouse Baseline (Homepage, Mobile)

| Category | Score |
|----------|------:|
| Performance | **59** |
| Accessibility | **86** |
| Best Practices | **100** |
| SEO | **100** |

### Core Web Vitals (baseline)

| Metric | Value |
|--------|-------|
| LCP | **13.2 s** |
| FCP | 6.3 s |
| TBT | 440 ms |
| CLS | **0** (good) |
| Speed Index | 6.3 s |
| TTI | 13.4 s |

**Root cause (LCP):** `home-hero.png` (~766 KB) served as full-resolution PNG with no responsive variants; large synchronous JS parse on first load.

---

## Bundle Analysis (Pre-Optimization)

Captured from `pnpm build` + `node scripts/bundle-report.mjs` before Phase 4 changes.

### Largest JS Chunks

| File | Size (raw) | Notes |
|------|----------:|-------|
| `pdf.worker.min-*.mjs` | **1,216 KB** | Static import in `DocumentViewer.tsx` |
| `vendor-*.js` (monolith) | **808 KB** | Single catch-all vendor chunk |
| `index-*.js` | **295 KB** | Main app entry |
| `vendor-react-*.js` | 316 KB | React + router |
| `vendor-supabase-*.js` | 190 KB | Supabase client |
| `vendor-radix-*.js` | 190 KB | Radix UI primitives |
| `vendor-motion-*.js` | 81 KB | framer-motion (homepage) |
| `index-*.css` | 130 KB | Global Tailwind output |

**Total dist/assets (pre):** ~4.2 MB across chunks (including PDF worker).

### Initial Load Concerns

- Homepage eagerly loads the **808 KB vendor monolith** plus **295 KB index** before interaction.
- **PDF.js worker** included in build graph even for non-admin visitors (static import).
- **framer-motion** on homepage adds animation overhead without critical UX benefit.
- **Sentry** initialized at module scope in `App.tsx` (before Phase 4).
- **All routes** eagerly imported in `App.tsx` (before Phase 4 lazy split).

### Duplicated / Heavy Packages

| Package | Issue |
|---------|-------|
| `pdfjs-dist` | 1.2 MB worker + library; only needed in admin document preview |
| `recharts` | Loaded with admin analytics; should be route-scoped |
| `framer-motion` | Used on marketing pages; heavy for LCP-critical homepage |
| `@radix-ui/*` | Many primitives; expected for UI but contributes ~190 KB |
| `@supabase/supabase-js` | Required for auth; ~190 KB unavoidable on authenticated flows |
| `lucide-react` | Icon tree-shaking OK but still ~21 KB chunk when split |

### Unused / Low-Value Assets in `public/`

Several large PNGs exist but are **not referenced** in client code:

| File | Size | Status |
|------|-----:|--------|
| `family-illustration.png` | 1,046 KB | Unused |
| `chef-illustration.png` | 823 KB | Unused |
| `contact-map.png` | 831 KB | Unused |
| `about-why.png` | 804 KB | Unused |
| `about-test.png` | 775 KB | Unused |
| `home-steps.png` | 554 KB | Unused |
| `chef-registration-hero.png` | 777 KB | Unused |

---

## Largest Images (Pre-Optimization)

| Asset | Size | Used on |
|-------|-----:|---------|
| `family-illustration.png` | 1,046 KB | — (unused) |
| `about-hero.png` | 883 KB | About |
| `contact-hero.png` | 849 KB | Contact |
| `home-mother-child.png` | 808 KB | Homepage |
| `home-hero.png` | **766 KB** | **Homepage LCP** |
| `1.png` (logo) | 661 KB | Navbar, Footer, Sidebar |
| `3.png` (wordmark) | 294 KB | Footer |

**Total PNG weight in `public/`:** ~10 MB  
**No WebP/AVIF variants** existed at audit time.  
**No responsive `srcset`** on marketing images.

---

## Slow Routes (Estimated)

Based on bundle weight + image payload + auth dependencies:

| Route | Risk factors |
|-------|----------------|
| `/` (Home) | LCP hero PNG, framer-motion, full vendor monolith |
| `/admin-dashboard` | Admin chunk + charts + PDF viewer graph |
| `/chef-dashboard` | Large dashboard chunk (~76 KB) + realtime |
| `/family-dashboard` | Dashboard + bookings + messaging imports |
| `/browse-chefs` | Supabase marketplace query + card grid |
| `/chef/:id` | Profile chunk (~22 KB) + images from storage |

---

## Largest Components (By Chunk Contribution)

| Component / Area | Approx. chunk | Loaded when |
|------------------|---------------|-------------|
| `AdminDashboard` | ~74 KB | Admin route |
| `ChefDashboard` | ~76 KB | Chef route |
| `DocumentViewer` (+ pdfjs) | ~423 KB + 1.2 MB worker | Admin document preview |
| `AdminAnalytics` (+ recharts) | ~8 KB + 425 KB charts | Admin analytics tab |
| `MessagingPanel` | ~25 KB | Dashboard messaging |
| `ChefProfile` | ~22 KB | Cook profile page |
| `Index` (homepage) | In main index chunk | Every first visit |

---

## Render-Blocking Resources

| Resource | Blocking? | Notes |
|----------|-----------|-------|
| Google Fonts (Inter 400–700) | Partial | Stylesheet in `<head>` |
| `home-hero.png` preload | Yes | Preloaded PNG worsens LCP vs WebP |
| Main JS bundle | Yes | No route-level code splitting |
| CSS (`index.css`) | Yes | Expected; 130 KB |

---

## Network / API Patterns (Review)

| Pattern | Finding |
|---------|---------|
| React Query | Used globally; `staleTime` varies by hook — generally OK |
| `refetchOnWindowFocus` | Default true on some hooks — acceptable |
| Realtime subscriptions | Scoped to dashboard routes |
| Stripe JS SDK | **Not loaded on client** — checkout via server redirect (good) |
| Duplicate fetches | No systemic N+1 found in audit; dashboard hooks use query keys |

---

## Accessibility Gaps (Lighthouse Baseline)

| Issue | Location |
|-------|----------|
| Color contrast | Homepage muted text `text-[#A8A8A8]/60` |
| Missing skip link | Not present in baseline `App.tsx` |
| Button/link accessible names | Minor issues in icon-only controls (Navbar) |

---

## SEO Baseline

SEO score **100** on homepage. Existing infrastructure:

- `PageMetaManager` + `client/lib/seo/pageMeta.ts`
- Canonical, OG, Twitter cards on key routes
- `robots.txt`, sitemap references
- JSON-LD on homepage

No SEO blockers identified in audit.

---

## Unused Dependencies (Candidate Review)

| Package | Notes |
|---------|-------|
| None confirmed safe to remove | All deps referenced in client, server, or API |

**Dev-only:** `sharp` added in Phase 4 for image pipeline (not a runtime dep).

---

## Recommended Optimization Priority (For Steps 2–21)

1. **WebP responsive images** — homepage hero, logos, marketing pages (~8 MB savings potential)
2. **Route lazy loading** — all non-home routes
3. **Vendor chunk splitting** — break 808 KB monolith
4. **Dynamic PDF.js import** — admin-only
5. **Defer Sentry/analytics** — idle or first interaction
6. **Remove framer-motion from homepage** — CSS transitions sufficient
7. **Preload WebP hero + primary font only**
8. **CLS dimensions** on all `<img>` elements
9. **Skeleton fallbacks** for lazy routes and data tables

---

## Audit Artifacts

| Artifact | Path |
|----------|------|
| Lighthouse JSON (baseline) | `scripts/phase2-lighthouse-home.json` |
| Bundle report script | `scripts/bundle-report.mjs` |
| Launch certification | `LAUNCH_CERTIFICATION_REPORT.md` |

---

*This document captures the pre-optimization state. See `PERFORMANCE_HARDENING_REPORT.md` for changes applied and post-optimization metrics.*
