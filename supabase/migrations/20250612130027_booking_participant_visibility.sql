-- Chef preview: city/state before accept (app masks street/zip/phone/email until accepted).
-- Family profile: chefs may read contact fields for bookings they are assigned to.

CREATE POLICY "booking_addresses_select_chef_pending"
  ON public.booking_addresses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.deleted_at IS NULL
        AND b.status = 'pending'
        AND public.owns_chef_profile(b.chef_profile_id)
    )
  );

CREATE POLICY "profiles_select_booking_chef"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.chef_profiles cp ON cp.id = b.chef_profile_id
      WHERE b.family_id = profiles.id
        AND b.deleted_at IS NULL
        AND cp.user_id = auth.uid()
    )
  );
