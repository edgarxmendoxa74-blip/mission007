import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface FloatingCartButtonProps {
  itemCount: number;
  onCartClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ itemCount, onCartClick }) => {
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onCartClick}
      className="fixed bottom-6 right-6 bg-teamax-gold text-black border border-teamax-gold p-4 rounded-full shadow-gold hover:brightness-110 active:scale-95 transition-all duration-300 transform hover:scale-110 z-40 md:hidden"
      aria-label="Open cart"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-3 -right-3 bg-black text-teamax-gold border border-teamax-gold text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {itemCount}
        </span>
      </div>
    </button>
  );
};

export default FloatingCartButton;
