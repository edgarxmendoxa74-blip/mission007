/*
  # Fix Order Placement RLS
  
  Anonymous users currently have INSERT permission but no SELECT permission.
  Supabase's `.insert().select()` requires SELECT permission on the inserted row
  to return the data (including the generated ID). 
  
  Since order items require the order_id, the entire process fails if 
  the created order cannot be returned.
*/

-- Allow anon users to select their own orders (we allow all for simplicity in this anon setup)
CREATE POLICY "Anyone can select orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

-- Allow anon users to select order items
CREATE POLICY "Anyone can select order items"
  ON order_items
  FOR SELECT
  TO public
  USING (true);
