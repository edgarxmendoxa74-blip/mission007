-- Facebook Page that receives customer orders via Messenger
-- Date: 2026-09-26

-- Ensure the settings table exists (safe if earlier migrations were not applied)
CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policies are created only if missing (no DROP statements, so the script is
-- safe to re-run and doesn't trigger Supabase's "destructive operation" prompt)
DO $$
BEGIN
  -- Public read access, needed by the storefront
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'Anyone can read site settings'
  ) THEN
    CREATE POLICY "Anyone can read site settings"
      ON site_settings
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Allow the admin dashboard (which uses the anon key, no Supabase Auth) to save settings.
  -- WARNING: this lets anyone with the public anon key change site settings,
  -- including messenger_page_id. Replace with Supabase Auth-based policies when possible.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'Anon users can manage site settings'
  ) THEN
    CREATE POLICY "Anon users can manage site settings"
      ON site_settings
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

INSERT INTO site_settings (id, value, type, description) VALUES
  ('messenger_page_id', '', 'text', 'Facebook Page username or Page ID that receives orders via Messenger')
ON CONFLICT (id) DO NOTHING;
