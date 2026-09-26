import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, GripVertical, CheckCircle2 } from 'lucide-react';
import { useCategories, Category } from '../hooks/useCategories';
import { BRAND } from '../brand';

interface CategoryManagerProps {
  onBack: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onBack }) => {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useCategories();
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    icon: '☕',
    sort_order: 0,
    active: true
  });
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleAddCategory = () => {
    const nextSortOrder = Math.max(...categories.map(c => c.sort_order), 0) + 1;
    setFormData({
      id: '',
      name: '',
      icon: '☕',
      sort_order: nextSortOrder,
      active: true
    });
    setCurrentView('add');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      id: category.id,
      name: category.name,
      icon: category.icon,
      sort_order: category.sort_order,
      active: category.active
    });
    setCurrentView('edit');
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete category');
      }
    }
  };

  const handleSaveCategory = async () => {
    if (!formData.id || !formData.name || !formData.icon) {
      alert('Please fill in all required fields');
      return;
    }

    const idRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!idRegex.test(formData.id)) {
      alert('Category ID must be in kebab-case format (e.g., "hot-drinks", "cold-beverages")');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await addCategory(formData);
      }

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      setCurrentView('list');
      setEditingCategory(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingCategory(null);
  };

  const generateIdFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      id: currentView === 'add' ? generateIdFromName(name) : formData.id
    });
  };

  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="min-h-screen bg-teamax-dark app-bg">
        <div className="bg-black border-b border-teamax-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <img src={BRAND.logo} alt="Mission 007" className="w-10 h-10 object-contain" />
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Back</span>
                </button>
                <h1 className="text-xl font-display font-bold text-teamax-gold tracking-[0.08em]">
                  {currentView === 'add' ? 'Add New Category' : 'Edit Category'}
                </h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="mission-btn-outline px-5 py-2 flex items-center space-x-2 text-[10px]"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="mission-btn px-5 py-2 flex items-center space-x-2 text-[10px] shadow-gold"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mission-card p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mission-input"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Category ID *</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="mission-input"
                  placeholder="kebab-case-id"
                  disabled={currentView === 'edit'}
                />
                <p className="text-xs text-teamax-secondary mt-1">
                  {currentView === 'edit'
                    ? 'Category ID cannot be changed after creation'
                    : 'Use kebab-case format (e.g., "hot-drinks", "cold-beverages")'
                  }
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Icon *</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="mission-input flex-1"
                    placeholder="Enter emoji or icon"
                  />
                  <div className="w-12 h-12 bg-black border border-teamax-gold/20 rounded-xl flex items-center justify-center text-2xl">
                    {formData.icon}
                  </div>
                </div>
                <p className="text-xs text-teamax-secondary mt-1">
                  Use an emoji or icon character (e.g., ☕, 🧊, 🫖, 🥐)
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  className="mission-input"
                  placeholder="0"
                />
                <p className="text-xs text-teamax-secondary mt-1">
                  Lower numbers appear first in the menu
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-2 border-teamax-gold/40 text-teamax-gold bg-black focus:ring-teamax-gold transition-all cursor-pointer"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary">Active Category</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-teamax-dark app-bg">
      <div className="bg-black border-b border-teamax-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src={BRAND.logo} alt="Mission 007" className="w-10 h-10 object-contain" />
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Dashboard</span>
              </button>
              <h1 className="text-xl font-display font-bold text-teamax-gold tracking-[0.08em]">Manage Categories</h1>
            </div>
            <button
              onClick={handleAddCategory}
              className="mission-btn flex items-center space-x-2 px-5 py-2 text-[10px] shadow-gold"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mission-card overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-display font-bold text-teamax-gold tracking-[0.08em] mb-4">Categories</h2>

            {categories.length === 0 ? (
              <div className="mission-card p-8 text-center">
                <p className="text-teamax-secondary mb-4">No categories found</p>
                <button
                  onClick={handleAddCategory}
                  className="mission-btn px-5 py-2 text-[10px] shadow-gold"
                >
                  Add First Category
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-black border border-teamax-gold/20 rounded-xl hover:bg-teamax-gold/5 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-teamax-secondary cursor-move">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-sm text-teamax-secondary">#{category.sort_order}</span>
                      </div>
                      <div className="text-2xl">{category.icon}</div>
                      <div>
                        <h3 className="font-medium text-teamax-primary">{category.name}</h3>
                        <p className="text-sm text-teamax-secondary">ID: {category.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${category.active
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                        {category.active ? 'Active' : 'Inactive'}
                      </span>

                      <button
                        onClick={() => handleEditCategory(category)}
                        className="mission-btn-outline p-2 rounded-xl transition-colors duration-200"
                        title="Edit Category"
                        aria-label="Edit Category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl transition-colors duration-200"
                        title="Delete Category"
                        aria-label="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSaveSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce-gentle">
          <div className="mission-card px-8 py-4 flex items-center gap-3 border-teamax-gold/50 shadow-gold">
            <div className="bg-green-500 rounded-xl p-1">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold uppercase tracking-widest text-[10px] text-teamax-gold">Category Saved Successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
