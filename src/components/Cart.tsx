import React, { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Plus, Minus, X, ShoppingCart } from 'lucide-react';
import { CartItem, LineItemServiceType, MealMode } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onCheckout: () => void;
}

const MEAL_MODE_LABEL: Record<MealMode, string> = {
  'ala-carte': 'Ala Carte',
  'mission-set': 'Mission Sets'
};

const SERVICE_LABEL: Record<LineItemServiceType, string> = {
  'DINE-IN': 'Having Here',
  'TAKE-AWAY': 'Take Away'
};

const Detail: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <p className="text-[11px] text-teamax-secondary font-bold uppercase tracking-wider">
    {label}: <span className="text-teamax-gold normal-case tracking-normal">{children}</span>
  </p>
);

const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onCheckout
}) => {
  // Close on Escape and keep the page behind the modal from scrolling
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-modal-title"
    >
      <div
        className="rounded-t-3xl sm:rounded-2xl overflow-hidden relative bg-teamax-surface w-full sm:max-w-lg max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh] flex flex-col border border-teamax-gold/40 shadow-gold-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-teamax-gold/30 shrink-0">
          <h2 id="cart-modal-title" className="text-xl sm:text-2xl font-display font-bold text-teamax-gold tracking-[0.12em] flex items-center gap-3">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
            {itemCount > 0 && (
              <span className="text-xs font-sans tracking-normal text-teamax-secondary">({itemCount})</span>
            )}
          </h2>
          <div className="flex items-center gap-4">
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 transition-colors font-bold uppercase tracking-widest text-[10px]"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-teamax-secondary hover:text-teamax-gold transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center px-6 py-14">
            <div className="text-6xl mb-5">🛒</div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-teamax-gold mb-3">Dossier Empty</p>
            <h3 className="text-2xl font-display font-bold text-teamax-gold tracking-[0.12em] mb-2">Your cart is empty</h3>
            <p className="text-sm text-teamax-secondary mb-8 max-w-xs mx-auto">Add a classified selection from the menu to begin your mission.</p>
            <button onClick={onClose} className="mission-btn px-10 py-4 text-xs">
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <ul className="flex-1 overflow-y-auto overscroll-contain divide-y divide-teamax-gold/15">
              {cartItems.map(item => (
                <li key={item.id} className="px-5 sm:px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-display font-bold text-teamax-gold leading-snug">{item.name}</h3>
                      <div className="space-y-0.5 mt-1.5">
                        {item.mealMode && <Detail label="Meal Mode">{MEAL_MODE_LABEL[item.mealMode]}</Detail>}
                        {item.selectedVariation && <Detail label="Variation">{item.selectedVariation.name}</Detail>}
                        {item.selectedDrinkUpgrade && (
                          <Detail label="Set Drink">
                            {item.selectedDrinkUpgrade.name} · +₱{item.selectedDrinkUpgrade.price.toFixed(2)}
                          </Detail>
                        )}
                        {item.selectedFlavor && <Detail label="Flavor">{item.selectedFlavor}</Detail>}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <Detail label="Add-ons">
                            {item.selectedAddOns.map(addOn =>
                              addOn.quantity && addOn.quantity > 1
                                ? `${addOn.name} (x${addOn.quantity})`
                                : addOn.name
                            ).join(', ')}
                          </Detail>
                        )}
                        {item.serviceType && <Detail label="Service">{SERVICE_LABEL[item.serviceType]}</Detail>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 -mr-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3">
                    <div className="rounded-xl flex items-center gap-2 bg-black p-1 border border-teamax-gold/40">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-lg p-1.5 hover:bg-teamax-gold hover:text-black text-teamax-gold"
                        title="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-bold text-teamax-primary min-w-[28px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-lg p-1.5 hover:bg-teamax-gold hover:text-black text-teamax-gold"
                        title="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teamax-gold tabular-nums">
                        ₱{((item.totalPrice || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-teamax-secondary">₱{(item.totalPrice || 0).toFixed(2)} each</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-teamax-gold/30 px-5 sm:px-6 py-4 shrink-0 bg-teamax-surface">
              <div className="flex items-center justify-between text-2xl font-display font-bold text-teamax-gold mb-4">
                <span>Total</span>
                <span className="tabular-nums">₱{(getTotalPrice() || 0).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="mission-btn-outline py-4 text-[10px]"
                >
                  Add More
                </button>
                <button
                  onClick={onCheckout}
                  className="mission-btn py-4 text-[10px]"
                >
                  Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default memo(Cart);
