-- =============================================================================
-- DEV ONLY — 5 approved chefs (idempotent). No bookings, payments, or reviews.
-- Run via: ALLOW_DEV_SEED=true node supabase/scripts/run-dev-chefs-seed.mjs
-- =============================================================================

-- Fixed UUIDs for idempotent upserts (dev browse / marketplace testing)
-- Users: d1000001 … d1000005 | Chef profiles: c1000001 … c1000005

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  v.id,
  'authenticated',
  'authenticated',
  v.email,
  crypt('DevChefSeed123!', gen_salt('bf')),
  now(),
  jsonb_build_object('role', 'chef', 'full_name', v.full_name),
  now(),
  now(),
  '',
  '',
  '',
  ''
FROM (VALUES
  ('d1000001-0000-4000-8000-000000000001'::uuid, 'dev-chef-1@servdco.local', 'Michael Brown'),
  ('d1000002-0000-4000-8000-000000000002'::uuid, 'dev-chef-2@servdco.local', 'Priya Patel'),
  ('d1000003-0000-4000-8000-000000000003'::uuid, 'dev-chef-3@servdco.local', 'James Wilson'),
  ('d1000004-0000-4000-8000-000000000004'::uuid, 'dev-chef-4@servdco.local', 'Maria Garcia'),
  ('d1000005-0000-4000-8000-000000000005'::uuid, 'dev-chef-5@servdco.local', 'David Chen')
) AS v(id, email, full_name)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

INSERT INTO public.profiles (
  id, email, full_name, role, status, city, state, zip, profile_completed
)
SELECT
  v.user_id,
  v.email,
  v.full_name,
  'chef',
  'active',
  v.city,
  v.state,
  v.zip,
  100
FROM (VALUES
  ('d1000001-0000-4000-8000-000000000001'::uuid, 'dev-chef-1@servdco.local', 'Michael Brown', 'Cleveland', 'Ohio', '44101'),
  ('d1000002-0000-4000-8000-000000000002'::uuid, 'dev-chef-2@servdco.local', 'Priya Patel', 'Austin', 'Texas', '78701'),
  ('d1000003-0000-4000-8000-000000000003'::uuid, 'dev-chef-3@servdco.local', 'James Wilson', 'Dallas', 'Texas', '75001'),
  ('d1000004-0000-4000-8000-000000000004'::uuid, 'dev-chef-4@servdco.local', 'Maria Garcia', 'Columbus', 'Ohio', '43215'),
  ('d1000005-0000-4000-8000-000000000005'::uuid, 'dev-chef-5@servdco.local', 'David Chen', 'Nashville', 'Tennessee', '37201')
) AS v(user_id, email, full_name, city, state, zip)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  zip = EXCLUDED.zip,
  status = 'active',
  role = 'chef',
  profile_completed = 100,
  updated_at = now();

INSERT INTO public.chef_profiles (
  id, user_id, display_name, bio, cuisines, location,
  verification_status, premium_status, profile_visibility,
  bookings_count, rating, reviews_count
)
SELECT
  v.chef_id,
  v.user_id,
  v.display_name,
  v.bio,
  v.cuisines,
  v.location,
  'approved',
  v.premium,
  'public',
  v.bookings_count,
  v.rating,
  0
FROM (VALUES
  ('c1000001-0000-4000-8000-000000000001'::uuid, 'd1000001-0000-4000-8000-000000000001'::uuid, 'Michael Brown', 'Classic Italian home dining with fresh handmade pasta.', ARRAY['Italian']::text[], 'Cleveland, OH', true, 98, 4.80),
  ('c1000002-0000-4000-8000-000000000002'::uuid, 'd1000002-0000-4000-8000-000000000002'::uuid, 'Priya Patel', 'Fragrant Indian meal prep adapted for modern wellness.', ARRAY['Indian']::text[], 'Austin, TX', false, 115, 4.90),
  ('c1000003-0000-4000-8000-000000000003'::uuid, 'd1000003-0000-4000-8000-000000000003'::uuid, 'James Wilson', 'Southern comfort food and slow-cooked BBQ spreads.', ARRAY['Southern BBQ', 'Comfort Food']::text[], 'Dallas, TX', false, 76, 4.70),
  ('c1000004-0000-4000-8000-000000000004'::uuid, 'd1000004-0000-4000-8000-000000000004'::uuid, 'Maria Garcia', 'Healthy comfort dining with local organic ingredients.', ARRAY['Healthy Meals', 'Mexican / Comfort Food']::text[], 'Columbus, OH', true, 142, 4.95),
  ('c1000005-0000-4000-8000-000000000005'::uuid, 'd1000005-0000-4000-8000-000000000005'::uuid, 'David Chen', 'Asian fusion menus tailored for family weeknight dinners.', ARRAY['Asian Fusion']::text[], 'Nashville, TN', false, 54, 4.60)
) AS v(chef_id, user_id, display_name, bio, cuisines, location, premium, bookings_count, rating)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  cuisines = EXCLUDED.cuisines,
  location = EXCLUDED.location,
  verification_status = 'approved',
  profile_visibility = 'public',
  premium_status = EXCLUDED.premium_status,
  bookings_count = EXCLUDED.bookings_count,
  rating = EXCLUDED.rating,
  updated_at = now();

INSERT INTO public.chef_portfolio_images (
  chef_profile_id, storage_bucket, storage_path, public_url, sort_order, is_public
)
SELECT
  v.chef_id,
  'cook-portfolio',
  v.chef_id::text || '/hero.jpg',
  v.url,
  0,
  true
FROM (VALUES
  ('c1000001-0000-4000-8000-000000000001'::uuid, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'),
  ('c1000002-0000-4000-8000-000000000002'::uuid, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'),
  ('c1000003-0000-4000-8000-000000000003'::uuid, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'),
  ('c1000004-0000-4000-8000-000000000004'::uuid, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'),
  ('c1000005-0000-4000-8000-000000000005'::uuid, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop')
) AS v(chef_id, url)
ON CONFLICT (storage_bucket, storage_path) DO UPDATE SET
  public_url = EXCLUDED.public_url,
  is_public = true,
  updated_at = now();

DELETE FROM public.chef_availability
WHERE chef_profile_id IN (
  'c1000001-0000-4000-8000-000000000001',
  'c1000002-0000-4000-8000-000000000002',
  'c1000003-0000-4000-8000-000000000003',
  'c1000004-0000-4000-8000-000000000004',
  'c1000005-0000-4000-8000-000000000005'
);

INSERT INTO public.chef_availability (
  chef_profile_id, day_of_week, time_slots, recurring, timezone
)
SELECT
  v.chef_id,
  v.dow,
  v.slots::jsonb,
  true,
  'America/New_York'
FROM (VALUES
  ('c1000001-0000-4000-8000-000000000001'::uuid, 1, '["09:00 AM - 12:00 PM", "04:00 PM - 07:00 PM"]'),
  ('c1000001-0000-4000-8000-000000000001'::uuid, 3, '["01:00 PM - 04:00 PM"]'),
  ('c1000001-0000-4000-8000-000000000001'::uuid, 5, '["09:00 AM - 12:00 PM"]'),
  ('c1000002-0000-4000-8000-000000000002'::uuid, 2, '["10:00 AM - 02:00 PM"]'),
  ('c1000002-0000-4000-8000-000000000002'::uuid, 4, '["05:00 PM - 08:00 PM"]'),
  ('c1000003-0000-4000-8000-000000000003'::uuid, 1, '["11:00 AM - 03:00 PM"]'),
  ('c1000003-0000-4000-8000-000000000003'::uuid, 5, '["04:00 PM - 08:00 PM"]'),
  ('c1000004-0000-4000-8000-000000000004'::uuid, 1, '["09:00 AM - 12:00 PM", "04:00 PM - 07:00 PM"]'),
  ('c1000004-0000-4000-8000-000000000004'::uuid, 3, '["01:00 PM - 04:00 PM", "05:00 PM - 08:00 PM"]'),
  ('c1000005-0000-4000-8000-000000000005'::uuid, 2, '["12:00 PM - 04:00 PM"]'),
  ('c1000005-0000-4000-8000-000000000005'::uuid, 6, '["10:00 AM - 02:00 PM"]')
) AS v(chef_id, dow, slots);
