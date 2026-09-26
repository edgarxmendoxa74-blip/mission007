import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SMART_MENU } from '../data/smartMenu';
import { MenuItem } from '../types';

// The storefront menu is defined in smartMenu.ts, but images are uploaded
// through Menu Management into menu_items.image_url. Rows are matched to the
// static items by (name, category), the same key the seed migration upserts on.
const matchKey = (name: string, category: string) =>
  `${category}::${name.trim().toLowerCase()}`;

export const useStorefrontMenu = (): MenuItem[] => {
  const [images, setImages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('name, category, image_url')
        .not('image_url', 'is', null);
      if (error) {
        console.error('Error fetching menu images:', error);
        return;
      }
      setImages(new Map(
        (data || [])
          .filter(row => row.image_url)
          .map(row => [matchKey(row.name, row.category), row.image_url as string])
      ));
    };

    fetchImages();
  }, []);

  return useMemo(
    () => SMART_MENU.map(item => {
      const image = images.get(matchKey(item.name, item.category));
      return image ? { ...item, image } : item;
    }),
    [images]
  );
};
