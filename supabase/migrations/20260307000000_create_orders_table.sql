/*
  # Create Orders and Order Items Tables

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text, not null)
      - `contact_number` (text, not null)
      - `service_type` (text, not null) - 'pickup' or 'delivery'
      - `address` (text, optional)
      - `landmark` (text, optional)
      - `pickup_time` (text, optional)
      - `payment_method` (text, not null)
      - `reference_number` (text, optional)
      - `total_price` (decimal, not null)
      - `notes` (text, optional)
      - `status` (text, not null, default 'pending') - 'pending', 'preparing', 'completed', 'cancelled'
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key, not null)
      - `menu_item_id` (uuid, foreign key, not null)
      - `name` (text, not null)
      - `quantity` (integer, not null)
      - `unit_price` (decimal, not null)
      - `variation_name` (text, optional)
      - `flavor_name` (text, optional)
      - `add_ons` (jsonb, optional) - Array of selected add-ons
      - `total_item_price` (decimal, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Public can insert orders and order items (to allow placement)
      - Authenticated admins can read and update all orders and items
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('pickup', 'delivery')),
  address text,
  landmark text,
  pickup_time text,
  payment_method text NOT NULL,
  reference_number text,
  total_price decimal(10,2) NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  variation_name text,
  flavor_name text,
  add_ons jsonb DEFAULT '[]'::jsonb,
  total_item_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for order_items
CREATE POLICY "Anyone can create order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
