# Servd Co — Review System Design

**Date:** 2026-06-20  
**Status:** Not implemented — empty state on cook profiles

---

## Goals

Complete the marketplace loop: families rate cooks after verified completed bookings; cooks build reputation; platform displays trustworthy social proof.

---

## User Stories

### Family
- After completed booking → prompt to leave review
- Rate 1–5 stars + written review
- Edit own review within 7 days
- Report inappropriate review

### Cook
- View reviews on dashboard + public profile
- Cannot delete family reviews (admin moderation only)
- Respond to review (optional v2)

### Public
- Cook profile shows average rating, count, distribution chart, recent reviews

### Admin
- Moderate reported reviews
- Remove spam/abusive content

---

## Eligibility Rules

```typescript
function canLeaveReview(familyId: string, chefId: string, bookingId: string): boolean {
  // 1. Booking belongs to family + chef
  // 2. Booking status === 'completed'
  // 3. No existing review for this booking_id
  // 4. Within 30 days of completion (configurable)
}
```

---

## Data Model

### `reviews`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| booking_id | uuid | UNIQUE — one review per booking |
| family_id | uuid | Author |
| chef_id | uuid | Subject |
| rating | int | 1–5 CHECK |
| body | text | Max 2000 chars |
| status | enum | published / hidden / reported |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `review_reports`

| Column | Type |
|--------|------|
| id | uuid |
| review_id | uuid FK |
| reporter_id | uuid |
| reason | text |
| created_at | timestamptz |

---

## API / Service Layer

`ReviewsSupabaseService`:
- `createReview(bookingId, rating, body)`
- `updateReview(reviewId, rating, body)`
- `listByChef(chefId, { page, limit })`
- `getChefAggregates(chefId)` → `{ average, count, distribution }`
- `reportReview(reviewId, reason)`

---

## UI Components

| Component | Location |
|-----------|----------|
| `ReviewPromptCard` | Family dashboard after completed booking |
| `LeaveReviewModal` | Star input + textarea + submit |
| `ReviewList` | Cook profile + cook dashboard |
| `RatingSummary` | Average + distribution bar chart |
| `AdminReviewModeration` | Admin dashboard tab |

---

## Display on Cook Profile

Replace current empty state:

```
Customer Reviews
★★★★☆ 4.2 (12 reviews)

[5★ ████████░░ 60%]
[4★ ███░░░░░░░ 20%]
...

Recent reviews:
- "Amazing dinner..." — Jane, Dec 2025
```

Use existing `useReviews` hook — extend with aggregates query.

---

## Notifications & Email

| Event | Notify |
|-------|--------|
| Review submitted | Cook (in-app + email) |
| Review reported | Admin |
| Review hidden | Family author |

---

## Fraud Prevention

- One review per `booking_id` (DB unique constraint)
- RLS: family can only create for own completed bookings
- Rate limit: max 5 reviews per family per day
- Admin can hide; not delete (audit trail)

---

## Implementation Phases

### Phase 1 — Core
1. Migration: `reviews` table + RLS
2. `LeaveReviewModal` on family booking history (completed only)
3. `ReviewList` + `RatingSummary` on `ChefProfile.tsx`

### Phase 2 — Polish
4. Edit window + report flow
5. Admin moderation tab
6. Email notifications

### Phase 3 — Analytics
7. Cook dashboard rating trend
8. Platform-wide review metrics in admin overview

---

## Existing Code References

- `client/hooks/useReviews.ts` — hook stub/partial
- `ChefProfile.tsx` — "No reviews yet" empty state
- `ChefDashboard.tsx` — "No reviews yet" in stats

---

## Priority

**P2** — Required for marketplace credibility but not blocking core booking/payment flows.
