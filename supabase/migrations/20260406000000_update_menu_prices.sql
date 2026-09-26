-- Migration to update all menu prices and add new items per latest menu sheet
-- Date: 2026-04-06

DO $$
DECLARE
    v_item_id uuid;
    v_silog_cat_id text := 'silog-meals';
    v_combo_cat_id text := 'combo-meals';
    v_ramen_cat_id text := 'ramen';
    v_extras_cat_id text := 'extras';
BEGIN

    -- =====================================================
    -- 1. CREATE NEW CATEGORIES
    -- =====================================================
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_extras_cat_id, 'Extras', '🍚', 8, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_silog_cat_id, 'Silog Meals', '🍳', 23, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_combo_cat_id, 'Combo Meals', '🍔🍗🍟', 24, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_ramen_cat_id, 'Ramen', '🍜', 25, true) ON CONFLICT (id) DO NOTHING;

    -- =====================================================
    -- 2. UPDATE CHICKEN WINGS PRICES & VARIATIONS
    -- =====================================================
    -- Update base price for Chicken Wings to 119 (4pcs price)
    UPDATE menu_items SET base_price = 119 WHERE name = 'Chicken Wings' AND category = 'chicken-wings';
    
    -- Delete old variations for Chicken Wings and re-insert
    DELETE FROM variations WHERE menu_item_id IN (SELECT id FROM menu_items WHERE name = 'Chicken Wings' AND category = 'chicken-wings');
    
    INSERT INTO variations (menu_item_id, name, price)
    SELECT id, '4 pcs', 119 FROM menu_items WHERE name = 'Chicken Wings' AND category = 'chicken-wings';
    
    INSERT INTO variations (menu_item_id, name, price)
    SELECT id, '6 pcs', 159 FROM menu_items WHERE name = 'Chicken Wings' AND category = 'chicken-wings';
    
    INSERT INTO variations (menu_item_id, name, price)
    SELECT id, '12 pcs', 299 FROM menu_items WHERE name = 'Chicken Wings' AND category = 'chicken-wings';

    -- =====================================================
    -- 3. ADD RICE (Extras category)
    -- =====================================================
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    VALUES ('Rice', 'Steamed white rice', 20, v_extras_cat_id, false, true);

    -- =====================================================
    -- 4. UPDATE BURGER PRICES
    -- =====================================================
    UPDATE menu_items SET base_price = 109 WHERE name = 'Classic Burger' AND category = 'burger';
    UPDATE menu_items SET base_price = 109 WHERE name = 'Chicken Burger' AND category = 'burger';
    UPDATE menu_items SET base_price = 140 WHERE name = 'Smash Burger' AND category = 'burger';
    UPDATE menu_items SET base_price = 130 WHERE name = 'Cheesy Bacon' AND category = 'burger';
    UPDATE menu_items SET base_price = 130 WHERE name = 'Cheezy Bacon' AND category = 'burger';
    UPDATE menu_items SET base_price = 150 WHERE name = 'Hawaiian Burger' AND category = 'burger';
    UPDATE menu_items SET base_price = 150 WHERE name = 'Chili Burger' AND category = 'burger';
    UPDATE menu_items SET base_price = 79 WHERE name = '1 pc Burger Steak' AND category = 'burger';
    UPDATE menu_items SET base_price = 79 WHERE name = 'Burger Steak' AND category = 'burger';
    
    -- Remove Cheese Burger and 2 pcs Burger Steak (not in new menu)
    -- Keep them but they can be disabled via admin if needed

    -- Add Philly-Cheesteak if not exists
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    SELECT 'Philly-Cheesteak', 'Philly-style cheesesteak sandwich', 180, 'burger', false, true
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Philly-Cheesteak' AND category = 'burger');

    -- =====================================================
    -- 5. UPDATE HOTDOG PRICES
    -- =====================================================
    UPDATE menu_items SET base_price = 99, name = 'Chilidog' WHERE name = 'Chili-Dog Classic' AND category = 'hotdogs';
    UPDATE menu_items SET base_price = 109, name = 'Chilidog Jalapeno' WHERE name = 'Chili-Dog Jalapeno' AND category = 'hotdogs';

    -- =====================================================
    -- 6. UPDATE EGGDROP PRICES
    -- =====================================================
    UPDATE menu_items SET base_price = 100, name = 'Regular Eggylicious' WHERE name = 'Regular Egglicious' AND category = 'eggdrop';
    UPDATE menu_items SET base_price = 120, name = 'Spam and Cheezzy' WHERE name = 'Spam & Cheesy' AND category = 'eggdrop';
    UPDATE menu_items SET base_price = 120, name = 'Spam and Cheezzy' WHERE name = 'Spam Egglicious' AND category = 'eggdrop';
    UPDATE menu_items SET base_price = 120, name = 'Bacon and Cheezzy' WHERE name = 'Bacon & Cheesy' AND category = 'eggdrop';
    UPDATE menu_items SET base_price = 120, name = 'Bacon and Cheezzy' WHERE name = 'Bacon Egglicious' AND category = 'eggdrop';
    UPDATE menu_items SET base_price = 120, name = 'Ham and Cheezzy' WHERE name = 'Ham & Cheesy' AND category = 'eggdrop';
    UPDATE menu_items SET base_price = 120, name = 'Ham and Cheezzy' WHERE name = 'Ham Egglicious' AND category = 'eggdrop';
    UPDATE menu_items SET base_price = 130, name = 'Burger and Cheezzy' WHERE name = 'Burger & Cheesy' AND category = 'eggdrop';

    -- =====================================================
    -- 7. UPDATE PASTA PRICES
    -- =====================================================
    UPDATE menu_items SET base_price = 89 WHERE name = 'Spaghetti' AND category = 'pasta';
    UPDATE menu_items SET base_price = 89, name = 'Carbonara' WHERE name = 'Creamy Carbonara' AND category = 'pasta';
    UPDATE menu_items SET base_price = 89, name = 'Charlie Chan' WHERE name = 'Charlie-Chan' AND category = 'pasta';

    -- =====================================================
    -- 8. UPDATE SNACK PRICES
    -- =====================================================
    UPDATE menu_items SET base_price = 85 WHERE name = 'Nachos' AND category = 'fries-nachos';
    UPDATE menu_items SET base_price = 99 WHERE name = 'Fries Overload' AND category = 'fries-nachos';
    UPDATE menu_items SET base_price = 70 WHERE name = 'Onion Rings' AND category = 'fries-nachos';
    
    -- Consolidate fries flavored items into one "Fries Flavored" at ₱50
    UPDATE menu_items SET base_price = 50, name = 'Fries Flavored' WHERE name = 'Cheese Fries' AND category = 'fries-nachos';
    -- Remove duplicate flavored fries (BBQ, Spicy BBQ) — they are now just "Fries Flavored"
    DELETE FROM menu_items WHERE name = 'BBQ Fries' AND category = 'fries-nachos';
    DELETE FROM menu_items WHERE name = 'Spicy BBQ Fries' AND category = 'fries-nachos';

    -- =====================================================
    -- 9. MILK TEA - All at ₱70 (already correct in DB)
    -- =====================================================
    UPDATE menu_items SET base_price = 70 WHERE category = 'milk-tea';

    -- =====================================================
    -- 10. UPDATE COFFEE PRICES
    -- =====================================================
    UPDATE menu_items SET base_price = 80 WHERE name = 'Caramel Macchiato Coffee' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 80 WHERE name = 'Matcha Coffee Latte' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 95 WHERE name = 'Caramel Sea Salt Latte' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 80 WHERE name = 'Hazelnut Latte' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 80, name = 'Baileys Coffee' WHERE name = 'Baileys' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 80, name = 'Butterscotch Coffee' WHERE name = 'Butterscotch' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 80 WHERE name = 'Hazelnut Macchiato Coffee' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 80, name = 'Hazelnut Machiato' WHERE name = 'Hazelnut Macchiato Coffee' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 80, name = 'Caramel Machiato' WHERE name = 'Caramel Macchiato Coffee' AND category = 'coffee-new';
    UPDATE menu_items SET base_price = 50 WHERE name = 'Cafe Americano' AND category = 'coffee-new';
    
    -- Remove Thai Coffee and Choco Coffee (not in new menu)
    DELETE FROM menu_items WHERE name = 'Thai Coffee' AND category = 'coffee-new';
    DELETE FROM menu_items WHERE name = 'Choco Coffee' AND category = 'coffee-new';
    
    -- Add new coffee items
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    SELECT 'Pistachio Coffee', 'Premium pistachio flavored coffee', 120, 'coffee-new', false, true
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pistachio Coffee' AND category = 'coffee-new');
    
    INSERT INTO menu_items (name, description, base_price, category, popular, available)
    SELECT 'Biscoff Frappe', 'Biscoff cookie blended frappe', 145, 'coffee-new', false, true
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Biscoff Frappe' AND category = 'coffee-new');

    -- =====================================================
    -- 11. UPDATE MILKSHAKE PRICES
    -- =====================================================
    UPDATE menu_items SET base_price = 90, name = 'Oreo in a Cup' WHERE name = 'Oreo in a Cup' AND category = 'milkshake';
    UPDATE menu_items SET base_price = 90, name = 'Kit Kat' WHERE name = 'Kitkat' AND category = 'milkshake';
    UPDATE menu_items SET base_price = 90, name = 'Strawberry MS' WHERE name = 'Strawberry Shake' AND category = 'milkshake';
    UPDATE menu_items SET base_price = 90, name = 'Avocado MS' WHERE name = 'Avocado Shake' AND category = 'milkshake';
    UPDATE menu_items SET base_price = 90, name = 'Mango MS' WHERE name = 'Mango Shake' AND category = 'milkshake';
    
    -- Add Taro Halo Halo to milkshake category (move from premiums if exists)
    UPDATE menu_items SET category = 'milkshake', base_price = 95 WHERE name = 'Taro Halo-Halo' AND category = 'premiums';
    -- Rename to match menu
    UPDATE menu_items SET name = 'Taro Halo Halo' WHERE name = 'Taro Halo-Halo';

    -- =====================================================
    -- 12. UPDATE CHEESECAKE PRICES (all ₱85)
    -- =====================================================
    UPDATE menu_items SET base_price = 85 WHERE category = 'cheesecake';

    -- =====================================================
    -- 13. UPDATE PREMIUMS PRICES
    -- =====================================================
    UPDATE menu_items SET base_price = 85 WHERE name = 'Meiji Apollo' AND category = 'premiums';
    UPDATE menu_items SET base_price = 100 WHERE name = 'Brown Sugar Latte' AND category = 'premiums';
    UPDATE menu_items SET base_price = 100 WHERE name = 'Milo G' AND category = 'premiums';

    -- =====================================================
    -- 14. FRUIT TEA - All at ₱70 (already correct)
    -- =====================================================
    UPDATE menu_items SET base_price = 70 WHERE category = 'fruit-tea';

    -- =====================================================
    -- 15. FRUIT SODA - All at ₱70 (already correct) 
    -- =====================================================
    UPDATE menu_items SET base_price = 70 WHERE category = 'fruit-soda';
    -- Update names to match new menu
    UPDATE menu_items SET name = 'Strawberry Soda' WHERE name = 'Strawberry Soda' AND category = 'fruit-soda';
    UPDATE menu_items SET name = 'Blueberry Soda' WHERE name = 'Blueberry Soda' AND category = 'fruit-soda';
    UPDATE menu_items SET name = 'Rootbeer' WHERE name = 'Rootbeer Float' AND category = 'fruit-soda';
    UPDATE menu_items SET name = 'Bubblegum Soda' WHERE name = 'Bubblegum Soda' AND category = 'fruit-soda';
    UPDATE menu_items SET name = 'Lychee' WHERE name = 'Lychee Soda' AND category = 'fruit-soda';
    UPDATE menu_items SET name = 'Green Apple Soda' WHERE name = 'Green Apple Soda' AND category = 'fruit-soda';
    UPDATE menu_items SET name = 'Raspberry' WHERE name = 'Raspberry Soda' AND category = 'fruit-soda';
    UPDATE menu_items SET name = 'Passion' WHERE name = 'Passion Soda' AND category = 'fruit-soda';
    UPDATE menu_items SET name = 'Kiwi' WHERE name = 'Kiwi Soda' AND category = 'fruit-soda';

    -- =====================================================
    -- 16. UPDATE YOGURT PRICES (all ₱80)
    -- =====================================================
    UPDATE menu_items SET base_price = 80 WHERE category = 'yogurt';

    -- =====================================================
    -- 17. ADD SILOG MEALS (new category)
    -- =====================================================
    INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
    ('Tapsilog', 'Tapa with sinangag and itlog', 115, v_silog_cat_id, false, true),
    ('Longsilog', 'Longganisa with sinangag and itlog', 115, v_silog_cat_id, false, true),
    ('Spamsilog', 'Spam with sinangag and itlog', 95, v_silog_cat_id, false, true),
    ('Bacsilog', 'Bacon with sinangag and itlog', 75, v_silog_cat_id, false, true);

    -- =====================================================
    -- 18. ADD COMBO MEALS (new category)
    -- =====================================================
    INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
    ('Burger with Fries', 'Burger served with crispy fries', 150, v_combo_cat_id, false, true),
    ('Burger with Chicken', 'Burger paired with chicken wings', 209, v_combo_cat_id, false, true),
    ('Spaghetti with Chicken', 'Spaghetti paired with chicken wings', 185, v_combo_cat_id, false, true);

    -- =====================================================
    -- 19. ADD RAMEN (new category)
    -- =====================================================
    INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
    ('Tantanmen', 'Spicy sesame-based ramen', 199, v_ramen_cat_id, false, true),
    ('Tonkotsu', 'Rich pork bone broth ramen', 199, v_ramen_cat_id, false, true);

    RAISE NOTICE 'Menu prices and items updated successfully!';
END $$;
