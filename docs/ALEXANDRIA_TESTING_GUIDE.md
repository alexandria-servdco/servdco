# ServdCo — Simple Testing Guide for Alexandria

**Site:** https://servdco-one.vercel.app  
**Mode:** Stripe **test mode** only — no real money is charged.

This guide walks you through testing the full platform in order: cook signup → your admin access → approve the cook → family booking → test payment.

---

## Before you start

| Item | What to use |
|------|-------------|
| **Browser** | Chrome or Edge (latest) |
| **Region for testing** | **Ohio** (active launch region). Texas is waitlist-only. |
| **Password** | At least 8 characters (e.g. `ServdCoTest2026!`) |
| **Emails** | Use **3 different emails** (see below) |

### Your 3 test emails

| Role | Suggested email | Purpose |
|------|-----------------|---------|
| **Cook (test chef)** | e.g. `cook.test@yourdomain.com` | Register as cook, upload documents |
| **You (owner / admin)** | `alexandria@servdco.com` (or your real owner email) | Family signup → Kartik upgrades you to admin |
| **Family (test customer)** | e.g. `family.test@yourdomain.com` | Book the cook and pay with test card |

> **Important:** Confirm your email inbox for each account. After signup, click the link in the “Check your inbox” message before logging in.

---

## Stripe test payments (fake card — always works)

When Stripe Checkout opens, use **only** these test details:

| Field | Enter this |
|-------|------------|
| **Card number** | `4242 4242 4242 4242` |
| **Expiry** | Any future date (e.g. `12 / 34`) |
| **CVC** | Any 3 digits (e.g. `123`) |
| **ZIP** | Any 5 digits (e.g. `43215`) |
| **Name** | Any name (e.g. `Test User`) |

- No real card needed.  
- You will see **TEST MODE** on the Stripe payment page.  
- Payment will succeed and return you to ServdCo.

**If a payment fails:** try again with `4242…` only. Do not use a real credit card.

---

## Part 1 — Create a test cook profile (do this first)

Use the **cook test email** (not your admin email).

### Step 1.1 — Register as a cook

1. Go to https://servdco-one.vercel.app/register  
2. Choose **Cook / Chef** registration.  
3. Fill in the form with **fake but realistic** details:

| Field | Example |
|-------|---------|
| Full name | `Maria Test Cook` |
| Email | `cook.test@yourdomain.com` |
| Password | `ServdCoTest2026!` |
| Phone | `614-555-0100` |
| State | **Ohio** |
| City | `Columbus` |
| ZIP | `43215` |
| Years experience | `5` |
| Primary cuisine | `Italian` |
| Bio | `Home cook specializing in family-style Italian meals.` |

4. Complete all registration steps.  
5. Confirm email from your inbox, then log in.

### Step 1.2 — Upload verification documents

On the last step (or cook dashboard → documents), upload **any small PDF or image** for each required file. Names can be fake; content does not need to be real for testing.

| Document | What to upload |
|----------|----------------|
| ServSafe Certificate | Any PDF or JPG (e.g. a blank PDF renamed `servsafe.pdf`) |
| Insurance | Any PDF or JPG |
| Background Check | Any PDF or JPG |

6. Submit documents. Status should show **Pending**.  
7. **Log out** — you will approve this cook later from the admin dashboard.

---

## Part 2 — Your account (owner → admin)

Use **`alexandria@servdco.com`** (or the email Kartik will promote to admin).

### Step 2.1 — Sign up as a family (not admin in the UI)

There is **no admin signup page**. You register like a normal family:

1. Go to https://servdco-one.vercel.app/register  
2. Choose **Family** registration.  
3. Example details:

| Field | Example |
|-------|---------|
| Full name | `Alexandria` |
| Email | `alexandria@servdco.com` |
| Password | Your secure password |
| State | **Ohio** |
| City | `Columbus` |
| ZIP | `43215` |

4. Confirm email, then log in once (you may land on the family dashboard).

### Step 2.2 — Kartik promotes you to admin

**You do not do this step.** Kartik runs this once in Supabase after your signup:

```sql
UPDATE public.profiles
SET role = 'admin', status = 'active', updated_at = now()
WHERE email = 'alexandria@servdco.com';
```

### Step 2.3 — Log in as admin

1. **Sign out** completely.  
2. Sign in again at https://servdco-one.vercel.app/login with `alexandria@servdco.com`.  
3. You should be redirected to **Admin Dashboard** (`/admin-dashboard`).

If you still see the family dashboard, sign out/in again or ask Kartik to confirm the SQL ran.

---

## Part 3 — Approve the cook (admin)

Logged in as admin:

### Step 3.1 — Approve cook verification

1. Open **Admin Dashboard** → **Verification** or **Cooks** tab.  
2. Find `Maria Test Cook` (or your cook name) — status **Pending**.  
3. Click **Approve**.

### Step 3.2 — Approve documents

1. Go to **Verification** / **Documents** tab.  
2. Open each uploaded document (PDF/image preview).  
3. Click **Approve** on each (ServSafe, Insurance, Background Check).

### Step 3.3 — Confirm cook is live on the website

1. Open https://servdco-one.vercel.app/browse-chefs in a **new tab** (or incognito).  
2. You should see the approved cook’s card.  
3. Homepage **“Explore local cooks”** section should also show the cook (no “join waitlist” empty state).

✅ **Pass:** Cook visible on Browse Cooks and clickable to full profile.

---

## Part 4 — Family books the cook and pays (test Stripe)

Use the **family test email** (third account).

### Step 4.1 — Register family

1. Incognito/private window → https://servdco-one.vercel.app/register  
2. **Family** registration:

| Field | Example |
|-------|---------|
| Full name | `Sarah Test Family` |
| Email | `family.test@yourdomain.com` |
| Password | `ServdCoTest2026!` |
| State | **Ohio** |
| City | `Columbus` |
| ZIP | `43215` |

3. Confirm email → log in → **Family Dashboard**.

### Step 4.2 — Book the cook

1. Go to **Browse Cooks** → open the approved cook’s profile.  
2. On the booking widget, enter:

| Field | Example |
|-------|---------|
| Date | A future date (e.g. next Saturday) |
| Service | Meal prep or cooking session |
| Guests | `2` or `4` |
| Notes | `Test booking — no real visit` |

3. Click **Book / Request booking**.  
4. If Stripe Checkout opens → pay with test card **`4242 4242 4242 4242`** (see table above).  
5. After success, return to ServdCo — booking should show as **Pending** or **Confirmed**.

---

## Part 5 — What to check as admin (checklist)

After the family booking, log back in as **alexandria@servdco.com** and verify:

### Admin Dashboard — Overview

- [ ] **Total Families** increased  
- [ ] **Total Chefs** shows your test cook  
- [ ] **Active / Completed Bookings** reflect the test booking  
- [ ] **Platform Revenue** updates after test payment (may take a minute)  
- [ ] **Pending Documents** is `0` after approvals  

### Chef verification

- [ ] Pending → Approved cook appears under approved list  
- [ ] Reject / Suspend buttons work only if you run a second test cook  

### Documents

- [ ] PDF and image preview open  
- [ ] Approve / Reject / Request resubmission (rejection needs a reason)  
- [ ] Cook receives a **notification** after approve/reject  

### Bookings

- [ ] **Bookings** tab lists the test booking  
- [ ] **View Details** modal shows family, cook, date, amount  
- [ ] You can change status (Confirm → Complete) if needed  

### Payments (Payouts tab)

- [ ] Test payment appears with Stripe ID and **Succeeded** status  
- [ ] Refunds: optional test — issue refund on the test payment (test mode only)  

### Users

- [ ] **Users** tab shows family + cook accounts  
- [ ] Search by email works  

### Audit logs

- [ ] **Audit Logs** tab shows your approve / document / booking actions  

### Notifications

- [ ] Bell icon shows notifications for cook (approved) and family (booking/payment)  

---

## Part 6 — What to check as cook

Log in as **cook.test@…**:

- [ ] **Cook Dashboard** loads with your profile  
- [ ] Verification status shows **Approved**  
- [ ] Documents show **Approved**  
- [ ] Incoming booking appears in dashboard  
- [ ] Notifications for approval and new booking  
- [ ] Profile visible on marketplace after admin approval  

Optional (if enabled):

- [ ] **Stripe Connect** onboarding link (test mode) — complete with fake business details if testing payouts  

---

## Part 7 — What to check as family

Log in as **family.test@…**:

- [ ] **Family Dashboard** shows upcoming booking  
- [ ] Browse Cooks lists approved cook  
- [ ] Booking history / activity is real (no fake names)  
- [ ] Payment receipt / booking status updates after test checkout  
- [ ] Can message cook (if messaging enabled)  

---

## Part 8 — Quick feature tour (optional)

| Page | URL | What to check |
|------|-----|----------------|
| Homepage | `/` | Real cooks only; no fake reviews |
| Browse Cooks | `/browse-chefs` | Filters, pagination, cook cards |
| Cook profile | `/chef/{id}` | Reviews, pricing, book widget |
| Pricing | `/pricing` | Session pricing note |
| Login | `/login` | Email confirmation modal after register |
| Waitlist | `/waitlist` | Only for inactive states (e.g. Texas) — Ohio should **not** send you here |

---

## Common issues

| Problem | Fix |
|---------|-----|
| Stuck on waitlist | Use **Ohio** as state, not Texas |
| Admin dashboard not showing | Sign out/in after Kartik runs admin SQL |
| Cook not on Browse page | Admin must **Approve** cook **and** all documents |
| Stripe payment fails | Use only `4242 4242 4242 4242`, future expiry |
| Email not confirmed | Check spam; click Supabase confirmation link |
| “No approved cooks” on homepage | Normal until Part 3 is complete |

---

## Test data rules (production)

- All payments: **Stripe test mode** only  
- Use **fake** names, addresses, and document files for testing  
- Do **not** use real credit cards  
- Do **not** share admin password publicly  

---

## Who to contact

| Issue | Contact |
|-------|---------|
| Admin access / SQL promotion | Kartik |
| Stripe / Vercel / Supabase | Kartik |
| Product feedback | `alexandria@servdco.com` → internal notes |

---

## One-page flow summary

```
1. Cook email     → Register (Ohio) → Upload docs → Log out
2. Alexandria     → Register family (Ohio) → Kartik → admin SQL → Log in → Admin Dashboard
3. Admin          → Approve cook + all documents
4. Website        → Browse Cooks shows cook ✓
5. Family email   → Register (Ohio) → Book cook → Pay 4242… → Done
6. Admin + both   → Run checklist above
```

Good luck — this is the full happy-path test of ServdCo before real customers.
