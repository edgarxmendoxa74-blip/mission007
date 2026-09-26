import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// supabase-js decides when to refresh the login token using the device clock.
// On a device whose clock or time zone is wrong it keeps sending an expired
// token, and every request (even public menu reads) fails with 401 PGRST303.
// When that happens, refresh the session once and retry; if the refresh fails,
// drop the stale local session so public data still loads.
let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = () => {
  refreshing ??= supabase.auth.refreshSession()
    .then(async ({ data, error }) => {
      if (error || !data.session) {
        await supabase.auth.signOut({ scope: 'local' });
        return null;
      }
      return data.session.access_token;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

const isExpiredJwt = async (response: Response) => {
  if (response.status !== 401) return false;
  try {
    const body = await response.clone().json();
    return body?.code === 'PGRST303' || /jwt expired|"exp" claim/i.test(body?.message ?? '');
  } catch {
    return false;
  }
};

const fetchWithTokenRetry: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  // Only data/storage calls; auth calls handle their own errors (and refresh goes through them)
  if (!/\/(rest|storage)\/v1\//.test(url) || !(await isExpiredJwt(response))) return response;

  const token = await refreshAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTokenRetry }
});

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          icon: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string;
          base_price: number;
          category: string;
          popular: boolean;
          available: boolean;
          image_url: string | null;
          discount_price: number | null;
          discount_start_date: string | null;
          discount_end_date: string | null;
          discount_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          base_price: number;
          category: string;
          popular?: boolean;
          available?: boolean;
          image_url?: string | null;
          discount_price?: number | null;
          discount_start_date?: string | null;
          discount_end_date?: string | null;
          discount_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          base_price?: number;
          category?: string;
          popular?: boolean;
          available?: boolean;
          image_url?: string | null;
          discount_price?: number | null;
          discount_start_date?: string | null;
          discount_end_date?: string | null;
          discount_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      variations: {
        Row: {
          id: string;
          menu_item_id: string;
          name: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          name: string;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          name?: string;
          price?: number;
          created_at?: string;
        };
      };
      add_ons: {
        Row: {
          id: string;
          menu_item_id: string;
          name: string;
          price: number;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          name: string;
          price: number;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          name?: string;
          price?: number;
          category?: string;
          created_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          account_number: string;
          account_name: string;
          qr_code_url: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          account_number: string;
          account_name: string;
          qr_code_url: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          account_number?: string;
          account_name?: string;
          qr_code_url?: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          value: string;
          type: string;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          value: string;
          type?: string;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          type?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_name: string;
          contact_number: string;
          service_type: 'dine-in' | 'pickup' | 'delivery';
          table_number: string | null;
          address: string | null;
          landmark: string | null;
          pickup_time: string | null;
          payment_method: string;
          reference_number: string | null;
          total_price: number;
          notes: string | null;
          status: 'pending' | 'preparing' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          contact_number: string;
          service_type: 'dine-in' | 'pickup' | 'delivery';
          table_number?: string | null;
          address?: string | null;
          landmark?: string | null;
          pickup_time?: string | null;
          payment_method: string;
          reference_number?: string | null;
          total_price: number;
          notes?: string | null;
          status?: 'pending' | 'preparing' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          contact_number?: string;
          service_type?: 'dine-in' | 'pickup' | 'delivery';
          table_number?: string | null;
          address?: string | null;
          landmark?: string | null;
          pickup_time?: string | null;
          payment_method?: string;
          reference_number?: string | null;
          total_price?: number;
          notes?: string | null;
          status?: 'pending' | 'preparing' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          name: string;
          quantity: number;
          unit_price: number;
          variation_name: string | null;
          flavor_name: string | null;
          add_ons: any;
          total_item_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          name: string;
          quantity: number;
          unit_price: number;
          variation_name?: string | null;
          flavor_name?: string | null;
          add_ons?: any;
          total_item_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          name?: string;
          quantity?: number;
          unit_price?: number;
          variation_name?: string | null;
          flavor_name?: string | null;
          add_ons?: any;
          total_item_price?: number;
          created_at?: string;
        };
      };
    };
  };
};
