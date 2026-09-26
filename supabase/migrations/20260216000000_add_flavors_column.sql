
-- Add flavors column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS flavors text[] DEFAULT ARRAY[]::text[];

-- Update existing items to have empty array instead of null if needed (though default handles new rows)
UPDATE menu_items SET flavors = ARRAY[]::text[] WHERE flavors IS NULL;
