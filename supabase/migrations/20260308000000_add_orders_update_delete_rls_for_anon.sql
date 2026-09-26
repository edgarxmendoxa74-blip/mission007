/*
  # Add UPDATE and DELETE policies for public/anon access to orders
  
  Since the admin dashboard uses the anon key, we need to allow 
  public/anon users to update and delete orders and order items.
*/

-- Allow anon users to update orders (for status changes)
CREATE POLICY "Anyone can update orders"
  ON orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow anon users to delete orders
CREATE POLICY "Anyone can delete orders"
  ON orders
  FOR DELETE
  TO public
  USING (true);

-- Allow anon users to update order items
CREATE POLICY "Anyone can update order items"
  ON order_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow anon users to delete order items
CREATE POLICY "Anyone can delete order items"
  ON order_items
  FOR DELETE
  TO public
  USING (true);
