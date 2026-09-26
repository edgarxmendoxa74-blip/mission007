/*
  # Fix RLS policies for anon access

  The app uses Supabase anon key with no authentication.
  The original policies only allowed authenticated users to 
  insert/update/delete. This adds anon access to all data tables.
*/

-- Allow anon users to insert menu items
CREATE POLICY "Anon users can insert menu items"
  ON menu_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon users to update menu items
CREATE POLICY "Anon users can update menu items"
  ON menu_items
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon users to delete menu items
CREATE POLICY "Anon users can delete menu items"
  ON menu_items
  FOR DELETE
  TO anon
  USING (true);

-- Also fix variations and add_ons tables
CREATE POLICY "Anon users can manage variations"
  ON variations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage add-ons"
  ON add_ons
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);