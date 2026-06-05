# ServdCo Stripe Dashboard Setup Guide for Alexandria

This guide is for Stripe Dashboard setup only. It is written for a non-technical founder and avoids implementation details.

## 1. What Alexandria needs before opening Stripe

- **Legal business name**: The exact name registered for ServdCo.
- **Business address**: Legal address, not a home address if a registered office exists.
- **Business email and phone**: A support email and a reachable phone number.
- **Bank account**: The business account that will receive Stripe payouts.
- **Tax details**: Any tax ID, registration numbers, or VAT/GST details.
- **Brand assets**: Logo, icon, brand colors, and short business description.
- **Policies**: Refund policy, cancellation policy, and customer support contact.
- **Founder access**: Alexandria should be the primary owner/admin of the Stripe account.

**Why this matters for ServdCo:** Stripe will block or delay activation if profile, payout, or verification details are missing.

**Who does it:** Alexandria.

## 2. Stripe account setup

- **Click**: Go to Stripe and create a new account.
- **Select**: Choose the correct country, business type, and currency.
- **Enter**: Use ServdCo’s legal business details exactly as registered.
- **Enable**: Turn on two-factor authentication immediately.
- **Add**: Connect the business bank account for payouts.

**Why this matters for ServdCo:** Marketplace payouts and billing depend on a fully verified platform account.

**Who does it:** Alexandria.

## 3. Business profile configuration

- **Click**: Dashboard → Settings → Business details.
- **Set**: Legal business name, public business name, and support contact.
- **Set**: Business address, website, and industry category.
- **Select**: A clear statement descriptor such as `SERVDCO` or `SERVDCO*BOOKING`.
- **Review**: Ensure the public-facing name matches ServdCo branding.

**Why this matters for ServdCo:** Families will see this name on receipts and card statements.

**Who does it:** Alexandria, with final review from the developer if needed.

## 4. Branding configuration

- **Click**: Dashboard → Settings → Branding.
- **Upload**: ServdCo logo and brand icon.
- **Choose**: Brand color that matches the website.
- **Set**: Checkout appearance to look like ServdCo, not generic Stripe.
- **Review**: Email branding so receipts and billing emails feel consistent.

**Why this matters for ServdCo:** Trust is critical for a marketplace handling family payments and cook subscriptions.

**Who does it:** Alexandria.

## 5. Connect configuration

- **Click**: Dashboard → Connect.
- **Select**: Stripe Connect Express, not Standard or Custom.
- **Enable**: The onboarding flow for connected accounts.
- **Review**: Identity and bank-account collection requirements for cooks.
- **Set**: Support contact and platform branding for connected account onboarding.
- **Confirm**: The marketplace is set up for Separate Charges & Transfers.
- **Confirm**: That the platform is set up for a marketplace model with cook payouts.

**Why this matters for ServdCo:** Cooks need a simple onboarding flow and Stripe-hosted payout setup.

**Who does it:** Alexandria can enable Connect; the developer should finalize operational settings later.

## 6. Premium subscription configuration

- **Click**: Dashboard → Products.
- **Create**: One product for cook premium membership.
- **Name**: Use a clear name like `ServdCo Premium`.
- **Set**: A monthly recurring price only, unless Alexandria has explicitly approved annual pricing.
- **Describe**: The benefits clearly for cooks.
- **Review**: Use one live price after the premium amount is finalized.

**Why this matters for ServdCo:** Premium subscriptions should be easy to understand and simple to bill every month.

**Who does it:** Alexandria sets the commercial decision; the developer should confirm the final price before launch.

## 7. Tax settings

- **Click**: Dashboard → Tax.
- **Select**: Only the countries or regions where ServdCo must collect tax.
- **Add**: Any tax registrations that already exist.
- **Review**: Whether tax should be collected on premium subscriptions, bookings, or both.
- **Keep**: Tax rules conservative until the developer confirms the final tax treatment.

**Why this matters for ServdCo:** Marketplace services may be taxed differently by region and product type.

**Who does it:** Alexandria provides tax details; the developer should confirm the final tax setup.

## 8. Customer emails

- **Click**: Dashboard → Settings → Customer emails.
- **Enable**: Payment receipts, failed payment emails, and subscription billing emails.
- **Review**: The sender name, support email, and logo.
- **Keep**: Messaging concise and professional.
- **Disable**: Any marketing-style messages that ServdCo does not want Stripe to send.

**Why this matters for ServdCo:** Families and cooks need clear payment communication without confusion.

**Who does it:** Alexandria.

## 9. Team access & permissions

- **Click**: Dashboard → Settings → Team and security.
- **Invite**: Alexandria as owner/admin.
- **Add**: The developer with the minimum access needed.
- **Restrict**: Sensitive permissions to only trusted people.
- **Require**: Two-factor authentication for everyone.

**Why this matters for ServdCo:** Payment settings and payouts are sensitive.

**Who does it:** Alexandria.

## 10. Test mode setup

- **Click**: Switch Stripe to Test mode from the dashboard.
- **Create**: Test versions of the premium product and price.
- **Use**: Stripe test cards and test connected-account onboarding.
- **Check**: That receipts, emails, and branding look correct in test mode.
- **Confirm**: That the test setup supports bookings, premium subscriptions, and cook payouts.

**Why this matters for ServdCo:** Test mode lets the team validate the marketplace before charging real money.

**Who does it:** The developer tests the flows; Alexandria reviews the results in Stripe.

## 11. Production mode setup

- **Click**: Switch to Live mode only after the business is verified.
- **Confirm**: Bank account, identity, and business verification are complete.
- **Create**: Final live products and prices only after launch pricing is approved.
- **Review**: Live branding, customer emails, and statement descriptor.
- **Check**: That Connect and Billing are both active in live mode.

**Why this matters for ServdCo:** Live mode is where real family charges, cook payouts, and subscriptions happen.

**Who does it:** Alexandria approves it; the developer should confirm the system is ready first.

## 12. Things NOT to configure yet

- **Do not** create multiple premium products unless pricing is final.
- **Do not** activate live mode before verification is complete.
- **Do not** change payout settings casually without confirming the marketplace policy.
- **Do not** enable extra Stripe features that ServdCo is not using yet.
- **Do not** try to force booking charges or payouts outside the marketplace model.
- **Do not** send marketing-style customer emails from Stripe.
- **Do not** make tax decisions without confirming the business’s actual obligations.

**Why this matters for ServdCo:** Premature settings can create confusion, incorrect billing, or payout delays.

**Who does it:** Alexandria should avoid these until the developer confirms readiness.

## 13. Information she should prepare for the developer

- **Final platform fee**: The percentage ServdCo keeps from bookings.
- **Premium price**: The monthly cook subscription amount.
- **Payout policy**: When cooks should be paid after a booking.
- **Refund policy**: When families get refunds or partial refunds.
- **Tax treatment**: Whether bookings and subscriptions are taxed.
- **Brand assets**: Logo, icon, colors, and support email.
- **Legal details**: Business name, address, and tax registrations.
- **Marketplace policy**: Whether cooks need Express onboarding only.

**Why this matters for ServdCo:** The developer needs these decisions before finalizing Stripe setup.

**Who does it:** Alexandria prepares the decisions; the developer uses them later.

## 14. Launch readiness checklist

- [ ] Stripe account fully verified
- [ ] Business profile complete
- [ ] Branding matches ServdCo
- [ ] Connect Express enabled
- [ ] Premium product and monthly price approved
- [ ] Tax profile reviewed
- [ ] Customer emails branded
- [ ] Team access locked down
- [ ] Test mode flows checked
- [ ] Live mode ready only after approval
- [ ] Policies prepared for refunds, payouts, and support
- [ ] Developer confirms the marketplace setup is ready

**Why this matters for ServdCo:** This is the final check before families can pay and cooks can receive payouts safely.

**Who does it:** Alexandria with developer sign-off.