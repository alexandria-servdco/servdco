# ServdCo Supabase Migrations

Database schema and migrations for the ServdCo platform.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A Supabase project (local or hosted)

## Link project

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

## Apply migrations

```bash
supabase db push
```

This applies all files in `migrations/` including reference data (`launch_regions`, `feature_flags`, geo ZIPs).

`seed.sql` is for **local dev only** (`supabase db reset`) — not used in production.

## Reset local dev (optional)

```bash
supabase start
supabase db reset
```

## Generate TypeScript types

After the schema is applied:

```bash
supabase gen types typescript --linked > ../client/lib/supabase/database.types.ts
```

## File order

Migrations are timestamp-prefixed and must run sequentially.
