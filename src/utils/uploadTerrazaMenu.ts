import { supabase } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

// Menu structure based on folder organization
const menuCategories = {
  'breakfast': {
    name: 'Breakfast',
    icon: '🍳',
    items: [
      { name: 'Beef Tapa', price: 149, description: 'Tender marinated beef with garlic rice and fried egg' },
      { name: 'Pork Tocino', price: 139, description: 'Sweet cured pork with garlic rice and fried egg' },
      { name: 'Chorizo Pudpud', price: 139, description: 'Spicy Filipino chorizo with garlic rice and fried egg' },
      { name: 'Hungarian Sausage', price: 129, description: 'Savory Hungarian sausage with garlic rice and fried egg' }
    ]
  },
  'mains': {
    name: 'Mains',
    icon: '🍛',
    items: [
      { name: 'Beef Bibimbap', price: 189, description: 'Korean rice bowl with beef, vegetables, and egg' },
      { name: 'Beef Shawarma Rice', price: 169, description: 'Flavorful beef shawarma over rice with vegetables' },
      { name: 'Chicken Adobo Flakes', price: 159, description: 'Crispy chicken adobo flakes with rice and vegetables' },
      { name: 'Chicken Cordon Bleu', price: 179, description: 'Breaded chicken stuffed with ham and cheese' },
      { name: 'Chicken Pesto', price: 169, description: 'Grilled chicken with creamy pesto sauce' },
      { name: 'Fried Chicken', price: 149, description: 'Crispy fried chicken with rice' },
      { name: 'Grilled Pork Belly', price: 169, description: 'Juicy grilled pork belly with rice' },
      { name: 'Kimchi Fried Rice', price: 159, description: 'Spicy kimchi fried rice with vegetables and egg' },
      { name: 'Pork Katsu', price: 169, description: 'Crispy breaded pork cutlet with tonkatsu sauce' },
      { name: 'Pork Pepper Rice', price: 159, description: 'Savory pepper pork with rice' },
      { name: 'Pork Sisig w/ Egg', price: 159, description: 'Sizzling pork sisig topped with egg' }
    ]
  },
  'snacks': {
    name: 'Snacks',
    icon: '🍟',
    items: [
      { name: 'Beef Nacho Fries', price: 149, description: 'Crispy fries topped with seasoned beef and cheese' },
      { name: 'House Cheese Burger w/ Fries', price: 169, description: 'Juicy beef burger with cheese and fries' },
      { name: 'Shawarma Wrap w/ Fries', price: 159, description: 'Beef shawarma wrap served with fries' }
    ]
  },
  'ala carte snacks': {
    name: 'Ala Carte Snacks',
    icon: '🥙',
    items: [
      { name: 'French Fries', price: 79, description: 'Crispy golden french fries' },
      { name: 'House Cheese Burger', price: 129, description: 'Classic beef burger with cheese' },
      { name: 'Shawarma Wrap', price: 119, description: 'Beef shawarma wrap' }
    ]
  },
  'pasta': {
    name: 'Pasta',
    icon: '🍝',
    items: [
      { name: 'Mac & Cheese', price: 149, description: 'Creamy macaroni and cheese' },
      { name: 'Pasta Alfredo', price: 159, description: 'Creamy Alfredo pasta' },
      { name: 'Pesto Pasta', price: 159, description: 'Pasta with fresh basil pesto sauce' }
    ]
  },
  'munchies': {
    name: 'Munchies',
    icon: '🍢',
    items: [
      { name: 'Hungarian Sausage', price: 99, description: 'Grilled Hungarian sausage' },
      { name: 'Lumpia Shanghai', price: 119, description: 'Filipino spring rolls with sweet chili sauce' },
      { name: 'Sizzling Pork Sisig', price: 179, description: 'Sizzling plate of chopped pork sisig' }
    ]
  },
  'crafted drinks': {
    name: 'Crafted Drinks',
    icon: '☕',
    items: [
      { name: 'Blueberry Cloud', price: 99, description: 'Refreshing blueberry cream drink' },
      { name: 'Blueberry Lemon Boba', price: 109, description: 'Blueberry lemon tea with boba pearls' },
      { name: 'Brewed Coffee', price: 69, description: 'Fresh brewed coffee' },
      { name: 'Iced Choco', price: 89, description: 'Rich iced chocolate drink' },
      { name: 'Iced Coffee', price: 79, description: 'Smooth iced coffee' },
      { name: 'Lychee Lemon Boba', price: 109, description: 'Lychee lemon tea with boba pearls' },
      { name: 'Matcha Cloud', price: 109, description: 'Creamy matcha cloud drink' },
      { name: 'Strawberry Cloud', price: 99, description: 'Sweet strawberry cream drink' }
    ]
  },
  'extras': {
    name: 'Extras',
    icon: '🍚',
    items: [
      { name: 'Fried Egg', price: 25, description: 'Sunny side up fried egg' },
      { name: 'Garlic Rice', price: 35, description: 'Fragrant garlic fried rice' },
      { name: 'Java Rice', price: 35, description: 'Turmeric-flavored rice' },
      { name: 'Kimchi', price: 45, description: 'Traditional Korean fermented vegetables' },
      { name: 'Plain Rice', price: 25, description: 'Steamed white rice' }
    ]
  }
};

// Function to convert filename to proper item name
function getImageItemName(filename: string): string {
  // Remove file extension and number suffix
  return filename
    .replace(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i, '')
    .replace(/ \d+$/, '')
    .trim();
}

// Function to find the main image (image 1) for an item
function findImagePath(menuPath: string, category: string, itemName: string): string | null {
  const categoryPath = path.join(menuPath, category);
  
  if (!fs.existsSync(categoryPath)) {
    return null;
  }

  const files = fs.readdirSync(categoryPath);
  const normalizedItemName = itemName.toLowerCase();
  
  // Look for image with " 1." in the filename (primary image)
  const imageFile = files.find(file => {
    const fileItemName = getImageItemName(file).toLowerCase();
    return fileItemName === normalizedItemName && file.includes(' 1.');
  });

  if (imageFile) {
    return path.join(categoryPath, imageFile);
  }

  // Fallback: find any image matching the item name
  const fallbackFile = files.find(file => {
    const fileItemName = getImageItemName(file).toLowerCase();
    return fileItemName === normalizedItemName;
  });

  return fallbackFile ? path.join(categoryPath, fallbackFile) : null;
}

async function uploadImageToSupabase(imagePath: string, itemName: string, category: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(imagePath);
    const fileExt = path.extname(imagePath).toLowerCase();
    const fileName = `terraza-menu/${category}/${itemName.toLowerCase().replace(/\s+/g, '-')}${fileExt}`;

    // Map file extension to correct MIME type
    const mimeTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const contentType = mimeTypeMap[fileExt] || 'image/jpeg';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('menu-images')
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${itemName}:`, error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error(`Error processing ${itemName}:`, error);
    return null;
  }
}

export async function uploadTerrazaMenu(menuPath: string) {
  try {
    console.log('🔄 Starting Terraza Navarro menu upload...\n');

    // Step 1: Create/Update categories
    console.log('📁 Creating categories...');
    const categoryMap: Record<string, string> = {};

    for (const [categoryKey, categoryData] of Object.entries(menuCategories)) {
      const categoryId = `cat_${categoryKey.replace(/\s+/g, '_')}`;
      
      const { error } = await supabase
        .from('categories')
        .upsert({
          id: categoryId,
          name: categoryData.name,
          icon: categoryData.icon,
          active: true,
          sort_order: Object.keys(menuCategories).indexOf(categoryKey)
        });

      if (error && !error.message.includes('duplicate')) {
        console.error(`❌ Error creating category ${categoryData.name}:`, error);
      } else {
        console.log(`✅ Category: ${categoryData.name}`);
        categoryMap[categoryKey] = categoryId;
      }
    }

    console.log('\n📸 Uploading menu items with images...\n');

    // Step 2: Upload items with images
    for (const [categoryKey, categoryData] of Object.entries(menuCategories)) {
      console.log(`\n📂 Processing ${categoryData.name}...`);
      const categoryId = categoryMap[categoryKey];

      for (const item of categoryData.items) {
        try {
          // Find the image file
          const imagePath = findImagePath(menuPath, categoryKey, item.name);
          
          let imageUrl = null;
          if (imagePath && fs.existsSync(imagePath)) {
            console.log(`  📸 Uploading image for ${item.name}...`);
            imageUrl = await uploadImageToSupabase(imagePath, item.name, categoryKey);
          } else {
            console.log(`  ⚠️  No image found for ${item.name}`);
          }

          // Insert menu item
          const { error } = await supabase
            .from('menu_items')
            .insert({
              name: item.name,
              description: item.description,
              base_price: item.price,
              category: categoryId,
              image_url: imageUrl,
              available: true,
              popular: false
            });

          if (error) {
            console.error(`  ❌ Error adding ${item.name}:`, error.message);
          } else {
            console.log(`  ✅ Added: ${item.name} - ₱${item.price}`);
          }
        } catch (itemError) {
          console.error(`  ❌ Error processing ${item.name}:`, itemError);
        }
      }
    }

    console.log('\n✅ Menu upload completed!\n');
    return { success: true, message: 'Terraza Navarro menu uploaded successfully!' };
  } catch (error) {
    console.error('❌ Failed to upload menu:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

