import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SiteSettings } from '../types';
import { BRAND } from '../brand';

export const useSiteSettings = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('id');

      if (error) throw error;

      // Transform the data into a more usable format
      const settings: SiteSettings = {
        site_name: data.find(s => s.id === 'site_name')?.value || BRAND.name,
        site_logo: data.find(s => s.id === 'site_logo')?.value || BRAND.logo,
        site_description: data.find(s => s.id === 'site_description')?.value || BRAND.description,
        currency: data.find(s => s.id === 'currency')?.value || '₱',
        currency_code: data.find(s => s.id === 'currency_code')?.value || 'PHP',
        hero_image: data.find(s => s.id === 'hero_image')?.value || BRAND.heroImage,
        hero_title: data.find(s => s.id === 'hero_title')?.value || BRAND.shortName,
        hero_subtitle: data.find(s => s.id === 'hero_subtitle')?.value || BRAND.numeral,
        hero_description: data.find(s => s.id === 'hero_description')?.value || BRAND.description,
        store_hours: data.find(s => s.id === 'store_hours')?.value || '06:00 AM - 10:00 PM',
        contact_number: data.find(s => s.id === 'contact_number')?.value || '0945 210 6254',
        address: data.find(s => s.id === 'address')?.value || 'Purok 3 Barangay Trenchera, Tayug Pangasinan',
        facebook_url: data.find(s => s.id === 'facebook_url')?.value || '#',
        facebook_handle: data.find(s => s.id === 'facebook_handle')?.value || '@mission007',
        messenger_page_id: data.find(s => s.id === 'messenger_page_id')?.value || '',
        site_tagline: data.find(s => s.id === 'site_tagline')?.value || BRAND.tagline,
        hero_slides: (() => {
          try {
            const val = data.find(s => s.id === 'hero_slides')?.value;
            return val ? JSON.parse(val) : undefined;
          } catch (e) {
            return undefined;
          }
        })()
      };

      setSiteSettings(settings);
    } catch (err) {
      console.error('Error fetching site settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch site settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSiteSetting = async (id: string, value: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('id', id);

      if (error) throw error;

      // Refresh the settings
      await fetchSiteSettings();
    } catch (err) {
      console.error('Error updating site setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to update site setting');
      throw err;
    }
  };

  const updateSiteSettings = async (updates: Partial<SiteSettings>) => {
    try {
      setError(null);

      const updatePromises = Object.entries(updates).map(([key, value]) => {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return supabase
          .from('site_settings')
          .upsert({ id: key, value: stringValue, updated_at: new Date().toISOString() });
      });

      const results = await Promise.all(updatePromises);

      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Some updates failed');
      }

      // Refresh the settings
      await fetchSiteSettings();
    } catch (err) {
      console.error('Error updating site settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update site settings');
      throw err;
    }
  };

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  return {
    siteSettings,
    loading,
    error,
    updateSiteSetting,
    updateSiteSettings,
    refetch: fetchSiteSettings
  };
};
