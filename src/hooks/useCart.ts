import { useState, useCallback } from 'react';
import { CartItem, MenuItem, Variation, AddOn } from '../types';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const calculateItemPrice = (item: MenuItem, variation?: Variation, addOns?: AddOn[]) => {
    // If a variation is selected, its price replaces the base price
    let price = variation ? variation.price : (item.effectivePrice || item.basePrice);

    // Apply discount if active on the base item
    if (item.isOnDiscount && item.discountPrice && item.basePrice > 0) {
      const discountAmount = item.basePrice - item.discountPrice;
      price = Math.max(0, price - discountAmount);
    }

    if (addOns) {
      addOns.forEach(addOn => {
        price += addOn.price;
      });
    }
    return price;
  };

  const addToCart = useCallback((item: MenuItem, quantity: number = 1, variation?: Variation, addOns?: AddOn[], flavor?: string) => {
    const totalPrice = calculateItemPrice(item, variation, addOns);

    // Group add-ons by name and sum their quantities
    const groupedAddOns = (addOns || []).reduce((groups, addOn) => {
      const existing = groups.find(g => g.id === addOn.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        groups.push({ ...addOn, quantity: 1 });
      }
      return groups;
    }, [] as (AddOn & { quantity: number })[]);

    setCartItems(prev => {
      const existingItem = prev.find(cartItem =>
        cartItem.id === item.id &&
        cartItem.selectedVariation?.id === variation?.id &&
        cartItem.selectedFlavor === flavor &&
        JSON.stringify(cartItem.selectedAddOns?.map(a => `${a.id}-${a.quantity || 1}`).sort()) === JSON.stringify(groupedAddOns?.map(a => `${a.id}-${a.quantity}`).sort())
      );

      if (existingItem) {
        return prev.map(cartItem =>
          cartItem === existingItem
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        const isSimpleItem = !variation && (!groupedAddOns || groupedAddOns.length === 0) && !flavor;
        const uniqueId = isSimpleItem ? item.id : `${item.id}-${variation?.id || 'default'}-${flavor || 'none'}-${groupedAddOns?.map(a => a.id).join(',') || 'none'}-${Date.now()}`;
        return [...prev, {
          ...item,
          id: uniqueId,
          menuItemId: item.id,
          quantity,
          selectedVariation: variation,
          selectedFlavor: flavor,
          selectedAddOns: groupedAddOns || [],
          totalPrice
        }];
      }
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    return (cartItems || []).reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return (cartItems || []).reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return {
    cartItems,
    isCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    openCart,
    closeCart
  };
};