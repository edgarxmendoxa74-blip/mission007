import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';
import SmartOrderFlow from './SmartOrderFlow';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (
    item: MenuItem,
    quantity?: number,
    variation?: Variation,
    addOns?: AddOn[],
    flavor?: string,
    meta?: any
  ) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
  quantity,
  onUpdateQuantity
}) => {
  const [localQuantity, setLocalQuantity] = useState(1);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const requiresCustomizer = Boolean(
    (item.variations && item.variations.length > 0) ||
    (item.addOns && item.addOns.length > 0) ||
    (item.flavors && item.flavors.length > 0) ||
    item.serviceTypePrompt ||
    (item.mealOrderTypes && item.mealOrderTypes.length > 0) ||
    item.orderingMode === 'mission-meal'
  );

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.available) return;

    if (requiresCustomizer) {
      setShowCustomizer(true);
    } else {
      onAddToCart(item, localQuantity, item.variations?.[0], [], item.flavors?.[0]);
      setLocalQuantity(1);
    }
  };

  const handleConfirmFromSmartFlow = (
    qty: number,
    variation: Variation | undefined,
    addOns: AddOn[],
    flavor: string | undefined,
    meta: any
  ) => {
    onAddToCart(item, qty, variation, addOns, flavor, meta);
    setShowCustomizer(false);
    setLocalQuantity(1);
  };

  const customizerModal = showCustomizer && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => setShowCustomizer(false)}
    >
      <div
        className="rounded-t-3xl sm:rounded-2xl relative bg-teamax-surface w-full sm:max-w-lg h-[92vh] supports-[height:100dvh]:h-[92dvh] sm:h-[90vh] sm:max-h-[90vh] overflow-hidden animate-scale-in shadow-gold-lg border border-teamax-gold/40 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-32 sm:h-40 [@media(max-height:720px)]:h-24 w-full bg-teamax-dark shrink-0">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">
              {item.category?.includes('coffee') ? '☕'
                : item.category?.includes('cold') ? '🥤'
                : item.category?.includes('sweet') ? '🍰'
                : item.category?.includes('social') ? '🍟'
                : '🍽️'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            onClick={() => setShowCustomizer(false)}
            className="absolute top-3 right-3 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all text-white group z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="absolute bottom-4 left-6 right-16">
            <h3 className="text-2xl sm:text-3xl [@media(max-height:720px)]:text-xl font-serif font-bold text-white leading-tight">{item.name}</h3>
            <p className="text-white/70 text-[10px] sm:text-xs uppercase tracking-[0.25em] font-medium mt-1">
              Customize your order
            </p>
          </div>
        </div>

        <SmartOrderFlow
          product={item}
          onConfirm={handleConfirmFromSmartFlow}
          onClose={() => setShowCustomizer(false)}
        />
      </div>
    </div>,
    document.body
  );

  const effectivePrice = item.effectivePrice || item.basePrice || 0;
  const isCustomizable = requiresCustomizer;

  return (
    <div
      className={`rounded-2xl bg-teamax-surface overflow-hidden group animate-scale-in border border-teamax-gold/25 hover:border-teamax-gold/60 hover:shadow-gold transition-all duration-300 ${!item.available ? 'opacity-60' : ''}`}
    >
      <div className="relative h-32 sm:h-48 bg-teamax-dark overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">
            {item.category === 'mission-meals' ? '🍽️'
              : item.category === 'social-dining' ? '🍟'
              : item.category === 'coffee-intelligence' ? '☕'
              : item.category === 'cold-operations' ? '🥤'
              : '🍰'}
          </div>
        )}

        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
          {item.isOnDiscount && item.discountPrice && (
            <div className="bg-red-100 text-red-600 border border-red-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">SALE</div>
          )}
          {item.popular && (
            <div className="bg-teamax-gold text-black text-[10px] font-bold px-3 py-1 shadow-lg tracking-widest">POPULAR</div>
          )}
          {quantity > 0 && (
            <div className="bg-teamax-gold text-black text-[10px] font-bold px-3 py-1 shadow-lg tracking-widest">{quantity} IN CART</div>
          )}
        </div>

        {!item.available && (
          <div className="absolute top-3 right-3 bg-red-100 text-red-500 border border-red-500 text-[10px] font-bold px-3 py-1 rounded-full">UNAVAILABLE</div>
        )}
      </div>

      <div className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
          <h4 className="text-sm sm:text-lg font-display font-bold text-teamax-gold leading-tight flex-1 sm:pr-2 mb-1 sm:mb-0 line-clamp-1">{item.name}</h4>
          {isCustomizable && (
            <div className="rounded-full text-[10px] text-teamax-secondary border border-teamax-gold/40 px-2 py-0.5 uppercase tracking-wider font-bold w-fit">
              Customizable
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm mb-3 sm:mb-4 text-teamax-secondary leading-relaxed line-clamp-1">
          {!item.available ? 'Currently Unavailable' : item.description}
        </p>

        <div className="space-y-3">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            {item.isOnDiscount && item.discountPrice ? (
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-bold text-teamax-accent">₱{(item.discountPrice || 0).toFixed(2)}</span>
                <span className="text-[10px] sm:text-xs text-teamax-secondary/70 line-through">₱{(item.basePrice || 0).toFixed(2)}</span>
              </div>
            ) : (
              <div className="text-base sm:text-xl font-bold text-teamax-gold">₱{effectivePrice.toFixed(2)}</div>
            )}

            {item.available && (
              <div className="rounded-xl flex items-center justify-between sm:justify-start gap-2 bg-black p-1 border border-teamax-gold/40 w-full sm:w-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); setLocalQuantity(Math.max(1, localQuantity - 1)); }}
                  className="rounded-lg p-1 sm:p-2 hover:bg-teamax-gold hover:text-black text-teamax-gold active:scale-90"
                >
                  <Minus className="h-3 sm:h-4 w-3 sm:w-4" />
                </button>
                <span className="font-bold text-teamax-primary min-w-[16px] text-center text-xs sm:text-base">{localQuantity}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setLocalQuantity(localQuantity + 1); }}
                  className="rounded-lg p-1 sm:p-2 hover:bg-teamax-gold hover:text-black text-teamax-gold active:scale-90"
                >
                  <Plus className="h-3 sm:h-4 w-3 sm:w-4" />
                </button>
              </div>
            )}
          </div>

          {!item.available ? (
            <button disabled className="w-full bg-teamax-light text-teamax-secondary px-4 py-3 cursor-not-allowed font-bold text-[10px] uppercase tracking-widest">Sold Out</button>
          ) : (
            <button
              onClick={handleAddToCartClick}
              className="mission-btn-outline w-full px-2 sm:px-6 py-2.5 text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] whitespace-nowrap flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <ShoppingCart className="h-4 w-4 shrink-0" />
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {customizerModal}
    </div>
  );
};

// Menu items keep their object identity until something about them changes
// (e.g. an uploaded image arrives), so comparing the item reference catches
// every field without re-rendering on unrelated parent updates.
export default memo(MenuItemCard, (prev, next) => (
  prev.item === next.item &&
  prev.quantity === next.quantity
));
