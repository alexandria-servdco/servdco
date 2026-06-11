# ServdCo Supabase Migrations

Phase 2 database architecture. **Do not apply until explicitly approved.**

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Supabase project created (dev or client)

## Link project

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

## Apply migrations

```bash
supabase db push
```

## Reset local dev (optional)

```bash
supabase start
supabase db reset
```

## Generate TypeScript types (Phase 3)

After schema is applied:

```bash
supabase gen types typescript --linked > ../client/lib/supabase/database.types.ts
```

## Migration to client-owned project

1. Ensure all files in `migrations/` are committed
2. Create new Supabase project
3. `supabase link --project-ref <CLIENT_REF>`
4. `supabase db push`
5. Migrate storage objects separately
6. Update environment variables in Vercel / `.env.local`

## File order

Migrations are timestamp-prefixed and must run sequentially. See `docs/supabase-phase2-database-architecture.md` for full ERD and RLS documentation.
