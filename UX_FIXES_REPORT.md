# Servd Co — UX Fixes Report (Phase 5)

**Date:** 2026-06-20

This document maps user-reported UX issues (with screenshot evidence) to fixes applied in Phase 5.

---

## Admin Dashboard

| Issue | Fix | File(s) |
|-------|-----|---------|
| Booking modal content cropped at top | Flex column layout; sticky header; body-only scroll; 90vh max | `BookingDetailModal.tsx` |
| Document preview black box | Signed URL refresh + pdfjs blob fetch + error/retry UI | `DocumentPreviewModal.tsx`, `DocumentViewer.tsx` |
| Approve document → full dashboard flash | Optimistic status update; debounced `silentRefresh`; skip full refresh when preview open | `AdminDashboard.tsx` |
| Interest Request `alert()` | Region Review modal with metrics + DB actions | `RegionReviewModal.tsx`, `MarketInterestRequests.tsx` |
| Notification panel unreadable (transparent) | Solid `#161616` panel, higher z-index | `NotificationBell.tsx` |
| Native white scrollbars in modals/panels | Global branded scrollbar CSS | `global.css` |

---

## Cook Dashboard

| Issue | Fix | File(s) |
|-------|-----|---------|
| Progress ring ~70% but text "0%" | Data-driven `CircularProgress` SVG matching approved doc count | `ChefDashboard.tsx`, `CircularProgress.tsx` |
| Notification transparency | Shared `NotificationBell` fix | `NotificationBell.tsx` |

---

## Signup Flows (Family + Cook)

| Issue | Fix | File(s) |
|-------|-----|---------|
| Native blue state dropdown | `BrandSelect` + `StateCitySelect` | `FamilyRegistration.tsx`, `ChefRegistration.tsx` |
| Free-text city (invalid combos) | State-filtered city dropdown; validation helper | `StateCitySelect.tsx`, `us-locations.ts` |
| Weak password validation | Strength meter + 5 requirements | `PasswordStrengthMeter.tsx` |
| Browser "Please fill in this field" only | Inline field errors on ZIP, confirm password | `FormInput` + registration pages |
| Password manager support | `autocomplete="new-password"`, `postal-code` | Registration forms |

---

## Family Dashboard

| Issue | Status | Notes |
|-------|--------|-------|
| Black cook avatar placeholders | Partial | Use `UserAvatar` everywhere — component exists |
| Invalid date "5588-05-22" in activity log | Pending | Date normalization in booking history formatter |
| Confusing booking time display | Pending | Human-readable formatter (P2 #19) |

---

## Public / Marketplace

| Issue | Status | Notes |
|-------|--------|-------|
| Empty review section | Pending | Full review system (P2 #18) |
| Browse/filter native selects | Pending | Roll out `BrandSelect` |
| Booking form time UX | Pending | Scheduling redesign (P2 #19) |

---

## Design System Improvements Applied

- **Modals:** Consistent dark `#161616` surface, rounded-3xl, sticky headers
- **Scrollbars:** Thin, dark track, orange thumb hover
- **Selects:** Radix-based, orange highlight — no browser blue
- **Progress:** SVG rings tied to real data
- **Notifications:** Opaque panels, category chips, readable contrast

---

## Verification Checklist (Post-Deploy)

- [ ] Open admin booking → modal scrolls body only, header fixed
- [ ] Open document review → PDF/image renders or shows error + download
- [ ] Click "Review Region" → modal with Approve/Queue/Reject (no alert)
- [ ] Cook verification tab → ring percent matches approved count
- [ ] Open notifications → solid background, readable text
- [ ] Family/Cook signup → state then city dropdown, password meter visible
