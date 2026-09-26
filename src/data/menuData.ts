import { MenuItem } from '../types';

export const menuData: MenuItem[] = [
  // Milk Tea
  {
    id: 'classic-pearl-milk-tea',
    name: 'Classic Pearl Milk Tea',
    description: 'Our signature black milk tea with chewy tapioca pearls',
    basePrice: 70,
    category: 'milk-tea',
    popular: true,
    image: 'https://images.pexels.com/photos/5946623/pexels-photo-5946623.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'wintermelon-milk-tea',
    name: 'Wintermelon Milk Tea',
    description: 'Freshly brewed wintermelon tea with a creamy finish',
    basePrice: 70,
    category: 'milk-tea',
    popular: true,
    image: 'https://images.pexels.com/photos/5946623/pexels-photo-5946623.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'okinawa-milk-tea',
    name: 'Okinawa Milk Tea',
    description: 'Roasted brown sugar milk tea with a rich, unique flavor',
    basePrice: 70,
    category: 'milk-tea',
    popular: true,
    image: 'https://images.pexels.com/photos/5946623/pexels-photo-5946623.jpeg?auto=compress&cs=tinysrgb&w=800'
  },

  // Fruit Tea
  {
    id: 'passion-fruit-tea',
    name: 'Passion Fruit Tea',
    description: 'Tangy and refreshing passion fruit green tea',
    basePrice: 70,
    category: 'fruit-tea',
    image: 'https://images.pexels.com/photos/5946623/pexels-photo-5946623.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'lychee-green-tea',
    name: 'Lychee Green Tea',
    description: 'Sweet lychee fruit mixed with premium jasmine green tea',
    basePrice: 70,
    category: 'fruit-tea',
    image: 'https://images.pexels.com/photos/5946623/pexels-photo-5946623.jpeg?auto=compress&cs=tinysrgb&w=800'
  },

  // Coffee
  {
    id: 'iced-americano',
    name: 'Iced Americano',
    description: 'Rich espresso shots topped with water and served over ice',
    basePrice: 50,
    category: 'coffee-new',
    popular: true,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 'caramel-macchiato',
    name: 'Caramel Macchiato',
    description: 'Freshly steamed milk with vanilla-flavored syrup marked with espresso and topped with caramel drizzle',
    basePrice: 80,
    category: 'coffee-new',
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800'
  },

  // Snacks
  {
    id: 'nachos-overload',
    name: 'Nachos Overload',
    description: 'Crispy nachos with beef, cheese sauce, and fresh vegetables',
    basePrice: 85,
    category: 'fries-nachos',
    popular: true,
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

export const categories = [
  { id: 'milk-tea', name: 'Milk Tea', icon: '🧋' },
  { id: 'fruit-tea', name: 'Fruit Tea', icon: '🍹' },
  { id: 'coffee-new', name: 'Coffee', icon: '☕' },
  { id: 'fries-nachos', name: 'Snacks', icon: '🍿' },
  { id: 'burger', name: 'Burger', icon: '🍔' },
  { id: 'silog-meals', name: 'Silog Meals', icon: '🍳' },
  { id: 'ramen', name: 'Ramen', icon: '🍜' },
  { id: 'pasta', name: 'Pasta', icon: '🍝' },
  { id: 'hotdogs', name: 'Hotdogs', icon: '🌭' },
  { id: 'eggdrop', name: 'Eggdrop', icon: '🥪' },
  { id: 'fruit-soda', name: 'Fruit Soda', icon: '🥤' },
  { id: 'milkshake', name: 'Milkshake', icon: '🥤' },
  { id: 'cheesecake', name: 'Cheesecake', icon: '🍰' },
  { id: 'premiums', name: 'Premiums', icon: '🌟' },
  { id: 'yogurt', name: 'Yogurt', icon: '🍦' },
  { id: 'combo-meals', name: 'Combo Meals', icon: '🍔🍗🍟' },
  { id: 'extras', name: 'Extras', icon: '🍚' }
];

export const addOnCategories = [
  { id: 'sinkers', name: 'Sinkers' },
  { id: 'sugar-level', name: 'Sugar Level' },
  { id: 'ice-level', name: 'Ice Level' },
  { id: 'extras', name: 'Extras' }
];