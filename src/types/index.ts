export interface Variation {
  id: string;
  name: string;
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  image?: string;
  popular?: boolean;
  available?: boolean;
  variations?: Variation[];
  addOns?: AddOn[];
  // Discount pricing fields
  discountPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountActive?: boolean;
  // Computed effective price (calculated in the app)
  effectivePrice?: number;
  isOnDiscount?: boolean;
  flavors?: string[];
}

export interface CartItem extends MenuItem {
  menuItemId: string; // Original database UUID
  quantity: number;
  selectedVariation?: Variation;
  selectedFlavor?: string;
  selectedAddOns?: AddOn[];
  totalPrice: number;
}

export interface OrderData {
  customerName: string;
  contactNumber: string;
  serviceType: 'pickup' | 'delivery';
  address?: string;
  landmark?: string;
  pickupTime?: string;
  paymentMethod: string;
  referenceNumber?: string;
  total: number;
  notes?: string;
  items: CartItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  variation_name?: string;
  flavor_name?: string;
  add_ons: any[];
  total_item_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  contact_number: string;
  service_type: 'pickup' | 'delivery';
  address?: string;
  landmark?: string;
  pickup_time?: string;
  payment_method: string;
  reference_number?: string;
  total_price: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export type PaymentMethod = string;
export type ServiceType = 'pickup' | 'delivery';


// Site Settings Types
export interface SiteSetting {
  id: string;
  value: string;
  type: 'text' | 'image' | 'boolean' | 'number';
  description?: string;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_logo: string;
  site_description: string;
  currency: string;
  currency_code: string;
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  store_hours: string;
  contact_number: string;
  address: string;
  facebook_url: string;
  facebook_handle: string;
  site_tagline: string;
  hero_slides?: HeroSlide[];
}

export interface HeroSlide {
  url: string;
  title: string;
  subtitle: string;
  description: string;
}