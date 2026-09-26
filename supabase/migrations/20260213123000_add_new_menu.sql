-- Migration to add new menu items based on the provided menu images

DO $$
DECLARE
    -- Category IDs (TEXT because categories.id is text)
    v_burger_cat_id text := 'burger';
    v_hotdog_cat_id text := 'hotdogs';
    v_eggdrop_cat_id text := 'eggdrop';
    v_snacks_cat_id text := 'fries-nachos';
    v_pasta_cat_id text := 'pasta';
    v_milktea_cat_id text := 'milk-tea';
    v_fruittea_cat_id text := 'fruit-tea';
    v_fruitsoda_cat_id text := 'fruit-soda';
    v_milkshake_cat_id text := 'milkshake';
    v_cheesecake_cat_id text := 'cheesecake';
    v_premiums_cat_id text := 'premiums';
    v_coffee_cat_id text := 'coffee-new'; -- avoiding conflict with existing 'coffee' if any, though existing is 'hot-coffee'/'iced-coffee'
    v_yogurt_cat_id text := 'yogurt';
    
    -- Loop variables
    v_item_name text;
    v_item_id uuid;
    
    -- Arrays for loops
    v_milktea_flavors text[] := ARRAY['Avocado', 'Black Forrest', 'Blueberry', 'Cappuccino', 'Caramel', 'Caramel Macchiato', 
                            'Choco Hazelnut', 'Choco Mousse', 'Choco Nutella', 'Coffee Caramel', 'Coffee Latte', 
                            'Cookies & Cream', 'Dark Choco', 'Double Dutch', 'Hazelnut Macchiato', 'Hershey''s', 
                            'Hokkaido', 'Honey Dew', 'Java Chips', 'Mocca', 'Nutella', 'Okinawa', 'Oreo', 
                            'Pearl Milk Tea', 'Red Velvet', 'Salted Caramel', 'Taro', 'Thai', 'Tiramisu', 
                            'Ube Matcha', 'Vanilla', 'White Rabbit', 'Wintermelon', 'Wintermelon Latte'];
                            
    v_fruittea_flavors text[] := ARRAY['Strawberry', 'Blueberry', 'Lemon', 'Mango', 'Kiwi', 'Lychee', 'Green Apple', 
                            'Peach', 'Passion', 'Passion Mango', 'Peach Mango', 'Kiwi Lychee'];
                            
    v_fruitsoda_flavors text[] := ARRAY['Strawberry Soda', 'Blueberry Soda', 'Rootbeer Float', 'Bubblegum Soda', 'Lychee Soda', 
                            'Green Apple Soda', 'Raspberry Soda', 'Passion Soda', 'Kiwi Soda'];
                            
    v_milkshake_flavors text[] := ARRAY['Oreo in a Cup', 'Kitkat', 'Avocado Shake', 'Strawberry Shake', 'Mango Shake'];
    
    v_cheesecake_flavors text[] := ARRAY['Oreo Cheesecake', 'Blueberry Cheesecake', 'Strawberry Cheesecake', 'Mango Cheesecake', 'Avocado Cheesecake'];
    
    v_yogurt_flavors text[] := ARRAY['Mango Yogurt', 'Strawberry Yogurt', 'Blueberry Yogurt'];
    
BEGIN
    -- 1. Create Categories
    -- Using ON CONFLICT DO UPDATE to ensure properties are set if it exists, or DO NOTHING if we prefer. 
    -- Since we're defining new categories, we'll insert them.
    
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_burger_cat_id, 'Burger', '🍔', 10, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_hotdog_cat_id, 'Hotdogs', '🌭', 11, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_eggdrop_cat_id, 'Eggdrop', '🥪', 12, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_snacks_cat_id, 'Fries, Nachos & Onion Rings', '🍟', 13, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_pasta_cat_id, 'Pasta', '🍝', 14, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_milktea_cat_id, 'Milk Tea', '🧋', 15, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_fruittea_cat_id, 'Fruit Tea', '🍹', 16, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_fruitsoda_cat_id, 'Fruit Soda', '🥤', 17, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_milkshake_cat_id, 'Milkshake', '🥤', 18, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_cheesecake_cat_id, 'Cheesecake', '🍰', 19, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_premiums_cat_id, 'Premiums', '🌟', 20, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_coffee_cat_id, 'Coffee', '☕', 21, true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO categories (id, name, icon, sort_order, active) VALUES (v_yogurt_cat_id, 'Yogurt', '🍦', 22, true) ON CONFLICT (id) DO NOTHING;


    -- 2. Insert Menu Items
    
    -- BURGERS
    INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
    ('Classic Burger', '100% Beef Patty with fresh lettuce and tomatoes', 109, v_burger_cat_id, true, true),
    ('Cheese Burger', 'Classic burger with melted cheddar cheese', 99, v_burger_cat_id, false, true),
    ('Chicken Burger', 'Crispy chicken fillet with special sauce', 109, v_burger_cat_id, true, true),
    ('Smash Burger', 'Smashed beef patty, crispy edges, juicy center', 140, v_burger_cat_id, true, true),
    ('Hawaiian Burger', 'Beef patty topped with grilled pineapple', 150, v_burger_cat_id, false, true),
    ('Cheesy Bacon', 'Beef patty with bacon and loads of cheese', 130, v_burger_cat_id, false, true),
    ('Chili Burger', 'Spicy beef patty with chili sauce', 150, v_burger_cat_id, false, true),
    ('1 pc Burger Steak', 'Served with rice and mushroom gravy', 79, v_burger_cat_id, false, true),
    ('2 pcs Burger Steak', 'Served with rice and mushroom gravy', 149, v_burger_cat_id, false, true);

    -- HOTDOGS
    INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
    ('Chili-Dog Classic', 'Classic hotdog with chili con carne', 99, v_hotdog_cat_id, false, true),
    ('Chili-Dog Jalapeno', 'Spicy hotdog with jalapenos', 109, v_hotdog_cat_id, false, true);

    -- EGGDROP
    INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
    ('Regular Egglicious', 'Fluffy scrambled eggs in brioche toast', 100, v_eggdrop_cat_id, false, true),
    ('Spam Egglicious', 'Spam and fluffy eggs', 100, v_eggdrop_cat_id, false, true),
    ('Ham Egglicious', 'Ham and fluffy eggs', 100, v_eggdrop_cat_id, false, true),
    ('Bacon Egglicious', 'Bacon and fluffy eggs', 100, v_eggdrop_cat_id, false, true),
    ('Spam & Cheesy', 'Spam with extra cheese', 120, v_eggdrop_cat_id, false, true),
    ('Bacon & Cheesy', 'Bacon with extra cheese', 120, v_eggdrop_cat_id, false, true),
    ('Ham & Cheesy', 'Ham with extra cheese', 120, v_eggdrop_cat_id, false, true),
    ('Burger & Cheesy', 'Burger patty with extra cheese', 130, v_eggdrop_cat_id, false, true);

    -- FRIES, NACHOS & ONION RINGS
    INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
    ('Cheese Fries', 'Crispy fries with cheese powder', 50, v_snacks_cat_id, false, true),
    ('BBQ Fries', 'Crispy fries with BBQ flavor', 50, v_snacks_cat_id, false, true),
    ('Spicy BBQ Fries', 'Crispy fries with spicy BBQ flavor', 50, v_snacks_cat_id, false, true),
    ('Fries Overload', 'Fries loaded with toppings', 99, v_snacks_cat_id, true, true),
    ('Nachos', 'Crispy nachos with beef, cheese, and salsa', 85, v_snacks_cat_id, true, true),
    ('Onion Rings', 'Golden crispy onion rings', 70, v_snacks_cat_id, false, true);

    -- PASTA
    INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
    ('Creamy Carbonara', 'Creamy white sauce pasta with bacon', 89, v_pasta_cat_id, false, true),
    ('Charlie-Chan', 'Spicy oriental pasta', 89, v_pasta_cat_id, true, true),
    ('Spaghetti', 'Classic Filipino style sweet spaghetti', 89, v_pasta_cat_id, false, true);

    -- MILK TEA
    FOREACH v_item_name IN ARRAY v_milktea_flavors
    LOOP
        INSERT INTO menu_items (name, base_price, category, popular, available, description)
        VALUES (v_item_name, 70, v_milktea_cat_id, false, true, 'Premium Milk Tea')
        RETURNING id INTO v_item_id;

        INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Medium', 70), (v_item_id, 'Large', 80), (v_item_id, 'Extra Large', 120);
        
        -- Add-ons for sinkers
        INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
        (v_item_id, 'Nata', 15, 'Sinkers'),
        (v_item_id, 'Pearl', 15, 'Sinkers'),
        (v_item_id, 'Pudding', 15, 'Sinkers'),
        (v_item_id, 'Popping Boba', 15, 'Sinkers'),
        (v_item_id, 'Coffee Jelly', 15, 'Sinkers'),
        (v_item_id, 'Rainbow Jelly', 15, 'Sinkers'),
        (v_item_id, 'Cream Cheese', 15, 'Sinkers');
    END LOOP;

    -- FRUIT TEA
    FOREACH v_item_name IN ARRAY v_fruittea_flavors
    LOOP
        INSERT INTO menu_items (name, base_price, category, popular, available, description)
        VALUES (v_item_name, 70, v_fruittea_cat_id, false, true, 'Refreshing Fruit Tea')
        RETURNING id INTO v_item_id;

        INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Medium', 70), (v_item_id, 'Large', 80), (v_item_id, 'Extra Large', 120);
        
        INSERT INTO add_ons (menu_item_id, name, price, category) VALUES
        (v_item_id, 'Nata', 15, 'Sinkers'),
        (v_item_id, 'Pearl', 15, 'Sinkers'),
        (v_item_id, 'Popping Boba', 15, 'Sinkers');
    END LOOP;

    -- FRUIT SODA
    FOREACH v_item_name IN ARRAY v_fruitsoda_flavors
    LOOP
        INSERT INTO menu_items (name, base_price, category, popular, available, description)
        VALUES (v_item_name, 70, v_fruitsoda_cat_id, false, true, 'Sparkling Fruit Soda')
        RETURNING id INTO v_item_id;

        INSERT INTO variations (menu_item_id, name, price) VALUES
        (v_item_id, 'Medium', 70), (v_item_id, 'Large', 80), (v_item_id, 'Extra Large', 120);
    END LOOP;

    -- MILKSHAKE
    FOREACH v_item_name IN ARRAY v_milkshake_flavors
    LOOP
        INSERT INTO menu_items (name, base_price, category, popular, available, description)
        VALUES (v_item_name, 90, v_milkshake_cat_id, false, true, 'Creamy Milkshake')
        RETURNING id INTO v_item_id;

        INSERT INTO variations (menu_item_id, name, price) VALUES (v_item_id, 'Large', 90);
    END LOOP;

    -- CHEESECAKE
    FOREACH v_item_name IN ARRAY v_cheesecake_flavors
    LOOP
        INSERT INTO menu_items (name, base_price, category, popular, available, description)
        VALUES (v_item_name, 85, v_cheesecake_cat_id, false, true, 'Rich Cheesecake Series')
        RETURNING id INTO v_item_id;

        INSERT INTO variations (menu_item_id, name, price) VALUES (v_item_id, 'Medium', 85), (v_item_id, 'Large', 95);
    END LOOP;

    -- PREMIUMS
    INSERT INTO menu_items (name, base_price, category, popular, available, description) VALUES ('Meiji Apollo', 85, v_premiums_cat_id, false, true, 'Premium Drink') RETURNING id INTO v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES (v_item_id, 'Medium', 85), (v_item_id, 'Large', 95);

    INSERT INTO menu_items (name, base_price, category, popular, available, description) VALUES ('Milo G', 100, v_premiums_cat_id, false, true, 'Premium Drink') RETURNING id INTO v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES (v_item_id, 'Medium', 100), (v_item_id, 'Large', 110);

    INSERT INTO menu_items (name, base_price, category, popular, available, description) VALUES ('Brown Sugar Latte', 100, v_premiums_cat_id, false, true, 'Premium Drink') RETURNING id INTO v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES (v_item_id, 'Large', 100);

    INSERT INTO menu_items (name, base_price, category, popular, available, description) VALUES ('Taro Halo-Halo', 95, v_premiums_cat_id, false, true, 'Premium Drink') RETURNING id INTO v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES (v_item_id, 'Large', 95);

    -- COFFEE
     INSERT INTO menu_items (name, base_price, category, popular, available, description) 
     VALUES ('Caramel Macchiato Coffee', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee'),
            ('Thai Coffee', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee'),
            ('Hazelnut Latte', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee'),
            ('Matcha Coffee Latte', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee'),
            ('Baileys', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee'),
            ('Hazelnut Macchiato Coffee', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee'),
            ('Choco Coffee', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee'),
            ('Caramel Sea Salt Latte', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee'),
            ('Butterscotch', 80, v_coffee_cat_id, false, true, 'Hot/Cold Coffee');

    INSERT INTO menu_items (name, base_price, category, popular, available, description) VALUES ('Cafe Americano', 50, v_coffee_cat_id, false, true, 'Hot/Cold Coffee') RETURNING id INTO v_item_id;
    INSERT INTO variations (menu_item_id, name, price) VALUES (v_item_id, 'Small', 50), (v_item_id, 'Large', 70);

    -- YOGURT
    FOREACH v_item_name IN ARRAY v_yogurt_flavors
    LOOP
        INSERT INTO menu_items (name, base_price, category, popular, available, description)
        VALUES (v_item_name, 80, v_yogurt_cat_id, false, true, 'Fresh Yogurt Drink')
        RETURNING id INTO v_item_id;

        INSERT INTO variations (menu_item_id, name, price) VALUES (v_item_id, 'Medium', 80), (v_item_id, 'Large', 90);
    END LOOP;

END $$;
