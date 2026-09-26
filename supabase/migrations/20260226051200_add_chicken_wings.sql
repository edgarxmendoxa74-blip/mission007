-- Migration to add Chicken Wings menu item with variations and flavors
-- The 12pcs variation supports choosing 2 flavors (handled in frontend MenuItemCard)

DO $$
DECLARE
    v_wings_cat_id text := 'chicken-wings';
    v_item_id uuid;
BEGIN
    -- 1. Create the Chicken Wings category
    INSERT INTO categories (id, name, icon, sort_order, active)
    VALUES (v_wings_cat_id, 'Chicken Wings', '🍗', 9, true)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert the Chicken Wings menu item with flavors
    INSERT INTO menu_items (name, description, base_price, category, popular, available, flavors)
    VALUES (
        'Chicken Wings',
        'Crispy fried chicken wings with your choice of flavor',
        149,
        v_wings_cat_id,
        true,
        true,
        ARRAY['Plain', 'BBQ', 'Hot & Spicy', 'Garlic Parmesan', 'Honey Butter', 'Buffalo', 'Sweet Chili', 'Soy Garlic']
    )
    RETURNING id INTO v_item_id;

    -- 3. Insert variations (6pcs and 12pcs)
    -- The 12pcs variation triggers the 2-flavor picker in the frontend
    INSERT INTO variations (menu_item_id, name, price) VALUES
    (v_item_id, '6 pcs', 149),
    (v_item_id, '12 pcs', 279);

END $$;
