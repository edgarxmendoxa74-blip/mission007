import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Coffee, TrendingUp, Package, Users, Lock, FolderOpen, CreditCard, Settings, CheckCircle2 } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';
import { addOnCategories } from '../data/menuData';
import { useMenu } from '../hooks/useMenu';
import { useCategories } from '../hooks/useCategories';

import ImageUpload from './ImageUpload';
import CategoryManager from './CategoryManager';
import PaymentMethodManager from './PaymentMethodManager';
import SiteSettingsManager from './SiteSettingsManager';
import OrderManager from './OrderManager';



const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('teamax_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const { menuItems, loading, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu();
  const { categories } = useCategories();
  const [currentView, setCurrentView] = useState<'dashboard' | 'items' | 'add' | 'edit' | 'categories' | 'payments' | 'settings' | 'orders'>('dashboard');
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

  const handleAddItem = () => {
    setCurrentView('add');
    const defaultCategory = categories.length > 0 ? categories[0].id : 'milk-tea';
    setFormData({
      name: '',
      description: '',
      basePrice: 0,
      category: defaultCategory,
      popular: false,
      available: true,
      variations: [],
      addOns: []
    });
  };

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
    if (!formData.name || !formData.description || !formData.basePrice) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, formData);
      } else {
        await addMenuItem(formData as Omit<MenuItem, 'id'>);
      }

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
    setCurrentView(currentView === 'add' || currentView === 'edit' ? 'items' : 'dashboard');
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'TeaMax@Admin!2025') {
      setIsAuthenticated(true);
      localStorage.setItem('teamax_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('teamax_admin_auth');
    setPassword('');
    setCurrentView('dashboard');
  };

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
            <div className="mb-6">
              <label className="block text-xs font-bold text-teamax-gold uppercase tracking-widest mb-2 px-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mission-input"
                placeholder="Enter admin password"
                required
              />
              {loginError && (
                <p className="text-red-500 text-sm mt-2">{loginError}</p>
              )}
            </div>

            <button
              type="submit"
              className="mission-btn w-full py-4 text-xs"
            >
              Access Dashboard
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

  if (currentView === 'orders') {
    return (
      <div className="min-h-screen bg-teamax-dark">
        <div className="bg-black shadow-sm border-b border-teamax-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
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

  // Form View (Add/Edit)
  if (currentView === 'add' || currentView === 'edit') {

    return (
      <div className="min-h-screen bg-teamax-dark">
        <div className="bg-black shadow-sm border-b border-teamax-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Back</span>
                </button>
                <h1 className="text-xl font-serif font-bold text-black">
                  {currentView === 'add' ? 'Add New Item' : 'Edit Item'}
                </h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2 border border-teamax-border rounded-xl hover:bg-teamax-surface transition-colors duration-200 flex items-center space-x-2 font-bold uppercase tracking-widest text-[10px] text-black"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-5 py-2 bg-white text-black border border-black rounded-xl hover:brightness-110 transition-colors duration-200 flex items-center space-x-2 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-black/20"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Base Price *</label>
                <input
                  type="number"
                  value={formData.basePrice || ''}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Category *</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  title="Item Category"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.popular || false}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-black">Mark as Popular</span>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.available ?? true}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-black">Available for Order</span>
                </label>
              </div>
            </div>

            {/* Discount Pricing Section */}
            <div className="mb-8">
              <h3 className="text-lg font-playfair font-medium text-black mb-4">Discount Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Discount Price</label>
                  <input
                    type="number"
                    value={formData.discountPrice || ''}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) || undefined })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter discount price"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.discountActive || false}
                      onChange={(e) => setFormData({ ...formData, discountActive: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-black">Enable Discount</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Discount Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.discountStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, discountStartDate: e.target.value || undefined })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Select start date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Discount End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.discountEndDate || ''}
                    onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value || undefined })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Select end date"
                  />
                </div>
              </div>
              <p className="text-sm text-black mt-2">
                Leave dates empty for indefinite discount period. Discount will only be active if "Enable Discount" is checked and current time is within the date range.
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-black mb-2">Description *</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter item description"
                rows={3}
              />
            </div>

            <div className="mb-8">
              <ImageUpload
                currentImage={formData.image}
                onImageChange={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
              />
            </div>

            {/* Variations Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-playfair font-medium text-black">Variations</h3>
                <button
                  onClick={addVariation}
                  className="flex items-center space-x-2 px-3 py-2 bg-cream-100 text-black rounded-lg hover:bg-cream-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Variation</span>
                </button>
              </div>

              {formData.variations?.map((variation, index) => (
                <div key={variation.id} className="flex items-center space-x-3 mb-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={variation.name}
                    onChange={(e) => updateVariation(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Variation name (e.g., Small, Medium, Large)"
                  />
                  <input
                    type="number"
                    value={variation.price}
                    onChange={(e) => updateVariation(index, 'price', Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Price"
                  />
                  <button
                    onClick={() => removeVariation(index)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                    title="Remove Variation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Flavors Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-playfair font-medium text-black">Choose Flavors (Optional)</h3>
                <button
                  onClick={addFlavor}
                  className="flex items-center space-x-2 px-3 py-2 bg-cream-100 text-black rounded-lg hover:bg-cream-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Flavor</span>
                </button>
              </div>

              {(!formData.flavors || formData.flavors.length === 0) && (
                <p className="text-sm text-black italic">No flavors added yet.</p>
              )}

              {formData.flavors?.map((flavor, index) => (
                <div key={index} className="flex items-center space-x-3 mb-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={flavor}
                    onChange={(e) => updateFlavor(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Flavor name (e.g., Chocolate, Vanilla)"
                  />
                  <button
                    onClick={() => removeFlavor(index)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                    title="Remove Flavor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add-ons Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-playfair font-medium text-black">Add-ons</h3>
                <button
                  onClick={addAddOn}
                  className="flex items-center space-x-2 px-3 py-2 bg-cream-100 text-black rounded-lg hover:bg-cream-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Add-on</span>
                </button>
              </div>

              {formData.addOns?.map((addOn, index) => (
                <div key={addOn.id} className="flex items-center space-x-3 mb-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={addOn.name}
                    onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Add-on name"
                  />
                  <select
                    value={addOn.category}
                    onChange={(e) => updateAddOn(index, 'category', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    title="Add-on Category"
                  >
                    {addOnCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={addOn.price}
                    onChange={(e) => updateAddOn(index, 'price', Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Price"
                  />
                  <button
                    onClick={() => removeAddOn(index)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                    title="Remove Add-on"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
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
      <div className="min-h-screen bg-teamax-dark">
        <div className="bg-black shadow-sm border-b border-teamax-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Dashboard</span>
                </button>
                <h1 className="text-xl font-serif font-bold text-black">Menu Items</h1>
              </div>

              {/* Enhanced Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Coffee className="h-4 w-4 text-gray-400 rotate-12" />
                </div>
                <input
                  type="text"
                  placeholder="Search dishes or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-teamax-border rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none text-sm font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors"
                    title="Clear Search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {showBulkActions && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">
                      {selectedItems.length} selected
                    </span>
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="px-4 py-2 bg-black/5 text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200 font-bold uppercase tracking-widest text-[10px]"
                    >
                      Bulk Actions
                    </button>
                  </div>
                )}
                <button
                  onClick={handleAddItem}
                  className="flex items-center space-x-2 bg-white text-black border border-black px-5 py-2 rounded-xl hover:brightness-110 transition-all font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-black/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Bulk Actions Panel */}
          {showBulkActions && selectedItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-l-4 border-black">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-black mb-1">Bulk Actions</h3>
                  <p className="text-sm text-black">{selectedItems.length} item(s) selected</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-black">Change Category:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkCategoryChange(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-2 border border-teamax-border rounded-lg text-sm"
                      disabled={isProcessing}
                      title="Bulk Category Change"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleBulkRemove}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 bg-red-100 text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isProcessing ? 'Removing...' : 'Remove Selected'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedItems([]);
                      setShowBulkActions(false);
                    }}
                    className="flex items-center space-x-2 bg-gray-100 text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
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
              <div className="bg-white rounded-3xl p-12 text-center border border-teamax-border shadow-sm">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-teamax-border">
                  <Package className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-serif font-bold text-black">No dishes found</h3>
                <p className="text-black/60 mt-2">Try adjusting your search term</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-6 text-xs font-bold uppercase tracking-widest text-black hover:underline"
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
                        <span className="text-2xl bg-white p-2.5 rounded-2xl shadow-sm border border-teamax-border">{category.icon}</span>
                        <div>
                          <h2 className="text-2xl font-serif font-bold text-black leading-none">{category.name}</h2>
                          <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest mt-1.5">{items.length} dishes in this category</p>
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
                        className="text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black/5 px-4 py-2 rounded-xl border border-teamax-border transition-all"
                      >
                        {items.every(item => selectedItems.includes(item.id)) ? 'Deselect All' : 'Select Category'}
                      </button>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-teamax-border overflow-hidden">
                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-teamax-border">
                            <tr>
                              <th className="px-8 py-5 text-[10px] font-bold text-black uppercase tracking-widest">Select</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-black uppercase tracking-widest">Product</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-black uppercase tracking-widest">Price</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-black uppercase tracking-widest">Status</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-black uppercase tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => handleSelectItem(item.id)}
                                    className="w-5 h-5 rounded-lg border-2 border-teamax-border text-black focus:ring-black transition-all cursor-pointer"
                                    title={`Select ${item.name}`}
                                  />
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-teamax-border flex-shrink-0">
                                      {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-20 group-hover:scale-110 transition-transform">â˜•</div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-black text-base truncate">{item.name}</div>
                                      <div className="text-xs text-black/50 line-clamp-1 mt-0.5">{item.description}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col">
                                    {item.isOnDiscount && item.discountPrice ? (
                                      <>
                                        <span className="text-black font-bold text-base">â‚±{(item.discountPrice || 0).toFixed(2)}</span>
                                        <span className="text-black/30 line-through text-[10px] font-bold">â‚±{(item.basePrice || 0).toFixed(2)}</span>
                                      </>
                                    ) : (
                                      <span className="text-black font-bold text-base">â‚±{(item.basePrice || 0).toFixed(2)}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col gap-1.5">
                                    {item.popular && (
                                      <span className="w-fit text-[9px] font-bold uppercase tracking-widest bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">Popular</span>
                                    )}
                                    <span className={`w-fit text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${item.available
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : 'bg-red-50 text-red-500 border-red-100'}`}>
                                      {item.available ? 'Active' : 'Sold Out'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => handleEditItem(item)}
                                      className="p-2.5 text-black hover:bg-black hover:text-white rounded-xl transition-all border border-teamax-border"
                                      title="Edit Item"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100"
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
                      <div className="md:hidden divide-y divide-gray-100">
                        {items.map((item) => (
                          <div key={item.id} className={`p-6 ${selectedItems.includes(item.id) ? 'bg-black/5' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => handleSelectItem(item.id)}
                                  className="w-5 h-5 rounded-lg border-2 border-teamax-border text-black"
                                  title={`Select ${item.name}`}
                                />
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-teamax-border">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl opacity-20">â˜•</div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-bold text-black text-sm">{item.name}</h3>
                                  <p className="text-[10px] text-black/50">â‚±{(item.basePrice || 0).toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditItem(item)} className="p-2 border border-teamax-border rounded-lg" title="Edit Item"><Edit className="h-4 w-4" /></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-2 border border-red-100 text-red-500 rounded-lg" title="Delete Item"><Trash2 className="h-4 w-4" /></button>
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
    <div className="min-h-screen bg-teamax-dark">
      <div className="bg-black shadow-sm border-b border-teamax-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src="/mission-007-logo.png" alt="Mission 007" className="w-10 h-10 object-contain" />
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
              <div className="p-3 bg-teamax-gold/10 border border-teamax-gold/30">
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
              <div className="p-3 bg-teamax-gold/10 border border-teamax-gold/30">
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
              <div className="p-3 bg-teamax-gold/10 border border-teamax-gold/30">
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
              <div className="p-3 bg-teamax-gold/10 border border-teamax-gold/30">
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
                onClick={handleAddItem}
                className="group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Add New Item</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Create Menu Entry</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('items')}
                className="group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Manage Menu</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Edit & Update All</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('categories')}
                className="group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Categories</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Organize Menu</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('orders')}
                className="group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Manage Orders</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">View & Process Orders</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('payments')}
                className="group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300"
              >
                <div className="p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <span className="block font-bold text-teamax-gold text-sm">Payments</span>
                  <span className="text-[10px] text-teamax-secondary uppercase tracking-widest">Payout Methods</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('settings')}
                className="group flex items-center gap-4 p-5 text-left border border-teamax-gold/30 hover:border-teamax-gold hover:bg-teamax-gold/10 transition-all duration-300 sm:col-span-2"
              >
                <div className="p-3 border border-teamax-gold/40 text-teamax-gold group-hover:bg-teamax-gold group-hover:text-black transition-all">
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
                <div key={category.id} className="flex items-center justify-between p-4 bg-black border border-teamax-gold/20">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl bg-black p-2 border border-teamax-gold/30">{category.icon}</span>
                    <span className="font-bold text-teamax-gold text-sm">{category.name}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary border border-teamax-gold/30 px-2 py-1">
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
