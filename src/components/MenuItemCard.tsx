import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[], flavor?: string) => void;
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
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const [selectedFlavor, setSelectedFlavor] = useState<string | undefined>(
    item.flavors?.[0]
  );
  const [selectedFlavor2, setSelectedFlavor2] = useState<string | undefined>(
    item.flavors?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.available) return;

    if ((item.variations && item.variations.length > 1) || (item.addOns && item.addOns.length > 0) || (item.flavors && item.flavors.length > 0)) {
      setShowVariationModal(true);
    } else {
      onAddToCart(item, localQuantity, item.variations?.[0], [], item.flavors?.[0]);
      setLocalQuantity(1); // Reset after adding
    }
  };

  const handleConfirmVariation = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if we need to combine flavors (e.g., chicken wings category)
    const isWings = item.category?.toLowerCase() === 'chicken-wings' || item.name?.toLowerCase().includes('chicken wings');
    const allowTwoFlavors = isWings && (selectedVariation?.name?.toLowerCase().includes('12') || item.name?.toLowerCase().includes('12'));

    let finalFlavor = selectedFlavor;
    if (allowTwoFlavors && selectedFlavor && selectedFlavor2 && selectedFlavor !== selectedFlavor2) {
      finalFlavor = `${selectedFlavor} & ${selectedFlavor2}`;
    } else if (isWings) {
      finalFlavor = selectedFlavor;
    }

    onAddToCart(item, localQuantity, selectedVariation, selectedAddOns, finalFlavor);
    setShowVariationModal(false);
    setLocalQuantity(1);
    setSelectedAddOns([]);
  };

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns(prev =>
      prev.find(a => a.id === addOn.id)
        ? prev.filter(a => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  const calculateTotalPrice = () => {
    const variationPrice = selectedVariation ? selectedVariation.price : (item.effectivePrice || item.basePrice);
    const addOnsTotal = (selectedAddOns || []).reduce((sum, addOn) => sum + addOn.price, 0);
    return (variationPrice + addOnsTotal) * localQuantity;
  };

  const variationModal = showVariationModal && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => { setShowVariationModal(false); setSelectedAddOns([]); }}
    >
      <div
        className="relative bg-teamax-surface w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden animate-scale-in shadow-gold-lg border border-teamax-gold/40 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Image Header */}
        <div className="relative h-56 sm:h-64 w-full bg-teamax-dark shrink-0">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">☕</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            onClick={() => { setShowVariationModal(false); setSelectedAddOns([]); }}
            className="absolute top-6 right-6 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all text-white group z-10"
            aria-label="Close"
          >
            <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="absolute bottom-8 left-8 right-8">
            <h3 className="text-3xl font-serif font-bold text-white leading-tight">{item.name}</h3>
            <p className="text-white/70 text-xs uppercase tracking-[0.2em] font-medium mt-1">Customize your order</p>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">
          {/* Variations Section */}
          {item.variations && item.variations.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Select Preferred Variation</h4>
                <span className="text-[10px] text-teamax-accent font-bold px-3 py-1 bg-teamax-accent/10 rounded-full">{item.variations.length} Options</span>
              </div>
              <div className="space-y-4">
                {item.variations.map((v) => (
                  <label
                    key={v.id}
                    onClick={() => setSelectedVariation(v)}
                    className={`group flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${selectedVariation?.id === v.id
                      ? 'border-teamax-gold bg-black shadow-gold transform scale-[1.02]'
                      : 'border-teamax-gold/20 bg-black/40 hover:border-teamax-gold/50'}`}
                  >
                    <div className="flex items-center space-x-5">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedVariation?.id === v.id ? 'border-teamax-gold bg-teamax-gold' : 'border-teamax-gold/40'}`}>
                        {selectedVariation?.id === v.id && <div className="w-2 h-2 bg-black rounded-full" />}
                      </div>
                      <span className={`text-base font-bold tracking-wider uppercase transition-colors ${selectedVariation?.id === v.id ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>{v.name}</span>
                    </div>
                    <span className={`text-base font-bold transition-colors ${selectedVariation?.id === v.id ? 'text-teamax-gold' : 'text-teamax-secondary'}`}>₱{(v.price || 0).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>

          )}

          {/* Flavors Section */}
          {item.flavors && item.flavors.length > 0 && (
            <div className="mb-8">
              {(item.category?.toLowerCase() === 'chicken-wings' || item.name?.toLowerCase().includes('chicken wings')) && (selectedVariation?.name?.toLowerCase().includes('12') || item.name?.toLowerCase().includes('12')) ? (
                // Unified multi-select for chicken wings flavors (Max 2)
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Select up to 2 Flavors</h4>
                    <span className="text-[10px] text-teamax-accent font-bold px-3 py-1 bg-teamax-accent/10 rounded-full">
                      {(!selectedFlavor && !selectedFlavor2) ? '0/2 Selected' : (selectedFlavor && selectedFlavor2 && selectedFlavor !== selectedFlavor2 ? '2/2 Selected' : '1/2 Selected')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {item.flavors.map((flavor) => {
                      const isSelected = selectedFlavor === flavor || selectedFlavor2 === flavor;

                      const toggleFlavor = () => {
                        if (selectedFlavor === flavor) {
                          setSelectedFlavor(selectedFlavor2);
                          setSelectedFlavor2(undefined);
                        } else if (selectedFlavor2 === flavor) {
                          setSelectedFlavor2(undefined);
                        } else if (!selectedFlavor) {
                          setSelectedFlavor(flavor);
                        } else if (!selectedFlavor2) {
                          setSelectedFlavor2(flavor);
                        } else {
                          // Replace second one if already 2 selected
                          setSelectedFlavor2(flavor);
                        }
                      };

                      return (
                        <label
                          key={flavor}
                          onClick={toggleFlavor}
                          className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${isSelected
                            ? 'border-teamax-gold bg-black shadow-gold'
                            : 'border-teamax-gold/20 bg-black/40 hover:border-teamax-gold/50'}`}
                        >
                          <span className={`text-sm font-bold tracking-wider uppercase transition-colors ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>{flavor}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-teamax-gold bg-teamax-gold' : 'border-teamax-gold/40'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Standard Logic (Single Flavor)
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Select Flavor</h4>
                    <span className="text-[10px] text-teamax-accent font-bold px-3 py-1 bg-teamax-accent/10 rounded-full">Optional</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {item.flavors.map((flavor) => (
                      <label
                        key={flavor}
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${selectedFlavor === flavor
                          ? 'border-teamax-gold bg-black shadow-gold'
                          : 'border-teamax-gold/20 bg-black/40 hover:border-teamax-gold/50'}`}
                      >
                        <span className={`text-sm font-bold tracking-wider uppercase transition-colors ${selectedFlavor === flavor ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>{flavor}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedFlavor === flavor ? 'border-teamax-gold bg-teamax-gold' : 'border-teamax-gold/40'}`}>
                          {selectedFlavor === flavor && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add-ons Section */}
          {item.addOns && item.addOns.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6 border-t border-teamax-gold/20 pt-8">
                <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Extra Add-ons</h4>
                <span className="text-[10px] text-teamax-accent font-bold px-3 py-1 bg-teamax-accent/10 rounded-full">Optional</span>
              </div>
              <div className="space-y-3">
                {item.addOns.map((addOn) => {
                  const isSelected = selectedAddOns.find(a => a.id === addOn.id);
                  return (
                    <label
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn)}
                      className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${isSelected
                        ? 'border-teamax-gold bg-black shadow-gold'
                        : 'border-teamax-gold/20 bg-black/40 hover:border-teamax-gold/50'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-teamax-gold bg-teamax-gold' : 'border-teamax-gold/40'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-sm rotate-45" />}
                        </div>
                        <span className={`text-sm font-bold tracking-wider uppercase ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary'}`}>{addOn.name}</span>
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary'}`}>+₱{(addOn.price || 0).toFixed(2)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-6 shrink-0 pb-4">
            <div className="flex items-center justify-between border-t border-teamax-gold/20 pt-6 px-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Quantity</span>
                <div className="flex items-center gap-4 mt-2 bg-black p-1.5 border border-teamax-gold/40">
                  <button
                    onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
                    className="p-2 hover:bg-teamax-gold hover:text-black transition-all active:scale-90 text-teamax-gold"
                    title="Decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-lg min-w-[24px] text-center text-teamax-primary">{localQuantity}</span>
                  <button
                    onClick={() => setLocalQuantity(localQuantity + 1)}
                    className="p-2 hover:bg-teamax-gold hover:text-black transition-all active:scale-90 text-teamax-gold"
                    title="Increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em] block mb-1">Total Amount</span>
                <span className="text-3xl font-bold text-teamax-gold block tracking-tight">₱{(calculateTotalPrice() || 0).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleConfirmVariation}
              className="mission-btn w-full py-6 flex items-center justify-center gap-4 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <ShoppingCart className="h-6 w-6" />
              <span className="uppercase tracking-[0.2em] text-xs">Confirm & Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div >,
    document.body
  );

  return (
    <div
      className={`bg-teamax-surface overflow-hidden group animate-scale-in border border-teamax-gold/25 hover:border-teamax-gold/60 hover:shadow-gold transition-all duration-300 ${!item.available ? 'opacity-60' : ''}`}
    >
      {/* Image Container */}
      <div className="relative h-32 sm:h-48 bg-teamax-dark overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">☕</div>
        )}

        {/* Badges */}
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

      {/* Main Content */}
      <div className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
          <h4 className="text-sm sm:text-lg font-display font-bold text-teamax-gold leading-tight flex-1 sm:pr-2 mb-1 sm:mb-0 line-clamp-1">{item.name}</h4>
          {((item.variations && item.variations.length > 0) || (item.addOns && item.addOns.length > 0) || (item.flavors && item.flavors.length > 0)) && (
            <div className="text-[10px] text-teamax-secondary border border-teamax-gold/40 px-2 py-0.5 uppercase tracking-wider font-bold w-fit">
              Customizable
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm mb-3 sm:mb-4 text-teamax-secondary leading-relaxed line-clamp-1">
          {!item.available ? 'Currently Unavailable' : item.description}
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {item.isOnDiscount && item.discountPrice ? (
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-bold text-teamax-accent">₱{(item.discountPrice || 0).toFixed(2)}</span>
                <span className="text-[10px] sm:text-xs text-teamax-secondary/70 line-through">₱{(item.basePrice || 0).toFixed(2)}</span>
              </div>
            ) : (
              <div className="text-base sm:text-xl font-bold text-teamax-gold">₱{(item.effectivePrice || item.basePrice || 0).toFixed(2)}</div>
            )}

            {item.available && (
              <div className="flex items-center gap-2 bg-black p-1 border border-teamax-gold/40 scale-90 sm:scale-100 origin-right">
                <button
                  onClick={(e) => { e.stopPropagation(); setLocalQuantity(Math.max(1, localQuantity - 1)); }}
                  title="Decrease quantity"
                  className="p-1 sm:p-2 hover:bg-teamax-gold hover:text-black text-teamax-gold active:scale-90"
                >
                  <Minus className="h-3 sm:h-4 w-3 sm:w-4" />
                </button>
                <span className="font-bold text-teamax-primary min-w-[16px] text-center text-xs sm:text-base">{localQuantity}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setLocalQuantity(localQuantity + 1); }}
                  title="Increase quantity"
                  className="p-1 sm:p-2 hover:bg-teamax-gold hover:text-black text-teamax-gold active:scale-90"
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
              className="mission-btn-outline w-full px-6 py-2.5 text-[10px] sm:text-xs flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {variationModal}
    </div>
  );
};
export default memo(MenuItemCard, (prev, next) => (
  prev.item.id === next.item.id &&
  prev.quantity === next.quantity &&
  prev.item.available === next.item.available &&
  prev.item.basePrice === next.item.basePrice &&
  prev.item.effectivePrice === next.item.effectivePrice
));
