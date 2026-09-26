import React, { useEffect, useState, useMemo } from 'react';
import { MenuItem, CartItem } from '../types';
import { useCategories } from '../hooks/useCategories';
import MenuItemCard from './MenuItemCard';
import { Search, X } from 'lucide-react';

interface MenuProps {
  menuItems: MenuItem[];
  addToCart: (item: MenuItem, quantity?: number, variation?: any, addOns?: any[], flavor?: string) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
}

const Menu: React.FC<MenuProps> = ({ menuItems, addToCart, cartItems, updateQuantity }) => {
  const { categories } = useCategories();
  const [activeCategory, setActiveCategory] = useState('hot-coffee');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items based on search term
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) return menuItems;
    const term = searchTerm.toLowerCase();
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }, [menuItems, searchTerm]);

  useEffect(() => {
    if (categories.length > 0) {
      const defaultCategory = categories.find(cat => cat.id === 'dim-sum') || categories[0];
      if (!categories.find(cat => cat.id === activeCategory)) {
        setActiveCategory(defaultCategory.id);
      }
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (searchTerm.trim()) return; // Disable scroll sync during search

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = categories.map(cat => document.getElementById(cat.id)).filter(Boolean);
          const scrollPosition = window.scrollY + 200;

          for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            if (section && section.offsetTop <= scrollPosition) {
              setActiveCategory(categories[i].id);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories, searchTerm]);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.5em] text-teamax-gold mb-3">The Briefing</p>
          <h2 className="text-4xl font-display font-bold text-teamax-gold tracking-[0.2em] mb-8">Our Menu</h2>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-teamax-secondary group-focus-within:text-teamax-gold transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search the briefing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-12 py-4 bg-teamax-surface border border-teamax-gold/40 rounded-none text-teamax-primary placeholder:text-teamax-secondary focus:outline-none focus:border-teamax-gold transition-all shadow-gold"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-teamax-secondary hover:text-teamax-gold transition-colors"
                title="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-24">
          {categories.map((category) => {
            const categoryItems = filteredMenuItems.filter(item => item.category === category.id);

            if (categoryItems.length === 0) return null;

            return (
              <section
                key={category.id}
                id={category.id}
                className="scroll-mt-32 transition-all duration-500"
              >
                <div className="flex items-center mb-10 border-b border-teamax-gold/20 pb-4">
                  <span className="text-4xl mr-4 drop-shadow-sm">{category.icon}</span>
                  <h3 className="text-3xl font-display font-bold text-teamax-gold tracking-[0.12em]">{category.name}</h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                  {categoryItems.map((item, index) => {
                    const totalQuantity = (cartItems || [])
                      .filter(ci => ci.id === item.id || ci.id.startsWith(`${item.id}-`))
                      .reduce((sum, ci) => sum + ci.quantity, 0);
                    return (
                      <div
                        key={item.id}
                        className="animate-scale-in"
                        /* Dynamic delay for sequence animation */
                        style={{ '--animation-delay': `${index * 50}ms` } as React.CSSProperties}
                      >
                        <MenuItemCard
                          item={item}
                          onAddToCart={addToCart}
                          quantity={totalQuantity}
                          onUpdateQuantity={updateQuantity}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-20 bg-teamax-surface rounded-none border border-dashed border-teamax-gold/40">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-display font-bold text-teamax-gold mb-2">No dishes found</h3>
              <p className="text-teamax-secondary">Try searching for something else or browse our categories.</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 text-teamax-gold font-bold uppercase tracking-widest text-xs border-b border-teamax-gold pb-1 hover:text-teamax-primary transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Menu;
