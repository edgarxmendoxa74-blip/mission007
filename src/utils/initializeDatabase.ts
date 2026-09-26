import { supabase } from '../lib/supabase';
import { menuData, categories } from '../data/menuData';

export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database with sample data...');

    // Check if database already has items
    const { data: existingItems, error: checkError } = await supabase
      .from('menu_items')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking database:', checkError);
      throw checkError;
    }

    if (existingItems && existingItems.length > 0) {
      console.log('✅ Database already has items. Skipping initialization.');
      return { success: true, message: 'Database already initialized' };
    }

    // Initialize categories first
    console.log('📁 Adding categories...');
    for (const category of categories) {
      const { error: categoryError } = await supabase
        .from('categories')
        .insert({
          id: category.id,
          name: category.name,
          icon: category.icon,
          sort_order: categories.indexOf(category),
          active: true
        });

      if (categoryError) {
        // Category might already exist, that's okay
        console.log(`⚠️ Category ${category.name} might already exist`);
      }
    }

    // Insert all menu items
    for (const item of menuData) {
      console.log(`📝 Adding: ${item.name}`);
      
      const { data: menuItem, error: itemError } = await supabase
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description,
          base_price: item.basePrice,
          category: item.category,
          popular: item.popular || false,
          available: item.available ?? true,
          image_url: item.image || null
        })
        .select()
        .single();

      if (itemError) {
        console.error(`❌ Error adding ${item.name}:`, itemError);
        continue;
      }

      // Add variations if any
      if (item.variations && item.variations.length > 0 && menuItem) {
        const { error: variationsError } = await supabase
          .from('variations')
          .insert(
            item.variations.map(v => ({
              menu_item_id: menuItem.id,
              name: v.name,
              price: v.price
            }))
          );

        if (variationsError) {
          console.error(`❌ Error adding variations for ${item.name}:`, variationsError);
        }
      }

      // Add add-ons if any
      if (item.addOns && item.addOns.length > 0 && menuItem) {
        const { error: addOnsError } = await supabase
          .from('add_ons')
          .insert(
            item.addOns.map(a => ({
              menu_item_id: menuItem.id,
              name: a.name,
              price: a.price,
              category: a.category
            }))
          );

        if (addOnsError) {
          console.error(`❌ Error adding add-ons for ${item.name}:`, addOnsError);
        }
      }
    }

    console.log('✅ Database initialized successfully!');
    console.log(`📊 Added ${menuData.length} menu items`);
    
    return { 
      success: true, 
      message: `Successfully added ${menuData.length} items to the database` 
    };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

