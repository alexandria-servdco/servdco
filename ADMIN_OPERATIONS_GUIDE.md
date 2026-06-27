# Admin Operations Guide

**For:** Alexandria  
**Platform:** https://servdco-one.vercel.app/admin-dashboard

---

## Daily Operations

### Approve / Reject Cooks

1. Go to **Cooks** tab
2. Filter by verification status
3. Use **Approve** or open cook profile for details
4. Cook must upload ServSafe, Insurance, Background Check in **Verification** tab first

### Moderate Documents

1. Go to **Trust & Verification** tab
2. Click document to preview (PDF/image)
3. **Approve**, **Reject** (with reason), or **Request Resubmission**
4. Cook receives email + in-app notification
5. Use **Cleanup Orphaned Documents** at bottom for broken storage rows

### Contact Messages

1. Go to **Contact** tab
2. Search by name, email, subject
3. Mark **Read** or **Resolved** (archived)

### Monitor Bookings

1. Go to **Bookings** tab
2. Filter by status, search, sort by price
3. Click booking for modal — view meal request, ingredients, recipe notes, family fee, total charged

### Monitor Revenue

1. Go to **Analytics** tab
2. View signups, bookings, payments, conversion funnel
3. **Family Platform Fees** shows booked fee total
4. **Platform Revenue** chart shows cook-side platform fees (13%)

### Export Data

1. Bookings tab → **Export CSV**
2. Users tab → **Export CSV**

---

## Messaging Moderation (Operational Tool)

The **Messaging** hub lets authorized admins review conversation threads when necessary. This is **not** a routine monitoring tool.

### Review conversations only when:

- investigating reported abuse or harassment
- resolving a booking or payment dispute
- reviewing a user-reported conversation
- investigating suspected fraud or off-platform payment attempts
- enforcing the Terms of Service or platform policies
- responding to a valid legal request

### Do not:

- browse private conversations without an operational reason
- share message contents outside the platform without authorization
- use messaging access for personal curiosity

All moderator actions (such as message deletion) are logged in the admin audit trail.

---

## Platform Settings

**Settings tab:**
- Global platform fee % (cook side, default 13%)
- Family platform fee $ (default $5)
- Cook Premium price

Changes apply to new bookings immediately.

---

## Announcements

**Announcements tab:** Post global banner messages to all users.

---

## No Developer Required For

- Cook approval workflow
- Document moderation
- Contact inbox
- Booking oversight
- Fee configuration
- CSV exports
- Orphaned document cleanup

---

## Escalate to Developer When

- Stripe webhook failures
- Transfer cron errors
- Database migration needed
- New feature requests
