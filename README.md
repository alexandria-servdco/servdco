# ServdCo

ServdCo is a production-grade marketplace platform that connects families with private chefs for in-home dining experiences.

This repository showcases a production-grade marketplace platform that I designed and developed for a private client. The production infrastructure and repository ownership have since been transferred to the client, while this repository is maintained as a portfolio showcasing the implementation and architecture.

**Production website:** [https://servdco.com](https://servdco.com)

**Portfolio repository:** [https://github.com/kartik-singhhh03/servdco-saas](https://github.com/kartik-singhhh03/servdco-saas)

---

## Overview

The platform delivers a full end-to-end marketplace experience — from chef discovery and booking through payments, messaging, reviews, and ongoing subscription management. It is built as a modern React SPA with serverless APIs, a Supabase-backed data layer with row-level security, and Stripe Connect for chef payouts.

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Radix UI |
| Backend | Serverless APIs (Vercel), Express (local dev) |
| Database | Supabase, PostgreSQL |
| Payments | Stripe Connect, Stripe Checkout |
| Email | Resend |
| Observability | Sentry, Google Analytics 4 |
| Infrastructure | Cloudflare (Workers Cron, Turnstile) |

### Major Features

- **Authentication** — Email/password and OAuth via Supabase Auth
- **Family & Chef dashboards** — Role-specific workflows and profile management
- **Booking workflow** — Request, confirm, complete, and cancel in-home dining bookings
- **Messaging** — Family ↔ chef conversations with admin oversight
- **Reviews** — Post-booking ratings and feedback
- **Notifications** — In-app and email notification system
- **Stripe Connect payouts** — Express accounts, transfers, and payout history for chefs
- **Premium subscriptions** — Recurring family membership via Stripe Billing
- **Availability management** — Chef scheduling and booking slot control
- **Admin dashboard** — Platform operations, user management, and settings
- **Realtime updates** — Live data sync via Supabase Realtime
- **Secure RLS architecture** — Row-level security policies across all user-facing tables

---

## Development Repository

This repository represents the development version of the platform.

The production deployment, infrastructure, domain ownership, and operational repository have been transferred to the client.

**Production website:** [https://servdco.com](https://servdco.com)

This repository is maintained solely as a portfolio demonstrating my software engineering work.

---

## About

**Designed and developed by:**

**Kartik Singh**  
Full Stack Software Engineer

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- A Supabase project (for auth and database)
- Stripe account (for payments — test mode for local development)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/kartik-singhhh03/servdco-saas.git
   cd servdco-saas
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Copy the template and fill in your values locally:

   ```bash
   cp .env.example .env.local
   ```

   Never commit `.env.local` — it is gitignored. See `.env.example` for the full variable list.

4. **Apply database migrations** (optional — requires Supabase CLI)

   ```bash
   supabase login
   supabase link --project-ref <YOUR_PROJECT_REF>
   supabase db push
   ```

   See [`supabase/README.md`](supabase/README.md) for migration details.

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   The app runs at [http://localhost:8080](http://localhost:8080).

### Other Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build locally |
| `pnpm typecheck` | TypeScript validation |
| `pnpm test` | Run Vitest unit tests |

### Cloudflare Cron Worker

Scheduled reconciliation (payments, transfers, subscriptions) runs via a Cloudflare Workers Cron scheduler. See [`cloudflare-worker/README.md`](cloudflare-worker/README.md) for setup and deployment.

---

## Project Structure

```
client/           # React SPA (pages, components, services, stores)
server/           # Express server (local dev integration)
api/              # Vercel serverless API routes (Stripe, contact, cron)
shared/           # Types and utilities shared by client and server
supabase/         # Database migrations and scripts
cloudflare-worker/ # Scheduled cron worker
```

---

## License

This project is proprietary. Source code is provided for portfolio review purposes only.
