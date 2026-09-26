-- Migration to add Smart Menu items (Mission 007 Menu 1-5 format)
-- Categories: Mission Meals, Social Dining, Coffee Intelligence, Cold Operations, Sweet Endings
-- Date: 2026-09-26

-- =====================================================
-- 0. ENSURE REQUIRED SCHEMA EXISTS
-- Makes this migration safe to run on a database where the
-- earlier migrations were not applied. All statements are idempotent.
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '☕',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  category text NOT NULL REFERENCES categories(id),
  popular boolean DEFAULT false,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Required by the ON CONFLICT (name, category) upserts below.
-- If this fails with "is duplicated", remove the duplicate menu_items rows first.
CREATE UNIQUE INDEX IF NOT EXISTS menu_items_name_category_key
  ON menu_items (name, category);

-- Public read access (only added if the tables had no policies yet)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['categories', 'menu_items', 'variations', 'add_ons'] LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('CREATE POLICY "Anyone can read %s" ON %I FOR SELECT TO public USING (true)', t, t);
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    v_item_id uuid;
    v_mission_cat_id text := 'mission-meals';
    v_social_cat_id text := 'social-dining';
    v_coffee_cat_id text := 'coffee-intelligence';
    v_cold_cat_id text := 'cold-operations';
    v_sweet_cat_id text := 'sweet-endings';
BEGIN

    -- =====================================================
    -- 1. CREATE SMART CATEGORIES
    -- =====================================================
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES
        (v_mission_cat_id, 'Mission Meals', '🍽️', 1, true)
        ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES
        (v_social_cat_id, 'Social Dining', '🍟', 2, true)
        ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES
        (v_coffee_cat_id, 'Coffee Intelligence', '☕', 3, true)
        ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES
        (v_cold_cat_id, 'Cold Operations – Signature Mocktails', '🥤', 4, true)
        ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES
        (v_sweet_cat_id, 'Sweet Endings', '🍰', 5, true)
        ON CONFLICT (id) DO NOTHING;

    -- =====================================================
    -- 2. MISSION MEALS CATEGORY
    -- =====================================================

    ----- Menu #1: Green Status -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Green Status', 'Garden fresh greens & grilled protein protocol. Available only from 11 am to 2 pm.',
            125, v_mission_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Basic', 125),
        (v_item_id, 'Classic', 140),
        (v_item_id, 'Loaded', 215);

    DELETE FROM add_ons WHERE menu_item_id = v_item_id;
    INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
        (v_item_id, 'More Fish (per 40g)', 45, 'Protein'),
        (v_item_id, 'Egg', 15, 'Protein'),
        (v_item_id, 'Dressing', 30, 'Sauces');

    ----- Menu #2: Fish Protocol -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Fish Protocol', 'Signature battered fish fillet, mission recipe. Available only from 11 am to 2 pm.',
            109, v_mission_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Basic', 109),
        (v_item_id, 'Classic', 189),
        (v_item_id, 'Loaded', 239);

    DELETE FROM add_ons WHERE menu_item_id = v_item_id;
    INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
        (v_item_id, 'Regular Chips', 75, 'Sides'),
        (v_item_id, 'Medium Chips', 100, 'Sides'),
        (v_item_id, 'Large Chips', 125, 'Sides'),
        (v_item_id, 'Dip (Tartar Sauce)', 25, 'Sauces'),
        (v_item_id, 'Dip (Spicy Mayo)', 25, 'Sauces'),
        (v_item_id, 'Plain Rice', 15, 'Sides');

    ----- Menu #3: Sausage Code -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Sausage Code', 'House-blend artisan sausages per directive. Available only from 11 am to 2 pm.',
            129, v_mission_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Basic', 129),
        (v_item_id, 'Classic', 199),
        (v_item_id, 'Loaded', 279);

    DELETE FROM add_ons WHERE menu_item_id = v_item_id;
    INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
        (v_item_id, 'Whole Sausage', 150, 'Protein'),
        (v_item_id, 'Garlic Rice', 20, 'Sides'),
        (v_item_id, 'Plain Rice', 15, 'Sides'),
        (v_item_id, 'Egg', 15, 'Protein'),
        (v_item_id, 'Dressing (Mustard Crema)', 25, 'Sauces');

    ----- Menu #4: Beef Directive -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Beef Directive', 'Slow-cooked beef entree with mission sides. Available only from 11 am to 2 pm.',
            99, v_mission_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Basic', 99),
        (v_item_id, 'Classic', 169),
        (v_item_id, 'Loaded', 229);

    DELETE FROM add_ons WHERE menu_item_id = v_item_id;
    INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
        (v_item_id, 'Plain Rice', 15, 'Sides'),
        (v_item_id, 'Egg', 15, 'Protein'),
        (v_item_id, 'Cheese', 15, 'Protein'),
        (v_item_id, 'Gravy', 15, 'Sauces'),
        (v_item_id, 'Vege Sides', 10, 'Sides');

    -- =====================================================
    -- 3. SOCIAL DINING CATEGORY
    -- =====================================================

    ----- Menu #5: Mission Crisp -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Mission Crisp', 'Crisp golden potato rounds, team-favorite cuts. Available only from 2 pm to 5 pm.',
            79, v_social_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Standard', 79),
        (v_item_id, 'Trio', 110);

    DELETE FROM add_ons WHERE menu_item_id = v_item_id;
    INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
        (v_item_id, 'Extra Dip (Honey Garlic)', 10, 'Dips'),
        (v_item_id, 'Extra Dip (Pineapple Chili)', 10, 'Dips'),
        (v_item_id, 'Extra Dip (Cacao Barbecue)', 10, 'Dips'),
        (v_item_id, 'Extra Dip (Trio)', 25, 'Dips');

    ----- Dip Crunch Set -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Dip Crunch Set', 'Crisp dippers + mission dips',
            120, v_social_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Bite Solo', 120),
        (v_item_id, 'Snack Set', 220),
        (v_item_id, 'Share Set', 360);

    ----- Sausage Code Bite Set -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Sausage Code Bite Set', 'Bite-sized sausage code pieces with dips',
            135, v_social_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Bite Solo', 135),
        (v_item_id, 'Snack Set', 245),
        (v_item_id, 'Share Set', 395);

    -- =====================================================
    -- 4. COFFEE INTELLIGENCE CATEGORY
    -- =====================================================

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Espresso Shot', 'Pure pulled espresso briefing', 65, v_coffee_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    ----- Black Protocol -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Black Protocol', 'Pure brewed protocol, intelligence-grade beans',
            110, v_coffee_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Hot (8oz)', 110),
        (v_item_id, 'Iced (16oz)', 130);

    ----- Agent Latte -----
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Agent Latte', 'Silky milk mission espresso latte',
            145, v_coffee_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available
    RETURNING id INTO v_item_id;

    DELETE FROM variations WHERE menu_item_id = v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Hot (8oz)', 145),
        (v_item_id, 'Iced (16oz)', 165);

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Midnight Brief (Cold Brew)', '18-hour slow-steeped cold brew dossier',
            140, v_coffee_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    -- =====================================================
    -- 5. COLD OPERATIONS - SIGNATURE MOCKTAILS
    -- =====================================================

    -- Refreshers
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Red Alert', 'Berry-berry refresher, high-signal blend',
            120, v_cold_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Golden File', 'Tropical refresher mission dossier',
            120, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Green Signal', 'Green apple & kiwi go-signal refresher',
            125, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    -- Tea Series
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Midnight Dossier', 'Deep black tea blend with midnight profile',
            130, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Secret Garden', 'Jasmine & herb tea brief — garden-classified',
            125, v_cold_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    -- Coffee Bar Mocktails
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Blackout', 'Coffee mocktail — dark roast profile, zero ABV',
            150, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Shadow Protocol', 'Shaken coffee mocktail, covert cream finish',
            155, v_cold_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    -- Fresh Blends
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Watermelon Rush', 'Fresh watermelon mission blend',
            135, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Mango Boost', 'Ripe mango intelligence smoothie',
            140, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Banana Energy', 'Banana + oats field-ops blend',
            135, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Pineapple Chill', 'Pineapple recovery blend, chill-factor profile',
            140, v_cold_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Berry Reset', 'Mixed-berry reset blend',
            145, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Peach Focus', 'Peach focus formula blend',
            140, v_cold_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    -- =====================================================
    -- 6. SWEET ENDINGS CATEGORY
    -- =====================================================

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Honey Brioche Toast', 'Buttery brioche toast mission-glazed with honey',
            165, v_sweet_cat_id, true, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Tablea Brownie', 'Rich Filipino tablea cacao brownie',
            145, v_sweet_cat_id, false, true)
    ON CONFLICT (name, category) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        popular = EXCLUDED.popular,
        available = EXCLUDED.available;

    RAISE NOTICE 'Smart Menu items (Mission 007 Menu 1-5) inserted successfully!';
END $$;
