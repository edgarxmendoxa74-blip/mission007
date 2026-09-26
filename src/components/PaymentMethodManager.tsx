import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, CreditCard, Maximize2, CheckCircle2 } from 'lucide-react';
import { usePaymentMethods, PaymentMethod } from '../hooks/usePaymentMethods';
import ImageUpload from './ImageUpload';
import { BRAND } from '../brand';

interface PaymentMethodManagerProps {
  onBack: () => void;
}

const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ onBack }) => {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, refetchAll } = usePaymentMethods();
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    account_number: '',
    account_name: '',
    qr_code_url: '',
    active: true,
    sort_order: 0
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRUrl, setSelectedQRUrl] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  React.useEffect(() => {
    refetchAll();
  }, []);

  const handleAddMethod = () => {
    const nextSortOrder = Math.max(...paymentMethods.map(m => m.sort_order), 0) + 1;
    setFormData({
      id: '',
      name: '',
      account_number: '',
      account_name: '',
      qr_code_url: '',
      active: true,
      sort_order: nextSortOrder
    });
    setCurrentView('add');
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      id: method.id,
      name: method.name,
      account_number: method.account_number,
      account_name: method.account_name,
      qr_code_url: method.qr_code_url,
      active: method.active,
      sort_order: method.sort_order
    });
    setCurrentView('edit');
  };

  const handleDeleteMethod = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      try {
        await deletePaymentMethod(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete payment method');
      }
    }
  };

  const handleSaveMethod = async () => {
    if (!formData.id || !formData.name || !formData.account_name || !formData.qr_code_url) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate ID format (kebab-case)
    const idRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!idRegex.test(formData.id)) {
      alert('Payment method ID must be in kebab-case format (e.g., "gcash", "bank-transfer")');
      return;
    }

    try {
      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, formData);
      } else {
        await addPaymentMethod(formData);
      }

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      setCurrentView('list');
      setEditingMethod(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save payment method');
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingMethod(null);
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

  // Form View (Add/Edit)
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
                  <span>Back</span>
                </button>
                <h1 className="text-2xl font-display font-bold text-teamax-gold tracking-[0.08em]">
                  {currentView === 'add' ? 'Add Payment Method' : 'Edit Payment Method'}
                </h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="mission-btn-outline px-4 py-2 border border-teamax-gold text-teamax-gold hover:bg-teamax-gold hover:text-black transition-colors duration-200 flex items-center space-x-2 rounded-xl"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveMethod}
                  className="mission-btn px-4 py-2 bg-teamax-gold text-black transition-colors duration-200 flex items-center space-x-2 rounded-xl"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mission-card bg-teamax-surface border border-teamax-gold/30 shadow-gold p-8 rounded-xl">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Payment Method Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mission-input w-full px-4 py-3 bg-black border border-teamax-gold/40 text-teamax-primary rounded-xl"
                  placeholder="e.g., GCash, Maya, Bank Transfer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Method ID *</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="mission-input w-full px-4 py-3 bg-black border border-teamax-gold/40 text-teamax-primary rounded-xl"
                  placeholder="kebab-case-id"
                  disabled={currentView === 'edit'}
                />
                <p className="text-xs text-teamax-secondary mt-1">
                  {currentView === 'edit'
                    ? 'Method ID cannot be changed after creation'
                    : 'Use kebab-case format (e.g., "gcash", "bank-transfer")'
                  }
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Account Number/Phone</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="mission-input w-full px-4 py-3 bg-black border border-teamax-gold/40 text-teamax-primary rounded-xl"
                  placeholder="09XX XXX XXXX or Account: 1234-5678-9012"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Account Name *</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="mission-input w-full px-4 py-3 bg-black border border-teamax-gold/40 text-teamax-primary rounded-xl"
                  placeholder="M&C Bakehouse"
                />
              </div>

              <div>
                <ImageUpload
                  currentImage={formData.qr_code_url}
                  onImageChange={(imageUrl) => setFormData({ ...formData, qr_code_url: imageUrl || '' })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  className="mission-input w-full px-4 py-3 bg-black border border-teamax-gold/40 text-teamax-primary rounded-xl"
                  placeholder="0"
                />
                <p className="text-xs text-teamax-secondary mt-1">
                  Lower numbers appear first in the checkout
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-2 border-teamax-gold/40 text-teamax-gold bg-black"
                  />
                  <span className="text-sm font-medium text-teamax-primary">Active Payment Method</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
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
                <span>Dashboard</span>
              </button>
              <h1 className="text-2xl font-display font-bold text-teamax-gold tracking-[0.08em]">Payment Methods</h1>
            </div>
            <button
              onClick={handleAddMethod}
              className="mission-btn flex items-center space-x-2 bg-teamax-gold text-black px-4 py-2 rounded-xl transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Payment Method</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mission-card bg-teamax-surface border border-teamax-gold/30 shadow-gold overflow-hidden rounded-xl">
          <div className="p-6">
            <h2 className="text-lg font-display font-bold text-teamax-gold tracking-[0.08em] mb-4">Payment Methods</h2>

            {paymentMethods.length === 0 ? (
              <div className="mission-card bg-teamax-surface border border-teamax-gold/30 shadow-gold text-center py-8 rounded-xl">
                <CreditCard className="h-12 w-12 text-teamax-gold/50 mx-auto mb-4" />
                <p className="text-teamax-secondary mb-4">No payment methods found</p>
                <button
                  onClick={handleAddMethod}
                  className="mission-btn bg-teamax-gold text-black px-4 py-2 rounded-xl transition-colors duration-200"
                >
                  Add First Payment Method
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 bg-black border border-teamax-gold/20 rounded-xl hover:bg-teamax-surface transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 relative group">
                        <button
                          onClick={() => {
                            setSelectedQRUrl(method.qr_code_url);
                            setShowQRModal(true);
                          }}
                          className="relative block rounded-xl overflow-hidden border border-teamax-gold/30 transition-transform duration-200 hover:scale-105"
                        >
                          <img
                            src={method.qr_code_url}
                            alt={`${method.name} QR Code`}
                            className="w-16 h-16 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-teamax-gold">
                            <Maximize2 className="h-4 w-4" />
                          </div>
                        </button>
                      </div>
                      <div>
                        <h3 className="font-medium text-teamax-primary">{method.name}</h3>
                        <p className="text-sm text-teamax-secondary">{method.account_number}</p>
                        <p className="text-sm text-teamax-secondary">Account: {method.account_name}</p>
                        <p className="text-xs text-teamax-secondary">ID: {method.id} • Order: #{method.sort_order}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-xl text-xs font-medium border ${method.active
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                        {method.active ? 'Active' : 'Inactive'}
                      </span>

                      <button
                        onClick={() => handleEditMethod(method)}
                        className="mission-btn-outline p-2 border border-teamax-gold text-teamax-gold hover:bg-teamax-gold hover:text-black rounded-xl transition-colors duration-200"
                        title="Edit Payment Method"
                        aria-label="Edit Payment Method"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteMethod(method.id)}
                        className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl transition-colors duration-200"
                        title="Delete Payment Method"
                        aria-label="Delete Payment Method"
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

      {/* QR Code Modal for Admin */}
      {showQRModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowQRModal(false)}>
          <div className="relative mission-card bg-teamax-surface border border-teamax-gold/30 shadow-gold rounded-xl p-4 max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute -top-12 right-0 p-2 text-teamax-gold hover:text-teamax-secondary transition-colors"
              aria-label="Close QR Preview"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="text-center mb-4">
              <h3 className="text-lg font-display font-bold text-teamax-gold tracking-[0.08em]">QR Code Preview</h3>
            </div>
            <img
              src={selectedQRUrl}
              alt="QR Code Large"
              className="w-full aspect-square rounded-xl shadow-inner object-contain border border-teamax-gold/30"
              onError={(e) => {
                e.currentTarget.src = 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
              }}
            />
            <button
              onClick={() => setShowQRModal(false)}
              className="mission-btn w-full mt-4 py-3 bg-teamax-gold text-black rounded-xl font-bold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Save Success Popup */}
      {showSaveSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce-gentle">
          <div className="bg-teamax-surface text-teamax-primary px-8 py-4 rounded-xl shadow-gold flex items-center gap-3 border border-teamax-gold/30 backdrop-blur-md">
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-1">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs text-teamax-gold">Payment Method Saved!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodManager;
