import React, { memo } from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-20 mission-card">
          <div className="text-7xl mb-6">🛒</div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-teamax-gold mb-3">Dossier Empty</p>
          <h2 className="text-3xl font-display font-bold text-teamax-gold tracking-[0.12em] mb-2">Your cart is empty</h2>
          <p className="text-teamax-secondary mb-10 max-w-sm mx-auto">Add a classified selection from the menu to begin your mission.</p>
          <button
            onClick={onContinueShopping}
            className="mission-btn px-10 py-4"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={onContinueShopping}
          className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-all group"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-bold uppercase tracking-widest text-xs">Back to Menu</span>
        </button>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-teamax-gold tracking-[0.12em]">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-400 hover:text-red-300 transition-colors font-bold uppercase tracking-widest text-xs"
        >
          Clear All
        </button>
      </div>

      <div className="mission-card overflow-hidden mb-8">
        {cartItems.map((item, index) => (
          <div key={item.id} className={`p-8 ${index !== cartItems.length - 1 ? 'border-b border-teamax-gold/20' : ''} hover:bg-white/5 transition-colors`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-display font-bold text-teamax-gold mb-2">{item.name}</h3>
                <div className="space-y-1">
                  {item.selectedVariation && (
                    <p className="text-xs text-teamax-secondary font-bold uppercase tracking-wider">Variation: <span className="text-teamax-gold">{item.selectedVariation.name}</span></p>
                  )}
                  {item.selectedFlavor && (
                    <p className="text-xs text-teamax-secondary font-bold uppercase tracking-wider">Flavor: <span className="text-teamax-gold">{item.selectedFlavor}</span></p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-xs text-teamax-secondary font-bold uppercase tracking-wider">
                      Add-ons: <span className="text-teamax-gold">{item.selectedAddOns.map(addOn =>
                        addOn.quantity && addOn.quantity > 1
                          ? `${addOn.name} (x${addOn.quantity})`
                          : addOn.name
                      ).join(', ')}</span>
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-teamax-gold mt-3">₱{(item.totalPrice || 0).toFixed(2)}</p>
              </div>

              <div className="flex items-center justify-between md:justify-end space-x-6">
                <div className="flex items-center space-x-4 bg-black p-1.5 border border-teamax-gold/40">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-teamax-gold hover:text-black text-teamax-gold"
                    title="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-teamax-primary min-w-[32px] text-center text-lg">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-teamax-gold hover:text-black text-teamax-gold"
                    title="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right min-w-[100px]">
                  <p className="text-xl font-bold text-teamax-gold">₱{((item.totalPrice || 0) * (item.quantity || 0)).toFixed(2)}</p>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Remove item"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mission-card p-8">
        <div className="flex items-center justify-between text-3xl font-display font-bold text-teamax-gold mb-8">
          <span>Total:</span>
          <span>₱{(getTotalPrice() || 0).toFixed(2)}</span>
        </div>

        <button
          onClick={onCheckout}
          className="mission-btn w-full py-5 text-lg"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default memo(Cart);
