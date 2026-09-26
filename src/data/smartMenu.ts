import { MenuItem, AddOn, DrinkUpgrade, SmartCategory, SmartVariation, Variation } from '../types';

export const SMART_CATEGORIES: SmartCategory[] = [
  { id: 'mission-meals', name: 'Mission Meals', icon: '🍽️' },
  { id: 'social-dining', name: 'Social Dining', icon: '🍟' },
  { id: 'coffee-intelligence', name: 'Coffee Intelligence', icon: '☕' },
  { id: 'cold-operations', name: 'Cold Operations – Signature Mocktails', icon: '🥤' },
  { id: 'sweet-endings', name: 'Sweet Endings', icon: '🍰' }
];

const MISSION_MEAL_ADDONS: AddOn[] = [
  { id: 'addon-regular-chips', name: 'Regular Chips', price: 45, category: 'Sides' },
  { id: 'addon-medium-chips', name: 'Medium Chips', price: 65, category: 'Sides' },
  { id: 'addon-large-chips', name: 'Large Chips', price: 85, category: 'Sides' },
  { id: 'addon-tartar', name: 'Extra Tartar Sauce', price: 25, category: 'Sauces' },
  { id: 'addon-spicy-mayo', name: 'Extra Spicy Mayo', price: 25, category: 'Sauces' },
  { id: 'addon-plain-rice', name: 'Plain Rice', price: 35, category: 'Sides' }
];

const MISSION_MEAL_DRINK_UPGRADES: DrinkUpgrade[] = [
  { id: 'dup-bp-hot', name: 'Black Protocol Hot', price: 95, tier: 'basic', refProductId: 'coffee-black-protocol' },
  { id: 'dup-bp-iced', name: 'Black Protocol Iced', price: 90, tier: 'basic', refProductId: 'coffee-black-protocol' },
  { id: 'dup-al-hot', name: 'Agent Latte Hot', price: 145, tier: 'basic', refProductId: 'coffee-agent-latte' },
  { id: 'dup-al-iced', name: 'Agent Latte Iced', price: 95, tier: 'basic', refProductId: 'coffee-agent-latte' },
  { id: 'dup-green-signal', name: 'Green Signal', price: 110, tier: 'basic', refProductId: 'cold-green-signal' },
  { id: 'dup-pineapple-chill', name: 'Pineapple Chill', price: 115, tier: 'basic', refProductId: 'cold-pineapple-chill' }
];

const missionMealVariations = (baseBasic: number, baseClassic: number, baseLoaded: number): SmartVariation[] => [
  { id: 'var-basic', name: 'Basic', price: baseBasic, tier: 'basic' },
  { id: 'var-classic', name: 'Classic', price: baseClassic, tier: 'classic' },
  { id: 'var-loaded', name: 'Loaded', price: baseLoaded, tier: 'loaded' }
];

export const SMART_MENU: MenuItem[] = [
  // =========================================
  // 1. MISSION MEALS
  // =========================================
  {
    id: 'meal-green-status',
    name: 'Green Status',
    description: 'Garden fresh greens & grilled protein protocol',
    basePrice: 125,
    category: 'mission-meals',
    orderingMode: 'mission-meal',
    mealOrderTypes: ['ala-carte', 'mission-set'],
    serviceTypePrompt: true,
    variations: [
      { id: 'var-basic', name: 'Basic', price: 125, tier: 'basic' },
      { id: 'var-classic', name: 'Classic', price: 140, tier: 'classic' },
      { id: 'var-loaded', name: 'Loaded', price: 215, tier: 'loaded' }
    ],
    drinkUpgrades: [
      { id: 'gs-basic-bp-hot', name: 'Black Protocol (Hot)', price: 95, tier: 'basic', refProductId: 'coffee-black-protocol' },
      { id: 'gs-basic-bp-iced', name: 'Black Protocol (Iced)', price: 90, tier: 'basic', refProductId: 'coffee-black-protocol' },
      { id: 'gs-basic-al-hot', name: 'Agent Latte (Hot)', price: 145, tier: 'basic', refProductId: 'coffee-agent-latte' },
      { id: 'gs-basic-al-iced', name: 'Agent Latte (Iced)', price: 95, tier: 'basic', refProductId: 'coffee-agent-latte' },
      { id: 'gs-basic-golden-file', name: 'Golden File', price: 150, tier: 'basic', refProductId: 'cold-golden-file' },
      { id: 'gs-basic-mango-boost', name: 'Mango Boost', price: 170, tier: 'basic', refProductId: 'cold-mango-boost' },
      { id: 'gs-classic-bp-hot', name: 'Black Protocol (Hot)', price: 95, tier: 'classic', refProductId: 'coffee-black-protocol' },
      { id: 'gs-classic-bp-iced', name: 'Black Protocol (Iced)', price: 90, tier: 'classic', refProductId: 'coffee-black-protocol' },
      { id: 'gs-classic-al-hot', name: 'Agent Latte (Hot)', price: 145, tier: 'classic', refProductId: 'coffee-agent-latte' },
      { id: 'gs-classic-al-iced', name: 'Agent Latte (Iced)', price: 95, tier: 'classic', refProductId: 'coffee-agent-latte' },
      { id: 'gs-classic-golden-file', name: 'Golden File', price: 150, tier: 'classic', refProductId: 'cold-golden-file' },
      { id: 'gs-classic-mango-boost', name: 'Mango Boost', price: 170, tier: 'classic', refProductId: 'cold-mango-boost' },
      { id: 'gs-loaded-bp-hot', name: 'Black Protocol (Hot)', price: 80, tier: 'loaded', refProductId: 'coffee-black-protocol' },
      { id: 'gs-loaded-bp-iced', name: 'Black Protocol (Iced)', price: 75, tier: 'loaded', refProductId: 'coffee-black-protocol' },
      { id: 'gs-loaded-al-hot', name: 'Agent Latte (Hot)', price: 140, tier: 'loaded', refProductId: 'coffee-agent-latte' },
      { id: 'gs-loaded-al-iced', name: 'Agent Latte (Iced)', price: 90, tier: 'loaded', refProductId: 'coffee-agent-latte' },
      { id: 'gs-loaded-golden-file', name: 'Golden File', price: 145, tier: 'loaded', refProductId: 'cold-golden-file' },
      { id: 'gs-loaded-mango-boost', name: 'Mango Boost', price: 160, tier: 'loaded', refProductId: 'cold-mango-boost' }
    ],
    addOns: [
      { id: 'gs-addon-more-fish', name: 'More Fish (per 40g)', price: 45, category: 'Protein' },
      { id: 'gs-addon-egg', name: 'Egg', price: 15, category: 'Protein' },
      { id: 'gs-addon-dressing', name: 'Dressing', price: 30, category: 'Sauces' }
    ],
    available: true,
    popular: true
  },
  {
    id: 'meal-fish-protocol',
    name: 'Fish Protocol',
    description: 'Signature battered fish fillet, mission recipe',
    basePrice: 109,
    category: 'mission-meals',
    orderingMode: 'mission-meal',
    mealOrderTypes: ['ala-carte', 'mission-set'],
    serviceTypePrompt: true,
    variations: [
      { id: 'var-basic', name: 'Basic', price: 109, tier: 'basic' },
      { id: 'var-classic', name: 'Classic', price: 189, tier: 'classic' },
      { id: 'var-loaded', name: 'Loaded', price: 239, tier: 'loaded' }
    ],
    drinkUpgrades: [
      { id: 'fp-basic-bp-hot', name: 'Black Protocol (Hot)', price: 95, tier: 'basic', refProductId: 'coffee-black-protocol' },
      { id: 'fp-basic-bp-iced', name: 'Black Protocol (Iced)', price: 90, tier: 'basic', refProductId: 'coffee-black-protocol' },
      { id: 'fp-basic-al-hot', name: 'Agent Latte (Hot)', price: 145, tier: 'basic', refProductId: 'coffee-agent-latte' },
      { id: 'fp-basic-al-iced', name: 'Agent Latte (Iced)', price: 95, tier: 'basic', refProductId: 'coffee-agent-latte' },
      { id: 'fp-basic-green-signal', name: 'Green Signal', price: 110, tier: 'basic', refProductId: 'cold-green-signal' },
      { id: 'fp-basic-pineapple-chill', name: 'Pineapple Chill', price: 115, tier: 'basic', refProductId: 'cold-pineapple-chill' },
      { id: 'fp-classic-bp-hot', name: 'Black Protocol (Hot)', price: 95, tier: 'classic', refProductId: 'coffee-black-protocol' },
      { id: 'fp-classic-bp-iced', name: 'Black Protocol (Iced)', price: 90, tier: 'classic', refProductId: 'coffee-black-protocol' },
      { id: 'fp-classic-al-hot', name: 'Agent Latte (Hot)', price: 145, tier: 'classic', refProductId: 'coffee-agent-latte' },
      { id: 'fp-classic-al-iced', name: 'Agent Latte (Iced)', price: 95, tier: 'classic', refProductId: 'coffee-agent-latte' },
      { id: 'fp-classic-green-signal', name: 'Green Signal', price: 110, tier: 'classic', refProductId: 'cold-green-signal' },
      { id: 'fp-classic-pineapple-chill', name: 'Pineapple Chill', price: 115, tier: 'classic', refProductId: 'cold-pineapple-chill' },
      { id: 'fp-loaded-bp-hot', name: 'Black Protocol (Hot)', price: 80, tier: 'loaded', refProductId: 'coffee-black-protocol' },
      { id: 'fp-loaded-bp-iced', name: 'Black Protocol (Iced)', price: 75, tier: 'loaded', refProductId: 'coffee-black-protocol' },
      { id: 'fp-loaded-al-hot', name: 'Agent Latte (Hot)', price: 140, tier: 'loaded', refProductId: 'coffee-agent-latte' },
      { id: 'fp-loaded-al-iced', name: 'Agent Latte (Iced)', price: 90, tier: 'loaded', refProductId: 'coffee-agent-latte' },
      { id: 'fp-loaded-green-signal', name: 'Green Signal', price: 105, tier: 'loaded', refProductId: 'cold-green-signal' },
      { id: 'fp-loaded-pineapple-chill', name: 'Pineapple Chill', price: 110, tier: 'loaded', refProductId: 'cold-pineapple-chill' }
    ],
    addOns: [
      { id: 'fp-addon-regular-chips', name: 'Regular Chips', price: 75, category: 'Sides' },
      { id: 'fp-addon-medium-chips', name: 'Medium Chips', price: 100, category: 'Sides' },
      { id: 'fp-addon-large-chips', name: 'Large Chips', price: 125, category: 'Sides' },
      { id: 'fp-addon-tartar', name: 'Dip (Tartar Sauce)', price: 25, category: 'Sauces' },
      { id: 'fp-addon-spicy-mayo', name: 'Dip (Spicy Mayo)', price: 25, category: 'Sauces' },
      { id: 'fp-addon-plain-rice', name: 'Plain Rice', price: 15, category: 'Sides' }
    ],
    available: true
  },
  {
    id: 'meal-sausage-code',
    name: 'Sausage Code',
    description: 'House-blend artisan sausages per directive',
    basePrice: 129,
    category: 'mission-meals',
    orderingMode: 'mission-meal',
    mealOrderTypes: ['ala-carte', 'mission-set'],
    serviceTypePrompt: true,
    variations: [
      { id: 'var-basic', name: 'Basic', price: 129, tier: 'basic' },
      { id: 'var-classic', name: 'Classic', price: 199, tier: 'classic' },
      { id: 'var-loaded', name: 'Loaded', price: 279, tier: 'loaded' }
    ],
    drinkUpgrades: [
      { id: 'sc-basic-bp-hot', name: 'Black Protocol (Hot)', price: 95, tier: 'basic', refProductId: 'coffee-black-protocol' },
      { id: 'sc-basic-bp-iced', name: 'Black Protocol (Iced)', price: 90, tier: 'basic', refProductId: 'coffee-black-protocol' },
      { id: 'sc-basic-al-hot', name: 'Agent Latte (Hot)', price: 145, tier: 'basic', refProductId: 'coffee-agent-latte' },
      { id: 'sc-basic-al-iced', name: 'Agent Latte (Iced)', price: 95, tier: 'basic', refProductId: 'coffee-agent-latte' },
      { id: 'sc-basic-red-alert', name: 'Red Alert', price: 130, tier: 'basic', refProductId: 'cold-red-alert' },
      { id: 'sc-basic-watermelon-rush', name: 'Watermelon Rush', price: 119, tier: 'basic', refProductId: 'cold-watermelon-rush' },
      { id: 'sc-classic-bp-hot', name: 'Black Protocol (Hot)', price: 95, tier: 'classic', refProductId: 'coffee-black-protocol' },
      { id: 'sc-classic-bp-iced', name: 'Black Protocol (Iced)', price: 90, tier: 'classic', refProductId: 'coffee-black-protocol' },
      { id: 'sc-classic-al-hot', name: 'Agent Latte (Hot)', price: 145, tier: 'classic', refProductId: 'coffee-agent-latte' },
      { id: 'sc-classic-al-iced', name: 'Agent Latte (Iced)', price: 95, tier: 'classic', refProductId: 'coffee-agent-latte' },
      { id: 'sc-classic-red-alert', name: 'Red Alert', price: 130, tier: 'classic', refProductId: 'cold-red-alert' },
      { id: 'sc-classic-watermelon-rush', name: 'Watermelon Rush', price: 119, tier: 'classic', refProductId: 'cold-watermelon-rush' },
      { id: 'sc-loaded-bp-hot', name: 'Black Protocol (Hot)', price: 80, tier: 'loaded', refProductId: 'coffee-black-protocol' },
      { id: 'sc-loaded-bp-iced', name: 'Black Protocol (Iced)', price: 75, tier: 'loaded', refProductId: 'coffee-black-protocol' },
      { id: 'sc-loaded-al-hot', name: 'Agent Latte (Hot)', price: 140, tier: 'loaded', refProductId: 'coffee-agent-latte' },
      { id: 'sc-loaded-al-iced', name: 'Agent Latte (Iced)', price: 90, tier: 'loaded', refProductId: 'coffee-agent-latte' },
      { id: 'sc-loaded-red-alert', name: 'Red Alert', price: 125, tier: 'loaded', refProductId: 'cold-red-alert' },
      { id: 'sc-loaded-watermelon-rush', name: 'Watermelon Rush', price: 114, tier: 'loaded', refProductId: 'cold-watermelon-rush' }
    ],
    addOns: [
      { id: 'sc-addon-whole-sausage', name: 'Whole Sausage', price: 150, category: 'Protein' },
      { id: 'sc-addon-garlic-rice', name: 'Garlic Rice', price: 20, category: 'Sides' },
      { id: 'sc-addon-plain-rice', name: 'Plain Rice', price: 15, category: 'Sides' },
      { id: 'sc-addon-egg', name: 'Egg', price: 15, category: 'Protein' },
      { id: 'sc-addon-dressing', name: 'Dressing (Mustard Crema)', price: 25, category: 'Sauces' }
    ],
    available: true
  },
  {
    id: 'meal-beef-directive',
    name: 'Beef Directive',
    description: 'Slow-cooked beef entree with mission sides',
    basePrice: 99,
    category: 'mission-meals',
    orderingMode: 'mission-meal',
    mealOrderTypes: ['ala-carte', 'mission-set'],
    serviceTypePrompt: true,
    variations: [
      { id: 'var-basic', name: 'Basic', price: 99, tier: 'basic' },
      { id: 'var-classic', name: 'Classic', price: 169, tier: 'classic' },
      { id: 'var-loaded', name: 'Loaded', price: 229, tier: 'loaded' }
    ],
    drinkUpgrades: [
      { id: 'bd-basic-bp-hot', name: 'Black Protocol (Hot)', price: 95, tier: 'basic', refProductId: 'coffee-black-protocol' },
      { id: 'bd-basic-bp-iced', name: 'Black Protocol (Iced)', price: 90, tier: 'basic', refProductId: 'coffee-black-protocol' },
      { id: 'bd-basic-al-hot', name: 'Agent Latte (Hot)', price: 145, tier: 'basic', refProductId: 'coffee-agent-latte' },
      { id: 'bd-basic-al-iced', name: 'Agent Latte (Iced)', price: 95, tier: 'basic', refProductId: 'coffee-agent-latte' },
      { id: 'bd-basic-secret-garden', name: 'Secret Garden', price: 115, tier: 'basic', refProductId: 'cold-secret-garden' },
      { id: 'bd-basic-peach-focus', name: 'Peach Focus', price: 145, tier: 'basic', refProductId: 'cold-peach-focus' },
      { id: 'bd-classic-bp-hot', name: 'Black Protocol (Hot)', price: 95, tier: 'classic', refProductId: 'coffee-black-protocol' },
      { id: 'bd-classic-bp-iced', name: 'Black Protocol (Iced)', price: 90, tier: 'classic', refProductId: 'coffee-black-protocol' },
      { id: 'bd-classic-al-hot', name: 'Agent Latte (Hot)', price: 145, tier: 'classic', refProductId: 'coffee-agent-latte' },
      { id: 'bd-classic-al-iced', name: 'Agent Latte (Iced)', price: 95, tier: 'classic', refProductId: 'coffee-agent-latte' },
      { id: 'bd-classic-secret-garden', name: 'Secret Garden', price: 115, tier: 'classic', refProductId: 'cold-secret-garden' },
      { id: 'bd-classic-peach-focus', name: 'Peach Focus', price: 145, tier: 'classic', refProductId: 'cold-peach-focus' },
      { id: 'bd-loaded-bp-hot', name: 'Black Protocol (Hot)', price: 80, tier: 'loaded', refProductId: 'coffee-black-protocol' },
      { id: 'bd-loaded-bp-iced', name: 'Black Protocol (Iced)', price: 75, tier: 'loaded', refProductId: 'coffee-black-protocol' },
      { id: 'bd-loaded-al-hot', name: 'Agent Latte (Hot)', price: 140, tier: 'loaded', refProductId: 'coffee-agent-latte' },
      { id: 'bd-loaded-al-iced', name: 'Agent Latte (Iced)', price: 90, tier: 'loaded', refProductId: 'coffee-agent-latte' },
      { id: 'bd-loaded-secret-garden', name: 'Secret Garden', price: 110, tier: 'loaded', refProductId: 'cold-secret-garden' },
      { id: 'bd-loaded-peach-focus', name: 'Peach Focus', price: 140, tier: 'loaded', refProductId: 'cold-peach-focus' }
    ],
    addOns: [
      { id: 'bd-addon-plain-rice', name: 'Plain Rice', price: 15, category: 'Sides' },
      { id: 'bd-addon-egg', name: 'Egg', price: 15, category: 'Protein' },
      { id: 'bd-addon-cheese', name: 'Cheese', price: 15, category: 'Protein' },
      { id: 'bd-addon-gravy', name: 'Gravy', price: 15, category: 'Sauces' },
      { id: 'bd-addon-vege-sides', name: 'Vege Sides', price: 10, category: 'Sides' }
    ],
    available: true,
    popular: true
  },

  // =========================================
  // 2. SOCIAL DINING
  // =========================================
  {
    id: 'social-mission-crisp',
    name: 'Mission Crisp',
    description: 'Crisp golden potato rounds, team-favorite cuts',
    basePrice: 79,
    category: 'social-dining',
    orderingMode: 'simple',
    variations: [
      { id: 'var-standard', name: 'Standard', price: 79 },
      { id: 'var-trio', name: 'Trio', price: 110 }
    ],
    addOns: [
      { id: 'mc-addon-dip-honey-garlic', name: 'Extra Dip (Honey Garlic)', price: 10, category: 'Dips' },
      { id: 'mc-addon-dip-pineapple-chili', name: 'Extra Dip (Pineapple Chili)', price: 10, category: 'Dips' },
      { id: 'mc-addon-dip-cacao-bbq', name: 'Extra Dip (Cacao Barbecue)', price: 10, category: 'Dips' },
      { id: 'mc-addon-dip-trio', name: 'Extra Dip (Trio)', price: 25, category: 'Dips' }
    ],
    available: true,
    popular: true
  },
  {
    id: 'social-dip-crunch-set',
    name: 'Dip Crunch Set',
    description: 'Crisp dippers + mission dips',
    basePrice: 120,
    category: 'social-dining',
    orderingMode: 'simple',
    variations: [
      { id: 'var-bite-solo', name: 'Bite Solo', price: 120 },
      { id: 'var-snack-set', name: 'Snack Set', price: 220 },
      { id: 'var-share-set', name: 'Share Set', price: 360 }
    ],
    available: true
  },
  {
    id: 'social-sausage-code-bite',
    name: 'Sausage Code Bite Set',
    description: 'Bite-sized sausage code pieces with dips',
    basePrice: 135,
    category: 'social-dining',
    orderingMode: 'simple',
    variations: [
      { id: 'var-bite-solo', name: 'Bite Solo', price: 135 },
      { id: 'var-snack-set', name: 'Snack Set', price: 245 },
      { id: 'var-share-set', name: 'Share Set', price: 395 }
    ],
    available: true
  },

  // =========================================
  // 3. COFFEE INTELLIGENCE
  // =========================================
  {
    id: 'coffee-espresso-shot',
    name: 'Espresso Shot',
    description: 'Pure pulled espresso briefing',
    basePrice: 65,
    category: 'coffee-intelligence',
    orderingMode: 'simple',
    available: true
  },
  {
    id: 'coffee-black-protocol',
    name: 'Black Protocol',
    description: 'Pure brewed protocol, intelligence-grade beans',
    basePrice: 110,
    category: 'coffee-intelligence',
    orderingMode: 'simple',
    variations: [
      { id: 'var-hot-8oz', name: 'Hot (8oz)', price: 110 },
      { id: 'var-iced-16oz', name: 'Iced (16oz)', price: 130 }
    ],
    available: true,
    popular: true
  },
  {
    id: 'coffee-agent-latte',
    name: 'Agent Latte',
    description: 'Silky milk mission espresso latte',
    basePrice: 145,
    category: 'coffee-intelligence',
    orderingMode: 'simple',
    variations: [
      { id: 'var-hot-8oz', name: 'Hot (8oz)', price: 145 },
      { id: 'var-iced-16oz', name: 'Iced (16oz)', price: 165 }
    ],
    available: true,
    popular: true
  },
  {
    id: 'coffee-midnight-brief',
    name: 'Midnight Brief (Cold Brew)',
    description: '18-hour slow-steeped cold brew dossier',
    basePrice: 140,
    category: 'coffee-intelligence',
    orderingMode: 'simple',
    available: true
  },

  // =========================================
  // 4. COLD OPERATIONS - SIGNATURE MOCKTAILS
  // =========================================
  // Refreshers
  {
    id: 'cold-red-alert',
    name: 'Red Alert',
    description: 'Berry-berry refresher, high-signal blend',
    basePrice: 120,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Refreshers',
    available: true,
    popular: true
  },
  {
    id: 'cold-golden-file',
    name: 'Golden File',
    description: 'Tropical refresher mission dossier',
    basePrice: 120,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Refreshers',
    available: true
  },
  {
    id: 'cold-green-signal',
    name: 'Green Signal',
    description: 'Green apple & kiwi go-signal refresher',
    basePrice: 125,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Refreshers',
    available: true
  },
  // Tea Series
  {
    id: 'cold-midnight-dossier',
    name: 'Midnight Dossier',
    description: 'Deep black tea blend with midnight profile',
    basePrice: 130,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Tea Series',
    available: true
  },
  {
    id: 'cold-secret-garden',
    name: 'Secret Garden',
    description: 'Jasmine & herb tea brief — garden-classified',
    basePrice: 125,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Tea Series',
    available: true,
    popular: true
  },
  // Coffee Bar Mocktails
  {
    id: 'cold-blackout',
    name: 'Blackout',
    description: 'Coffee mocktail — dark roast profile, zero ABV',
    basePrice: 150,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Coffee Bar Mocktails',
    available: true
  },
  {
    id: 'cold-shadow-protocol',
    name: 'Shadow Protocol',
    description: 'Shaken coffee mocktail, covert cream finish',
    basePrice: 155,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Coffee Bar Mocktails',
    available: true,
    popular: true
  },
  // Fresh Blends
  {
    id: 'cold-watermelon-rush',
    name: 'Watermelon Rush',
    description: 'Fresh watermelon mission blend',
    basePrice: 135,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Fresh Blends',
    available: true
  },
  {
    id: 'cold-mango-boost',
    name: 'Mango Boost',
    description: 'Ripe mango intelligence smoothie',
    basePrice: 140,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Fresh Blends',
    available: true
  },
  {
    id: 'cold-banana-energy',
    name: 'Banana Energy',
    description: 'Banana + oats field-ops blend',
    basePrice: 135,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Fresh Blends',
    available: true
  },
  {
    id: 'cold-pineapple-chill',
    name: 'Pineapple Chill',
    description: 'Pineapple recovery blend, chill-factor profile',
    basePrice: 140,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Fresh Blends',
    available: true,
    popular: true
  },
  {
    id: 'cold-berry-reset',
    name: 'Berry Reset',
    description: 'Mixed-berry reset blend',
    basePrice: 145,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Fresh Blends',
    available: true
  },
  {
    id: 'cold-peach-focus',
    name: 'Peach Focus',
    description: 'Peach focus formula blend',
    basePrice: 140,
    category: 'cold-operations',
    orderingMode: 'simple',
    subCategory: 'Fresh Blends',
    available: true
  },

  // =========================================
  // 5. SWEET ENDINGS
  // =========================================
  {
    id: 'sweet-honey-brioche',
    name: 'Honey Brioche Toast',
    description: 'Buttery brioche toast mission-glazed with honey',
    basePrice: 165,
    category: 'sweet-endings',
    orderingMode: 'simple',
    available: true,
    popular: true
  },
  {
    id: 'sweet-tablea-brownie',
    name: 'Tablea Brownie',
    description: 'Rich Filipino tablea cacao brownie',
    basePrice: 145,
    category: 'sweet-endings',
    orderingMode: 'simple',
    available: true
  }
];

export function getProductsByCategory(categoryId: string): MenuItem[] {
  return SMART_MENU.filter(item => item.category === categoryId);
}

export function getFilteredDrinkUpgrades(
  product: MenuItem,
  variationTier: 'basic' | 'classic' | 'loaded' | undefined
): DrinkUpgrade[] {
  if (!product.drinkUpgrades || !variationTier) return [];
  return product.drinkUpgrades.filter(dup => dup.tier === variationTier);
}

export function getVariations(product: MenuItem): Variation[] {
  return product.variations ?? [];
}

export function groupColdOpsSubCategories(): string[] {
  return ['Refreshers', 'Tea Series', 'Coffee Bar Mocktails', 'Fresh Blends'];
}

export function getColdOpsBySubCategory(categoryId: string, subCategory: string): MenuItem[] {
  return SMART_MENU.filter(
    item => item.category === categoryId && item.subCategory === subCategory
  );
}
