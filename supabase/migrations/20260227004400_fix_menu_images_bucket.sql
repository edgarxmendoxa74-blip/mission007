/*
  # Fix menu-images storage bucket
  
  The bucket either doesn't exist or has policies that only allow
  authenticated users. Since this app uses the anon key with no 
  user authentication, we need to allow anon access.

  1. Create the bucket if it doesn't exist
  2. Drop old restrictive policies (authenticated-only)
  3. Create new policies allowing public/anon access
*/

-- Create the storage bucket (skip if already exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop old policies if they exist (they required authenticated role)
DROP POLICY IF EXISTS "Public read access for menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

-- Allow everyone to read menu images
CREATE POLICY "Public read access for menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Allow anyone (anon) to upload menu images
CREATE POLICY "Anyone can upload menu images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow anyone (anon) to update menu images
CREATE POLICY "Anyone can update menu images"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'menu-images');

-- Allow anyone (anon) to delete menu images
CREATE POLICY "Anyone can delete menu images"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'menu-images');
