import React, { memo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { BRAND, brandedLogo, brandedText } from '../brand';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, onCartClick }) => {
  const { siteSettings, loading } = useSiteSettings();
  const logo = brandedLogo(siteSettings?.site_logo);
  const name = brandedText(siteSettings?.site_name, BRAND.name);
  const tagline = brandedText(siteSettings?.site_tagline, BRAND.tagline);

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-teamax-gold/30 shadow-gold transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src={logo}
              alt={name}
              className="w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = BRAND.logo;
              }}
            />
            <div className="flex flex-col items-start">
              <h1 className="text-xl font-display font-bold text-teamax-gold tracking-[0.28em]">
                {loading ? (
                  <div className="w-28 h-6 bg-teamax-light rounded animate-pulse" />
                ) : (
                  'MISSION'
                )}
              </h1>
              <span className="text-sm font-script italic text-teamax-gold tracking-[0.35em] leading-none">
                007
              </span>
              <span className="hidden sm:block mt-1 text-[9px] text-teamax-secondary font-sans uppercase tracking-[0.35em]">
                {tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onCartClick}
              className="relative p-3 bg-transparent text-teamax-gold border border-teamax-gold/70 hover:bg-teamax-gold hover:text-black rounded-full transition-all duration-300 group hover:scale-110 active:scale-90 shadow-gold"
              title="Cart"
            >
              <ShoppingCart className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-teamax-gold text-black text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce-gentle border border-black shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default memo(Header);
