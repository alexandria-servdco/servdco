-- Columbus metro suburbs and fringe ZIPs missing from initial geo seed (e.g. 43004 Blacklick)

INSERT INTO public.geo_city_zip_codes (state_code, city_name, city_normalized, zip_code)
VALUES
  ('OH', 'Blacklick', 'blacklick', '43004'),
  ('OH', 'Gahanna', 'gahanna', '43054'),
  ('OH', 'Reynoldsburg', 'reynoldsburg', '43068'),
  ('OH', 'Pickerington', 'pickerington', '43147'),
  ('OH', 'Grove City', 'grove city', '43123'),
  ('OH', 'Hilliard', 'hilliard', '43026'),
  ('OH', 'Dublin', 'dublin', '43016'),
  ('OH', 'Dublin', 'dublin', '43017'),
  ('OH', 'Westerville', 'westerville', '43081'),
  ('OH', 'Westerville', 'westerville', '43082'),
  ('OH', 'New Albany', 'new albany', '43054'),
  ('OH', 'Pataskala', 'pataskala', '43062'),
  ('OH', 'Canal Winchester', 'canal winchester', '43110'),
  ('OH', 'Lewis Center', 'lewis center', '43035'),
  ('OH', 'Powell', 'powell', '43065'),
  ('OH', 'Delaware', 'delaware', '43015'),
  ('OH', 'Sunbury', 'sunbury', '43074'),
  ('OH', 'Galena', 'galena', '43021'),
  ('OH', 'Bexley', 'bexley', '43209'),
  ('OH', 'Groveport', 'groveport', '43125'),
  ('OH', 'Obetz', 'obetz', '43207'),
  ('OH', 'Whitehall', 'whitehall', '43213'),
  ('OH', 'Worthington', 'worthington', '43085')
ON CONFLICT (state_code, city_normalized, zip_code) DO NOTHING;
