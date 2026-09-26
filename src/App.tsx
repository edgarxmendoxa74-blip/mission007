import React, { useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCart } from './hooks/useCart';
import Header from './components/Header';
import Hero from './components/Hero';
import SubNav from './components/SubNav';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import FloatingCartButton from './components/FloatingCartButton';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import { useStorefrontMenu } from './hooks/useStorefrontMenu';

function MainApp() {
  const cart = useCart();
  const storefrontMenu = useStorefrontMenu();
  const [currentView, setCurrentView] = React.useState<'menu' | 'checkout'>('menu');
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const handleViewChange = (view: 'menu' | 'checkout') => {
    setCurrentView(view);
    window.scrollTo({ top: 0 });
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const totalItemsCount = useMemo(() => cart.getTotalItems(), [cart.cartItems]);

  const filteredMenuItems = useMemo(() => {
    return selectedCategory === 'all'
      ? storefrontMenu
      : storefrontMenu.filter(item => item.category === selectedCategory);
  }, [selectedCategory, storefrontMenu]);

  return (
    <div className="min-h-screen font-sans app-bg">
      <Header
        cartItemsCount={totalItemsCount}
        onCartClick={openCart}
      />
      <SubNav selectedCategory={selectedCategory} onCategoryClick={handleCategoryClick} />

      {currentView === 'menu' && (
        <>
          <Hero />
          <Menu
            menuItems={filteredMenuItems}
            addToCart={cart.addToCart}
            cartItems={cart.cartItems}
            updateQuantity={cart.updateQuantity}
          />
        </>
      )}

      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        cartItems={cart.cartItems}
        updateQuantity={cart.updateQuantity}
        removeFromCart={cart.removeFromCart}
        clearCart={cart.clearCart}
        getTotalPrice={cart.getTotalPrice}
        onCheckout={() => {
          setIsCartOpen(false);
          handleViewChange('checkout');
        }}
      />

      {currentView === 'checkout' && (
        <Checkout
          cartItems={cart.cartItems}
          totalPrice={cart.getTotalPrice()}
          onBack={() => {
            handleViewChange('menu');
            setIsCartOpen(true);
          }}
          onSuccess={() => {
            cart.clearCart();
            handleViewChange('menu');
          }}
        />
      )}


      {currentView === 'menu' && (
        <FloatingCartButton
          itemCount={totalItemsCount}
          onCartClick={openCart}
        />
      )}

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
