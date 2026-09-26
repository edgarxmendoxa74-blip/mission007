import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Coffee, TrendingUp, Package, Users, Lock, FolderOpen, CreditCard, Settings, CheckCircle2, BarChart3, Calculator } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';
import { addOnCategories } from '../data/menuData';
import { useMenu } from '../hooks/useMenu';
import { useCategories } from '../hooks/useCategories';
import { BRAND } from '../brand';

import ImageUpload from './ImageUpload';
import CategoryManager from './CategoryManager';
import PaymentMethodManager from './PaymentMethodManager';
import SiteSettingsManager from './SiteSettingsManager';
import OrderManager from './OrderManager';
import SalesAnalytics from './SalesAnalytics';
import PosTerminal from './PosTerminal';



// <input type="datetime-local"> only accepts "YYYY-MM-DDTHH:mm" in local time,
// while the database returns full ISO timestamps with a timezone.
const toDateTimeLocal = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDateTimeLocal = (value: string) => (value ? new Date(value).toISOString() : undefined);

const AdminDashboard: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const isAuthenticated = !!session;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);
  const { menuItems, loading, updateMenuItem, deleteMenuItem } = useMenu();
  const { categories } = useCategories();
  const [currentView, setCurrentView] = useState<'dashboard' | 'items' | 'edit' | 'categories' | 'payments' | 'settings' | 'orders' | 'analytics' | 'pos'>('dashboard');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    basePrice: 0,
    category: 'hot-coffee',
    popular: false,
    available: true,
    variations: [],
    addOns: []
  });

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setCurrentView('edit');
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        setIsProcessing(true);
        await deleteMenuItem(id);
      } catch (error) {
        alert('Failed to delete item. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSaveItem = async () => {
    const missing = [
      !formData.name?.trim() && 'Item Name',
      !(Number(formData.basePrice) > 0) && 'Base Price',
      !formData.category && 'Category',
      !formData.description?.trim() && 'Description'
    ].filter(Boolean);
    if (missing.length > 0) {
      alert(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    const cleaned: Partial<MenuItem> = {
      ...formData,
      name: formData.name!.trim(),
      description: formData.description!.trim(),
      variations: (formData.variations || []).filter(v => v.name.trim()),
      addOns: (formData.addOns || []).filter(a => a.name.trim()).map(a => ({ ...a, category: a.category.trim() || 'extras' })),
      flavors: (formData.flavors || []).map(f => f.trim()).filter(Boolean)
    };

    if (!editingItem) return;

    try {
      await updateMenuItem(editingItem.id, cleaned);

      // Show success notification
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      setCurrentView('items');
      setEditingItem(null);
    } catch (error) {
      alert('Failed to save item');
    }
  };

  const handleCancel = () => {
    setCurrentView(currentView === 'edit' ? 'items' : 'dashboard');
    setEditingItem(null);
    setSelectedItems([]);
  };

  const handleBulkRemove = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to delete');
      return;
    }

    const itemNames = selectedItems.map(id => {
      const item = menuItems.find(i => i.id === id);
      return item ? item.name : 'Unknown Item';
    }).slice(0, 5); // Show first 5 items

    const displayNames = itemNames.join(', ');
    const moreItems = selectedItems.length > 5 ? ` and ${selectedItems.length - 5} more items` : '';

    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?\n\nItems to delete: ${displayNames}${moreItems}\n\nThis action cannot be undone.`)) {
      try {
        setIsProcessing(true);
        // Delete items one by one
        for (const itemId of selectedItems) {
          await deleteMenuItem(itemId);
        }
        setSelectedItems([]);
        setShowBulkActions(false);
        alert(`Successfully deleted ${selectedItems.length} item(s).`);
      } catch (error) {
        alert('Failed to delete some items. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };
  const handleBulkCategoryChange = async (newCategoryId: string) => {
    if (selectedItems.length === 0) {
      alert('Please select items to update');
      return;
    }

    const categoryName = categories.find(cat => cat.id === newCategoryId)?.name;
    if (confirm(`Are you sure you want to change the category of ${selectedItems.length} item(s) to "${categoryName}"?`)) {
      try {
        setIsProcessing(true);
        // Update category for each selected item
        for (const itemId of selectedItems) {
          const item = menuItems.find(i => i.id === itemId);
          if (item) {
            await updateMenuItem(itemId, { ...item, category: newCategoryId });
          }
        }
        setSelectedItems([]);
        setShowBulkActions(false);
        alert(`Successfully updated category for ${selectedItems.length} item(s)`);
      } catch (error) {
        alert('Failed to update some items');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const addVariation = () => {
    const newVariation: Variation = {
      id: `var-${Date.now()}`,
      name: '',
      price: 0
    };
    setFormData({
      ...formData,
      variations: [...(formData.variations || []), newVariation]
    });
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | number) => {
    const updatedVariations = [...(formData.variations || [])];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setFormData({ ...formData, variations: updatedVariations });
  };

  const removeVariation = (index: number) => {
    const updatedVariations = formData.variations?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, variations: updatedVariations });
  };

  const addFlavor = () => {
    setFormData({
      ...formData,
      flavors: [...(formData.flavors || []), '']
    });
  };

  const updateFlavor = (index: number, value: string) => {
    const updatedFlavors = [...(formData.flavors || [])];
    updatedFlavors[index] = value;
    setFormData({ ...formData, flavors: updatedFlavors });
  };

  const removeFlavor = (index: number) => {
    const updatedFlavors = (formData.flavors || []).filter((_, i) => i !== index);
    setFormData({ ...formData, flavors: updatedFlavors });
  };

  const addAddOn = () => {
    const newAddOn: AddOn = {
      id: `addon-${Date.now()}`,
      name: '',
      price: 0,
      category: 'extras'
    };
    setFormData({
      ...formData,
      addOns: [...(formData.addOns || []), newAddOn]
    });
  };

  const updateAddOn = (index: number, field: keyof AddOn, value: string | number) => {
    const updatedAddOns = [...(formData.addOns || [])];
    updatedAddOns[index] = { ...updatedAddOns[index], [field]: value };
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  const removeAddOn = (index: number) => {
    const updatedAddOns = formData.addOns?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  // Dashboard Stats
  const totalItems = menuItems.length;
  const popularItems = menuItems.filter(item => item.popular).length;
  const availableItems = menuItems.filter(item => item.available).length;
  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: menuItems.filter(item => item.category === cat.id).length
  }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSigningIn(false);
    if (error) {
      setLoginError('Invalid email or password.');
    } else {
      setPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPassword('');
    setCurrentView('dashboard');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-teamax-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teamax-gold"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center app-bg">
        <div className="mission-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/mission-007-logo.png" alt="Mission 007" className="mx-auto w-28 h-28 object-contain mb-4" />
            <div className="mx-auto w-12 h-12 border border-teamax-gold rounded-full flex items-center justify-center mb-4">
              <Lock className="h-5 w-5 text-teamax-gold" />
            </div>
            <h1 className="text-2xl font-display font-bold text-teamax-gold tracking-[0.2em]">MISSION 007</h1>
            <p className="text-teamax-secondary mt-2 uppercase tracking-widest text-xs">Admin Access</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-xs font-bold text-teamax-gold uppercase tracking-widest mb-2 px-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mission-input"
                placeholder="Enter admin email"
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-teamax-gold uppercase tracking-widest mb-2 px-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mission-input"
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
              {loginError && (
                <p className="text-red-500 text-sm mt-2">{loginError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="mission-btn w-full py-4 text-xs disabled:opacity-60"
            >
              {signingIn ? 'Signing In...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-teamax-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teamax-gold mx-auto mb-4"></div>
          <p className="text-teamax-gold font-display tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'analytics' || currentView === 'pos') {
    return (
      <div className="min-h-screen bg-teamax-dark app-bg">
        <div className="bg-black shadow-sm border-b border-teamax-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4 min-w-0">
                <img src={BRAND.logo} alt="Mission 007" className="w-10 h-10 object-contain hidden sm:block" />
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Dashboard</span>
                </button>
                <h1 className="text-lg sm:text-xl font-display font-bold text-teamax-gold tracking-[0.08em] truncate">
                  {currentView === 'analytics' ? 'Sales Analytics' : 'POS · Manual Entry'}
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          {currentView === 'analytics' ? <SalesAnalytics /> : <PosTerminal />}
        </div>
      </div>
    );
  }

  if (currentView === 'orders') {
    return (
      <div className="min-h-screen bg-teamax-dark app-bg">
        <div className="bg-black shadow-sm border-b border-teamax-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <img src={BRAND.logo} alt="Mission 007" className="w-10 h-10 object-contain" />
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Dashboard</span>
                </button>
                <h1 className="text-xl font-display font-bold text-teamax-gold tracking-[0.08em]">Order Management</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <OrderManager />
        </div>
      </div>
    );
  }

  // Form View (Edit)
  if (currentView === 'edit') {
    const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2';
    const sectionTitleClass = 'text-base sm:text-lg font-display font-bold text-teamax-gold tracking-[0.1em] flex items-center gap-3';
    const checkboxClass = 'rounded w-5 h-5 border-2 border-teamax-gold/40 text-teamax-gold focus:ring-teamax-gold bg-black cursor-pointer accent-[#D4AF37]';
    const removeBtnClass = 'p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 rounded-xl transition-colors duration-200 flex items-center justify-center';
    // Existing items may use add-on categories (e.g. "Sides") that aren't in the default list
    const addOnCategoryOptions = [...new Set([
      ...addOnCategories.map(c => c.id),
      ...menuItems.flatMap(i => (i.addOns || []).map(a => a.category)),
      ...(formData.addOns || []).map(a => a.category)
    ].filter(Boolean))];

    const saveButtons = (
      <>
        <button
          onClick={handleCancel}
          className="flex-1 sm:flex-none px-5 py-3 sm:py-2 border border-teamax-gold/30 hover:bg-teamax-gold/10 transition-colors duration-200 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] text-teamax-gold rounded-xl"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
        <button
          onClick={handleSaveItem}
          className="flex-1 sm:flex-none mission-btn px-5 py-3 sm:py-2 flex items-center justify-center gap-2 text-[10px] shadow-gold"
        >
          <Save className="h-4 w-4" />
          <span>Save Item</span>
        </button>
      </>
    );

    return (
      <div className="min-h-screen bg-teamax-dark app-bg">
        <div className="bg-black shadow-sm border-b border-teamax-gold/30 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 py-3 sm:h-16 sm:py-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <img src={BRAND.logo} alt="Mission 007" className="w-10 h-10 object-contain hidden sm:block" />
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200 flex-shrink-0"
                  title="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-[10px] hidden sm:inline">Back</span>
                </button>
                <h1 className="text-lg sm:text-xl font-display font-bold text-teamax-gold tracking-[0.08em] truncate">
                  Edit Item
                </h1>
              </div>
              <div className="hidden sm:flex gap-3">{saveButtons}</div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <div className="mission-card p-5 sm:p-8 space-y-8">
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label htmlFor="item-name" className={labelClass}>Item Name *</label>
                <input
                  id="item-name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mission-input"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label htmlFor="item-price" className={labelClass}>Base Price (₱) *</label>
                <input
                  id="item-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={formData.basePrice ?? ''}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="mission-input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="item-category" className={labelClass}>Category *</label>
                <select
                  id="item-category"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mission-input"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-teamax-dark">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="item-description" className={labelClass}>Description *</label>
                <textarea
                  id="item-description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mission-input"
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="rounded-xl flex items-center gap-3 p-4 bg-black border border-teamax-gold/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.popular || false}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className={checkboxClass}
                  />
                  <span className="text-xs font-bold uppercase tracking-widest text-teamax-secondary">Mark as Popular</span>
                </label>
                <label className="rounded-xl flex items-center gap-3 p-4 bg-black border border-teamax-gold/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available ?? true}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className={checkboxClass}
                  />
                  <span className="text-xs font-bold uppercase tracking-widest text-teamax-secondary">Available for Order</span>
                </label>
              </div>
            </div>

            {/* Image */}
            <div className="border-t border-teamax-gold/20 pt-8">
              <ImageUpload
                currentImage={formData.image}
                onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, image: imageUrl }))}
              />
            </div>

            {/* Discount Pricing Section */}
            <div className="border-t border-teamax-gold/20 pt-8">
              <h3 className={`${sectionTitleClass} mb-5`}>
                <div className="w-1 h-5 bg-teamax-gold"></div>
                Discount Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="item-discount-price" className={labelClass}>Discount Price (₱)</label>
                  <input
                    id="item-discount-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={formData.discountPrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) || undefined })}
                    className="mission-input"
                    placeholder="Enter discount price"
                  />
                </div>

                <label className="rounded-xl flex items-center gap-3 p-4 bg-black border border-teamax-gold/20 cursor-pointer md:self-end">
                  <input
                    type="checkbox"
                    checked={formData.discountActive || false}
                    onChange={(e) => setFormData({ ...formData, discountActive: e.target.checked })}
                    className={checkboxClass}
                  />
                  <span className="text-xs font-bold uppercase tracking-widest text-teamax-secondary">Enable Discount</span>
                </label>

                <div>
                  <label htmlFor="item-discount-start" className={labelClass}>Discount Start Date</label>
                  <input
                    id="item-discount-start"
                    type="datetime-local"
                    value={toDateTimeLocal(formData.discountStartDate)}
                    onChange={(e) => setFormData({ ...formData, discountStartDate: fromDateTimeLocal(e.target.value) })}
                    className="mission-input"
                  />
                </div>

                <div>
                  <label htmlFor="item-discount-end" className={labelClass}>Discount End Date</label>
                  <input
                    id="item-discount-end"
                    type="datetime-local"
                    value={toDateTimeLocal(formData.discountEndDate)}
                    onChange={(e) => setFormData({ ...formData, discountEndDate: fromDateTimeLocal(e.target.value) })}
                    className="mission-input"
                  />
                </div>
              </div>
              <p className="text-xs text-teamax-secondary mt-3">
                Leave dates empty for an indefinite discount. The discount only applies when "Enable Discount" is checked and the current time is within the date range.
              </p>
            </div>

            {/* Variations Section */}
            <div className="border-t border-teamax-gold/20 pt-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className={sectionTitleClass}>
                  <div className="w-1 h-5 bg-teamax-gold"></div>
                  Variations
                </h3>
                <button
                  onClick={addVariation}
                  className="mission-btn-outline px-3 py-2 flex items-center gap-2 text-[10px] flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add<span className="hidden sm:inline"> Variation</span></span>
                </button>
              </div>

              {(!formData.variations || formData.variations.length === 0) && (
                <p className="text-xs text-teamax-secondary italic">No variations. The base price will be used.</p>
              )}

              <div className="space-y-3">
                {formData.variations?.map((variation, index) => (
                  <div key={variation.id} className="rounded-xl grid grid-cols-[1fr_7rem_auto] gap-2 sm:gap-3 p-3 sm:p-4 bg-black border border-teamax-gold/20">
                    <input
                      type="text"
                      value={variation.name}
                      onChange={(e) => updateVariation(index, 'name', e.target.value)}
                      className="mission-input min-w-0"
                      placeholder="Name (e.g., Large)"
                      aria-label="Variation name"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={variation.price}
                      onChange={(e) => updateVariation(index, 'price', Number(e.target.value))}
                      className="mission-input"
                      placeholder="₱ Price"
                      aria-label="Variation price"
                    />
                    <button onClick={() => removeVariation(index)} className={removeBtnClass} title="Remove Variation">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Flavors Section */}
            <div className="border-t border-teamax-gold/20 pt-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className={sectionTitleClass}>
                  <div className="w-1 h-5 bg-teamax-gold"></div>
                  Flavors <span className="text-xs text-teamax-secondary normal-case tracking-normal font-sans">(optional)</span>
                </h3>
                <button
                  onClick={addFlavor}
                  className="mission-btn-outline px-3 py-2 flex items-center gap-2 text-[10px] flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add<span className="hidden sm:inline"> Flavor</span></span>
                </button>
              </div>

              {(!formData.flavors || formData.flavors.length === 0) && (
                <p className="text-xs text-teamax-secondary italic">No flavors added yet.</p>
              )}

              <div className="space-y-3">
                {formData.flavors?.map((flavor, index) => (
                  <div key={index} className="rounded-xl grid grid-cols-[1fr_auto] gap-2 sm:gap-3 p-3 sm:p-4 bg-black border border-teamax-gold/20">
                    <input
                      type="text"
                      value={flavor}
                      onChange={(e) => updateFlavor(index, e.target.value)}
                      className="mission-input min-w-0"
                      placeholder="Flavor (e.g., Chocolate)"
                      aria-label="Flavor name"
                    />
                    <button onClick={() => removeFlavor(index)} className={removeBtnClass} title="Remove Flavor">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add-ons Section */}
            <div className="border-t border-teamax-gold/20 pt-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className={sectionTitleClass}>
                  <div className="w-1 h-5 bg-teamax-gold"></div>
                  Add-ons
                </h3>
                <button
                  onClick={addAddOn}
                  className="mission-btn-outline px-3 py-2 flex items-center gap-2 text-[10px] flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add<span className="hidden sm:inline"> Add-on</span></span>
                </button>
              </div>

              {(!formData.addOns || formData.addOns.length === 0) && (
                <p className="text-xs text-teamax-secondary italic">No add-ons added yet.</p>
              )}

              <datalist id="addon-category-options">
                {addOnCategoryOptions.map(c => <option key={c} value={c} />)}
              </datalist>

              <div className="space-y-3">
                {formData.addOns?.map((addOn, index) => (
                  <div key={addOn.id} className="rounded-xl grid grid-cols-[1fr_7rem_auto] sm:grid-cols-[1fr_10rem_7rem_auto] gap-2 sm:gap-3 p-3 sm:p-4 bg-black border border-teamax-gold/20">
                    <input
                      type="text"
                      value={addOn.name}
                      onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                      className="mission-input min-w-0 col-span-3 sm:col-span-1"
                      placeholder="Add-on name"
                      aria-label="Add-on name"
                    />
                    <input
                      type="text"
                      list="addon-category-options"
                      value={addOn.category}
                      onChange={(e) => updateAddOn(index, 'category', e.target.value)}
                      className="mission-input min-w-0"
                      placeholder="Group (e.g., Sides)"
                      aria-label="Add-on group"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={addOn.price}
                      onChange={(e) => updateAddOn(index, 'price', Number(e.target.value))}
                      className="mission-input"
                      placeholder="₱ Price"
                      aria-label="Add-on price"
                    />
                    <button onClick={() => removeAddOn(index)} className={removeBtnClass} title="Remove Add-on">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom actions so the form can be saved without scrolling back up */}
            <div className="border-t border-teamax-gold/20 pt-6 flex gap-3 sm:justify-end">
              {saveButtons}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Items List View
  if (currentView === 'items') {
    // Filter items based on search term
    const filteredItems = menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group items by category
    const groupedItems = (categories || []).reduce((acc, cat) => {
      const itemsInCat = filteredItems.filter(item => item.category === cat.id);
      if (itemsInCat.length > 0) {
        acc[cat.id] = itemsInCat;
      }
      return acc;
    }, {} as Record<string, MenuItem[]>);

    return (
      <div className="min-h-screen bg-teamax-dark app-bg">
        <div className="bg-black shadow-sm border-b border-teamax-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
              <div className="flex items-center space-x-4">
                <img src={BRAND.logo} alt="Mission 007" className="w-10 h-10 object-contain" />
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Dashboard</span>
                </button>
                <h1 className="text-xl font-display font-bold text-teamax-gold tracking-[0.08em]">Menu Items</h1>
              </div>

              {/* Enhanced Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Coffee className="h-4 w-4 text-teamax-gold/50 rotate-12" />
                </div>
                <input
                  type="text"
                  placeholder="Search dishes or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-black border border-teamax-gold/30 text-teamax-primary placeholder:text-teamax-secondary/50 focus:ring-2 focus:ring-teamax-gold focus:border-teamax-gold transition-all outline-none text-sm font-medium rounded-xl"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-teamax-secondary hover:text-teamax-gold transition-colors"
                    title="Clear Search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {showBulkActions && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold">
                      {selectedItems.length} selected
                    </span>
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="px-4 py-2 border border-teamax-gold/30 text-teamax-gold hover:bg-teamax-gold hover:text-black transition-all duration-200 font-bold uppercase tracking-widest text-[10px] rounded-xl"
                    >
                      Bulk Actions
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Bulk Actions Panel */}
          {showBulkActions && selectedItems.length > 0 && (
            <div className="mission-card p-6 mb-6 border-l-4 border-teamax-gold rounded-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-teamax-gold tracking-[0.08em] mb-1">Bulk Actions</h3>
                  <p className="text-sm text-teamax-secondary">{selectedItems.length} item(s) selected</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-teamax-gold">Change Category:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkCategoryChange(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="mission-input py-2"
                      disabled={isProcessing}
                      title="Bulk Category Change"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-teamax-dark">{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleBulkRemove}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isProcessing ? 'Removing...' : 'Remove Selected'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedItems([]);
                      setShowBulkActions(false);
                    }}
                    className="flex items-center space-x-2 bg-teamax-surface text-teamax-secondary border border-teamax-gold/20 px-4 py-2 hover:bg-teamax-gold/10 hover:text-teamax-gold transition-colors text-xs font-bold uppercase tracking-widest rounded-xl"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Selection</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-12">
            {Object.keys(groupedItems).length === 0 ? (
              <div className="mission-card p-12 text-center rounded-xl">
                <div className="bg-black w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-teamax-gold/30 rounded-xl">
                  <Package className="h-10 w-10 text-teamax-gold/30" />
                </div>
                <h3 className="text-xl font-display font-bold text-teamax-gold tracking-[0.08em]">No dishes found</h3>
                <p className="text-teamax-secondary/70 mt-2">Try adjusting your search term</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-6 text-xs font-bold uppercase tracking-widest text-teamax-gold hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              categories.map(category => {
                const items = groupedItems[category.id];
                if (!items) return null;

                return (
                  <div key={category.id} className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6 px-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl bg-teamax-surface p-2.5 border border-teamax-gold/30 shadow-gold rounded-xl">{category.icon}</span>
                        <div>
                          <h2 className="text-2xl font-display font-bold text-teamax-gold tracking-[0.05em] leading-none">{category.name}</h2>
                          <p className="text-[10px] font-bold text-teamax-secondary uppercase tracking-widest mt-1.5">{items.length} dishes in this category</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const itemIds = items.map(i => i.id);
                          const allSelected = itemIds.every(id => selectedItems.includes(id));
                          if (allSelected) {
                            setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)));
                          } else {
                            setSelectedItems(prev => [...new Set([...prev, ...itemIds])]);
                          }
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold hover:bg-teamax-gold/10 px-4 py-2 rounded-xl border border-teamax-gold/30 transition-all"
                      >
                        {items.every(item => selectedItems.includes(item.id)) ? 'Deselect All' : 'Select Category'}
                      </button>
                    </div>

                    <div className="mission-card overflow-hidden rounded-xl">
                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-black border-b border-teamax-gold/20">
                            <tr>
                              <th className="px-8 py-5 text-[10px] font-bold text-teamax-gold uppercase tracking-widest">Select</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-teamax-gold uppercase tracking-widest">Product</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-teamax-gold uppercase tracking-widest">Price</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-teamax-gold uppercase tracking-widest">Status</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-teamax-gold uppercase tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-teamax-gold/10">
                            {items.map((item) => (
                              <tr key={item.id} className="hover:bg-teamax-gold/5 transition-colors group">
                                <td className="px-8 py-6">
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => handleSelectItem(item.id)}
                                    className="w-5 h-5 rounded-lg border-2 border-teamax-gold/40 text-teamax-gold focus:ring-teamax-gold bg-black transition-all cursor-pointer"
                                    title={`Select ${item.name}`}
                                  />
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 overflow-hidden bg-black border border-teamax-gold/30 flex-shrink-0 rounded-xl">
                                      {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-30 group-hover:scale-110 transition-transform">☕</div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-teamax-primary text-base truncate">{item.name}</div>
                                      <div className="text-xs text-teamax-secondary line-clamp-1 mt-0.5">{item.description}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col">
                                    {item.isOnDiscount && item.discountPrice ? (
                                      <>
                                        <span className="text-teamax-gold font-bold text-base">₱{(item.discountPrice || 0).toFixed(2)}</span>
                                        <span className="text-teamax-secondary/30 line-through text-[10px] font-bold">₱{(item.basePrice || 0).toFixed(2)}</span>
                                      </>
                                    ) : (
                                      <span className="text-teamax-gold font-bold text-base">₱{(item.basePrice || 0).toFixed(2)}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col gap-1.5">
                                    {item.popular && (
                                      <span className="w-fit text-[9px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-xl border border-orange-500/30">Popular</span>
                                    )}
                                    <span className={`w-fit text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-xl border ${item.available
                                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                      : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                      {item.available ? 'Active' : 'Sold Out'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => handleEditItem(item)}
                                      className="p-2.5 text-teamax-gold hover:bg-teamax-gold hover:text-black rounded-xl transition-all border border-teamax-gold/30"
                                      title="Edit Item"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="p-2.5 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/30"
                                      title="Delete Item"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile View */}
                      <div className="md:hidden divide-y divide-teamax-gold/10">
                        {items.map((item) => (
                          <div key={item.id} className={`p-6 ${selectedItems.includes(item.id) ? 'bg-teamax-gold/5' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => handleSelectItem(item.id)}
                                  className="w-5 h-5 rounded-lg border-2 border-teamax-gold/40 text-teamax-gold focus:ring-teamax-gold bg-black"
                                  title={`Select ${item.name}`}
                                />
                                <div className="w-12 h-12 overflow-hidden bg-black border border-teamax-gold/30 rounded-xl">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl opacity-30">☕</div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-bold text-teamax-primary text-sm">{item.name}</h3>
                                  <p className="text-[10px] text-teamax-secondary">₱{(item.basePrice || 0).toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditItem(item)} className="p-2 text-teamax-gold hover:bg-teamax-gold hover:text-black rounded-xl transition-all border border-teamax-gold/30" title="Edit Item"><Edit className="h-4 w-4" /></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/30" title="Delete Item"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // Categories View
  if (currentView === 'categories') {
    return <CategoryManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Payment Methods View
  if (currentView === 'payments') {
    return <PaymentMethodManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Site Settings View
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-black app-bg">
        <div className="bg-black shadow-sm border-b border-teamax-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <img src={BRAND.logo} alt="Mission 007" className="w-10 h-10 object-contain" />
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="uppercase tracking-widest text-[10px] font-bold">Dashboard</span>
                </button>
                <h1 className="text-2xl font-display font-semibold text-teamax-gold tracking-[0.08em]">Site Settings</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <SiteSettingsManager />
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-teamax-dark app-bg">
      <div className="bg-black shadow-sm border-b border-teamax-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src={BRAND.logo} alt="Mission 007" className="w-10 h-10 object-contain" />
              <h1 className="text-xl font-display font-bold text-teamax-gold tracking-[0.18em]">MISSION 007 ADMIN</h1>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="/"
                className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
              >
                View Website
              </a>
              <button
                onClick={handleLogout}
                className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="mission-card p-6">
            <div className="flex items-center">
              <div className="rounded-xl p-3 bg-teamax-gold/10 border border-teamax-gold/30">
                <Package className="h-6 w-6 text-teamax-gold" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary">Total Items</p>
                <p className="text-2xl font-bold text-teamax-gold">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="mission-card p-6">
            <div className="flex items-center">
              <div className="rounded-xl p-3 bg-teamax-gold/10 border border-teamax-gold/30">
                <TrendingUp className="h-6 w-6 text-teamax-gold" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary">Available</p>
                <p className="text-2xl font-bold text-teamax-gold">{availableItems}</p>
              </div>
            </div>
          </div>

          <div className="mission-card p-6">
            <div className="flex items-center">
              <div className="rounded-xl p-3 bg-teamax-gold/10 border border-teamax-gold/30">
                <Coffee className="h-6 w-6 text-teamax-gold" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary">Popular</p>
                <p className="text-2xl font-bold text-teamax-gold">{popularItems}</p>
              </div>
            </div>
          </div>

          <div className="mission-card p-6">
            <div className="flex items-center">
              <div className="rounded-xl p-3 bg-teamax-gold/10 border border-teamax-gold/30">
                <Users className="h-6 w-6 text-teamax-gold" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary">Status</p>
                <p className="text-2xl font-bold text-teamax-gold">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 mission-card p-8">
            <h3 className="text-lg font-display font-bold text-teamax-gold mb-8 flex items-center gap-3 tracking-[0.12em]">
              <div className="w-1.5 h-6 bg-teamax-gold"></div>
              Quick Management
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentView('items')}
                className="rounded-xl group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="rounded-xl p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Manage Menu</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Edit & Update All</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('categories')}
                className="rounded-xl group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="rounded-xl p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Categories</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Organize Menu</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('orders')}
                className="rounded-xl group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="rounded-xl p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Manage Orders</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">View & Process Orders</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('pos')}
                className="rounded-xl group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="rounded-xl p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">POS</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Manual Order Entry</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('analytics')}
                className="rounded-xl group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="rounded-xl p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Analytics</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Sales & Best Sellers</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('payments')}
                className="rounded-xl group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="rounded-xl p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Payments</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Payout Methods</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('settings')}
                className="rounded-xl group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300 sm:col-span-2"
              >
                <div className="rounded-xl p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">System Settings</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Store & UI Configuration</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mission-card p-8">
            <h3 className="text-lg font-display font-bold text-teamax-gold mb-8 flex items-center gap-3 tracking-[0.12em]">
              <div className="w-1.5 h-6 bg-teamax-gold"></div>
              Categories
            </h3>
            <div className="space-y-4">
              {categoryCounts.map((category) => (
                <div key={category.id} className="rounded-xl flex items-center justify-between p-4 bg-black border border-teamax-gold/20">
                  <div className="flex items-center space-x-3">
                    <span className="rounded-xl text-xl bg-black p-2 border border-teamax-gold/30">{category.icon}</span>
                    <span className="font-bold text-teamax-gold text-sm">{category.name}</span>
                  </div>
                  <span className="rounded-xl text-[10px] font-bold uppercase tracking-widest text-teamax-secondary border border-teamax-gold/30 px-2 py-1">
                    {category.count} items
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Success Popup */}
      {showSaveSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce-gentle">
          <div className="bg-black text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md">
            <div className="bg-green-500 rounded-full p-1">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs">Changes Saved Successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
