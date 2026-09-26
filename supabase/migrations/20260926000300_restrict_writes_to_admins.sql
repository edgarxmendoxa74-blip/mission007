-- Restrict all writes to signed-in admins (Supabase Auth).
-- Customers (anon) keep read access to the menu/settings and may only
-- INSERT orders; they can no longer read, change or delete orders.
-- Admins are listed by email in admin_emails; the matching auth user
-- must exist and have a confirmed email.
-- Date: 2026-09-26

CREATE TABLE IF NOT EXISTS admin_emails (
  email text PRIMARY KEY CHECK (email = lower(email)),
  created_at timestamptz DEFAULT now()
);
-- RLS on with no policies: only the service role / SQL editor can manage it
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.admin_emails a ON a.email = lower(u.email)
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM public;
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;

-- Drop every existing policy on the app tables so only the ones below apply
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('categories', 'menu_items', 'variations', 'add_ons',
                        'payment_methods', 'site_settings', 'orders', 'order_items')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Storefront data: public read, admin write
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories', 'menu_items', 'variations', 'add_ons', 'site_settings'] LOOP
    EXECUTE format('CREATE POLICY "Public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins manage" ON public.%I FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()))', t);
  END LOOP;
END $$;

CREATE POLICY "Public read active" ON payment_methods
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins manage" ON payment_methods
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- Orders: anyone may place one (always as 'pending'), only admins read/update/delete
CREATE POLICY "Anyone can place orders" ON orders
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY "Admins manage" ON orders
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Anyone can add order items" ON order_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins manage" ON order_items
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- menu-images bucket: public read, admin write
DROP POLICY IF EXISTS "Anyone can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete menu images" ON storage.objects;

CREATE POLICY "Admins can upload menu images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu-images' AND (SELECT public.is_admin()));
CREATE POLICY "Admins can update menu images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'menu-images' AND (SELECT public.is_admin()));
CREATE POLICY "Admins can delete menu images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'menu-images' AND (SELECT public.is_admin()));

INSERT INTO admin_emails (email) VALUES ('mision07@mali.com')
ON CONFLICT (email) DO NOTHING;
