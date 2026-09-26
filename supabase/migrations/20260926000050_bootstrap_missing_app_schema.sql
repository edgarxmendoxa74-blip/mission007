-- Bring a database that only has the menu tables up to what the app expects:
-- menu_items discount/flavor columns, payment_methods, orders, order_items,
-- site_settings and the menu-images storage bucket.
-- Consolidates the earlier migrations; every statement is idempotent.
-- Policies follow the app's current model (admin dashboard uses the anon key).
-- Date: 2026-09-26

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- menu_items: discount pricing + flavors
-- =====================================================
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS discount_price decimal(10,2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS discount_start_date timestamptz;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS discount_end_date timestamptz;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS discount_active boolean DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS flavors text[] DEFAULT ARRAY[]::text[];

-- =====================================================
-- payment_methods
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  qr_code_url text NOT NULL,
  active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- orders / order_items
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('pickup', 'delivery')),
  address text,
  landmark text,
  pickup_time text,
  payment_method text NOT NULL,
  reference_number text,
  total_price decimal(10,2) NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  variation_name text,
  flavor_name text,
  add_ons jsonb DEFAULT '[]'::jsonb,
  total_item_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =====================================================
-- site_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- updated_at triggers
-- =====================================================
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS: public read, anon write (admin dashboard has no Supabase Auth)
-- =====================================================
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['payment_methods', 'orders', 'order_items', 'site_settings'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND policyname = 'Anyone can read ' || t) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO public USING (true)', 'Anyone can read ' || t, t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND policyname = 'Anyone can manage ' || t) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', 'Anyone can manage ' || t, t);
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- menu-images storage bucket
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access for menu images') THEN
    CREATE POLICY "Public read access for menu images" ON storage.objects
      FOR SELECT TO public USING (bucket_id = 'menu-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can upload menu images') THEN
    CREATE POLICY "Anyone can upload menu images" ON storage.objects
      FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'menu-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can update menu images') THEN
    CREATE POLICY "Anyone can update menu images" ON storage.objects
      FOR UPDATE TO anon, authenticated USING (bucket_id = 'menu-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can delete menu images') THEN
    CREATE POLICY "Anyone can delete menu images" ON storage.objects
      FOR DELETE TO anon, authenticated USING (bucket_id = 'menu-images');
  END IF;
END $$;
