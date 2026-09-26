import React, { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle2, Maximize2, X, Copy, Check, MessageCircle } from 'lucide-react';
import { CartItem, PaymentMethod, CheckoutServiceType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useSiteSettings } from '../hooks/useSiteSettings';

import { useOrders } from '../hooks/useOrders';
import { buildMessengerUrl } from '../utils/messenger';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
  onSuccess: () => void;
}

const SERVICE_TYPE_OPTIONS: { value: CheckoutServiceType; label: string; icon: string }[] = [
  { value: 'dine-in', label: 'Dine In', icon: '🍽️' },
  { value: 'pickup', label: 'Pickup', icon: '🚶' },
  { value: 'delivery', label: 'Delivery', icon: '🛵' }
];

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack, onSuccess }) => {
  const { siteSettings } = useSiteSettings();
  const { paymentMethods } = usePaymentMethods();
  const { createOrder } = useOrders({ autoFetch: false });
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<CheckoutServiceType>('pickup');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [pickupTime, setPickupTime] = useState('5-10');
  const [customTime, setCustomTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [notes, setNotes] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Set default payment method when payment methods are loaded
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].id as PaymentMethod);
    }
  }, [paymentMethods, paymentMethod]);

  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethod);

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    // Open the Messenger tab now, while we're still inside the click handler;
    // browsers block pop-ups opened after an await.
    const messengerTab = messengerUrl ? window.open('', '_blank') : null;
    try {
      setIsSubmitting(true);

      const orderData = {
        customerName,
        contactNumber,
        serviceType,
        tableNumber: serviceType === 'dine-in' && tableNumber.trim() ? tableNumber.trim() : undefined,
        address: serviceType === 'delivery' ? address : undefined,
        landmark: serviceType === 'delivery' ? landmark : undefined,
        pickupTime: serviceType === 'pickup' ? (pickupTime === 'custom' ? customTime : `${pickupTime} mins`) : undefined,
        paymentMethod: selectedPaymentMethod?.name || paymentMethod,
        total: totalPrice,
        notes,
        items: cartItems
      };

      const result = await createOrder(orderData);

      if (result.success) {
        const orderId = result.order?.id ?? null;
        setPlacedOrderId(orderId);
        const url = buildMessengerUrl(siteSettings?.messenger_page_id || '', buildOrderMessage(orderId));
        if (url) {
          await copyOrderMessage(orderId);
          if (messengerTab) {
            messengerTab.opener = null;
            messengerTab.location.href = url;
          } else {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }
        setStep('success');
      } else {
        messengerTab?.close();
        alert('Failed to place order: ' + result.error);
      }
    } catch (error) {
      messengerTab?.close();
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceTypeLabel = SERVICE_TYPE_OPTIONS.find(o => o.value === serviceType)?.label ?? serviceType;

  const buildOrderMessage = (orderId: string | null = placedOrderId) => {
    const lines: string[] = [];
    lines.push(`NEW ORDER${orderId ? ` #${orderId.slice(0, 8).toUpperCase()}` : ''}`);
    lines.push(`Name: ${customerName}`);
    lines.push(`Contact: ${contactNumber}`);
    lines.push(`Service: ${serviceTypeLabel}`);
    if (serviceType === 'dine-in' && tableNumber.trim()) lines.push(`Table: ${tableNumber.trim()}`);
    if (serviceType === 'pickup') lines.push(`Pickup Time: ${pickupTime === 'custom' ? customTime : `${pickupTime} mins`}`);
    if (serviceType === 'delivery') {
      lines.push(`Address: ${address}`);
      if (landmark) lines.push(`Landmark: ${landmark}`);
    }
    lines.push('');
    lines.push('Items:');
    cartItems.forEach(item => {
      const details = [
        item.selectedVariation?.name,
        item.selectedFlavor,
        item.selectedDrinkUpgrade ? `Drink: ${item.selectedDrinkUpgrade.name}` : undefined,
        item.serviceType
      ].filter(Boolean).join(', ');
      lines.push(`• ${item.quantity}x ${item.name}${details ? ` (${details})` : ''} — ₱${(item.totalPrice || 0) * item.quantity}`);
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        lines.push(`   + ${item.selectedAddOns.map(a => (a.quantity && a.quantity > 1 ? `${a.name} x${a.quantity}` : a.name)).join(', ')}`);
      }
    });
    lines.push('');
    lines.push(`Total: ₱${totalPrice || 0}`);
    lines.push(`Payment: ${selectedPaymentMethod?.name || paymentMethod}`);
    if (notes.trim()) lines.push(`Notes: ${notes.trim()}`);
    return lines.join('\n');
  };

  const messengerUrl = buildMessengerUrl(siteSettings?.messenger_page_id || '', buildOrderMessage());

  // The prefilled text isn't supported on every device, so also copy it for pasting
  const copyOrderMessage = async (orderId: string | null = placedOrderId) => {
    try {
      await navigator.clipboard.writeText(buildOrderMessage(orderId));
      setIsCopied(true);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); the link still opens
    }
  };

  const handleSendViaMessenger = async () => {
    if (!messengerUrl) return;
    await copyOrderMessage();
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
  };

  const isDetailsValid = customerName.trim() && contactNumber.trim() &&
    (serviceType !== 'delivery' || address.trim()) &&
    (serviceType !== 'pickup' || (pickupTime !== 'custom' || customTime.trim()));

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="rounded-xl bg-teamax-surface shadow-gold p-8 border border-teamax-gold/30 animate-scale-in">
          <div className="w-20 h-20 bg-teamax-gold/10 text-teamax-gold border border-teamax-gold/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-teamax-gold mb-2">Order Placed Successfully!</h2>
          <p className="text-teamax-secondary mb-8">Thank you, {customerName}. Your order has been received and is being processed.</p>

          <div className="rounded-xl bg-black/40 border border-teamax-gold/20 p-6 text-left mb-8 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-teamax-secondary font-bold uppercase tracking-widest text-[10px]">Total Paid</span>
              <span className="text-teamax-gold font-bold">₱{(totalPrice || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-teamax-secondary font-bold uppercase tracking-widest text-[10px]">Payment Method</span>
              <span className="text-teamax-gold font-bold uppercase">{selectedPaymentMethod?.name || paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-teamax-secondary font-bold uppercase tracking-widest text-[10px]">Service</span>
              <span className="text-teamax-gold font-bold">{serviceTypeLabel}{serviceType === 'dine-in' && tableNumber.trim() ? ` · Table ${tableNumber.trim()}` : ''}</span>
            </div>
          </div>

          {messengerUrl && (
            <div className="mb-4 space-y-2">
              <button
                onClick={handleSendViaMessenger}
                className="w-full py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-[#0084FF] hover:bg-[#0074e0] text-white transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Open Messenger Again
              </button>
              <p className="text-[11px] text-teamax-secondary">
                {isCopied
                  ? 'Order details copied — paste them in the chat if the message is empty, then tap send.'
                  : 'Messenger didn’t open? Tap above to send your order details to our Page.'}
              </p>
            </div>
          )}

          <button
            onClick={onSuccess}
            className={`${messengerUrl ? 'mission-btn-outline' : 'mission-btn'} w-full py-4 text-xs`}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-0 mb-6 sm:mb-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-teamax-gold sm:ml-8 tracking-[0.08em]">Order Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="mission-card p-6">
            <h2 className="text-2xl font-display font-medium text-teamax-gold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-teamax-gold/20">
                  <div>
                    <h4 className="font-medium text-teamax-gold">{item.name}</h4>
                    {item.selectedVariation && (
                      <p className="text-sm text-teamax-secondary">Variation: {item.selectedVariation.name}</p>
                    )}
                    {item.selectedFlavor && (
                      <p className="text-sm text-teamax-secondary">Flavor: {item.selectedFlavor}</p>
                    )}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-sm text-teamax-secondary">
                        Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-teamax-secondary">₱{(item.totalPrice || 0)} x {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-teamax-gold">₱{((item.totalPrice || 0) * (item.quantity || 0))}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-teamax-gold/20 pt-4">
              <div className="flex items-center justify-between text-2xl font-display font-semibold text-teamax-gold">
                <span>Total:</span>
                <span>₱{(totalPrice || 0)}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="mission-card p-6">
            <h2 className="text-2xl font-display font-medium text-teamax-gold mb-6">Customer Information</h2>

            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-teamax-gold mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mission-input"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-teamax-gold mb-2">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="mission-input"
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-teamax-gold mb-3">Service Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {SERVICE_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setServiceType(option.value)}
                      className={`rounded-xl p-4 border transition-all duration-200 flex flex-col items-center justify-center ${serviceType === option.value
                        ? 'border-teamax-gold bg-teamax-gold text-black shadow-gold'
                        : 'border-teamax-gold/30 bg-black text-teamax-secondary hover:border-teamax-gold'
                        }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>



              {/* Dine-in Table Number */}
              {serviceType === 'dine-in' && (
                <div>
                  <label className="block text-sm font-medium text-teamax-gold mb-2">Table Number</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="mission-input"
                    placeholder="e.g., 5 (leave blank if not seated yet)"
                  />
                </div>
              )}

              {/* Pickup Time Selection */}
              {serviceType === 'pickup' && (
                <div>
                  <label className="block text-sm font-medium text-teamax-gold mb-3">Pickup Time *</label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: '5-10', label: '5-10 mins' },
                        { value: '15-20', label: '15-20 mins' },
                        { value: '25-30', label: '25-30 mins' },
                        { value: 'custom', label: 'Custom' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPickupTime(option.value)}
                          className={`rounded-xl p-3 border transition-all duration-200 text-sm ${pickupTime === option.value
                            ? 'border-teamax-gold bg-teamax-gold text-black shadow-gold'
                            : 'border-teamax-gold/30 bg-black text-teamax-secondary hover:border-teamax-gold'
                            }`}
                        >
                          <Clock className="h-4 w-4 mx-auto mb-1" />
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {pickupTime === 'custom' && (
                      <input
                        type="text"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="mission-input"
                        placeholder="e.g., 45 minutes, 2:30 PM"
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {serviceType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-teamax-gold mb-2">Delivery Address *</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mission-input"
                      placeholder="Enter your complete delivery address"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-teamax-gold mb-2">Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="mission-input"
                      placeholder="e.g., Near McDonald's"
                    />
                  </div>
                </>
              )}

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-teamax-gold mb-2">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mission-input"
                  placeholder="Any special requests..."
                  rows={2}
                />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleProceedToPayment();
                }}
                disabled={!isDetailsValid}
                className={`rounded-xl w-full py-4 font-bold text-lg tracking-widest uppercase ${isDetailsValid
                  ? 'mission-btn'
                  : 'border border-teamax-gold/20 bg-black text-teamax-secondary cursor-not-allowed'
                  }`}
              >
                Proceed to Payment
              </button>

              {!isDetailsValid && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  {!customerName.trim() && 'Name is required. '}
                  {!contactNumber.trim() && 'Contact is required. '}
                  {serviceType === 'delivery' && !address.trim() && 'Address is required. '}
                  {serviceType === 'pickup' && pickupTime === 'custom' && !customTime.trim() && 'Time is required. '}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-0 mb-6 sm:mb-8">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setStep('details');
          }}
          className="flex items-center space-x-2 text-teamax-secondary hover:text-teamax-gold transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Details</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold text-teamax-gold sm:ml-8 tracking-[0.08em]">Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="mission-card p-6">
          <h2 className="text-2xl font-display font-medium text-teamax-gold mb-6">Choose Payment Method</h2>

          <div className="grid grid-cols-1 gap-4 mb-6">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`rounded-xl group relative p-4 border transition-all duration-300 flex items-center justify-between ${paymentMethod === method.id
                  ? 'border-teamax-gold bg-teamax-gold text-black shadow-gold'
                  : 'border-teamax-gold/30 bg-black text-teamax-secondary hover:border-teamax-gold'
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-black/20">
                    {method.id === 'cod' ? '💵' : '💳'}
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">{method.name}</span>
                    <span className="text-xs opacity-70">
                      {method.id === 'cod' ? 'Pay when you receive' : 'Pay via digital transfer'}
                    </span>
                  </div>
                </div>
                {paymentMethod === method.id && (
                  <CheckCircle2 className="h-6 w-6 animate-scale-in" />
                )}
              </button>
            ))}
          </div>

          {selectedPaymentMethod && (
            <div className="rounded-xl bg-black p-6 mb-6 border border-dashed border-teamax-gold/40">
              <h3 className="font-medium text-teamax-gold mb-4 flex items-center">
                <span className="w-2 h-2 bg-teamax-gold rounded-full mr-2"></span>
                Payment Details
              </h3>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-teamax-secondary uppercase tracking-wider">{selectedPaymentMethod.name}</p>
                  {selectedPaymentMethod.account_number && (
                    <div className="flex flex-col">
                      <span className="text-xs text-teamax-secondary">Account Number</span>
                      <p className="font-mono text-lg text-teamax-gold font-bold tracking-tight">{selectedPaymentMethod.account_number}</p>
                    </div>
                  )}
                  {selectedPaymentMethod.account_name && (
                    <div className="flex flex-col">
                      <span className="text-xs text-teamax-secondary">Account Name</span>
                      <p className="text-sm text-teamax-primary font-medium">{selectedPaymentMethod.account_name}</p>
                    </div>
                  )}
                  <div className="pt-2">
                    <p className="text-2xl font-bold text-teamax-gold">₱{(totalPrice || 0)}</p>
                    <p className="text-[10px] text-teamax-secondary">Exact amount to pay</p>
                  </div>
                </div>
                <div className="relative group self-center md:self-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowQRModal(true);
                    }}
                    className="rounded-xl relative block overflow-hidden shadow-xl border-2 border-teamax-gold transition-transform duration-300 hover:scale-105"
                  >
                    <img
                      src={selectedPaymentMethod.qr_code_url}
                      alt={`${selectedPaymentMethod.name} QR Code`}
                      className="w-40 h-40 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-teamax-gold">
                      <Maximize2 className="h-8 w-8 mb-1" />
                      <span className="text-[10px] font-bold uppercase">Click to View</span>
                    </div>
                  </button>
                  <p className="text-[10px] text-teamax-secondary text-center mt-2 font-medium uppercase tracking-widest">Scan to Pay</p>
                </div>
              </div>
            </div>
          )}

          {showQRModal && selectedPaymentMethod && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowQRModal(false)}>
              <div className="rounded-xl relative bg-teamax-surface border border-teamax-gold/40 p-4 max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="absolute -top-12 right-0 p-2 text-teamax-gold hover:text-teamax-primary transition-colors"
                  aria-label="Close QR Modal"
                >
                  <X className="h-8 w-8" />
                </button>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-teamax-gold">{selectedPaymentMethod.name}</h3>
                  <p className="text-sm text-teamax-secondary">Scan this QR code to pay</p>
                </div>
                <img
                  src={selectedPaymentMethod.qr_code_url}
                  alt="QR Code Large"
                  className="w-full aspect-square"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
                  }}
                />
                <div className="rounded-xl mt-4 p-4 bg-black border border-teamax-gold/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-teamax-secondary">Account:</span>
                    <span className="font-bold text-teamax-gold">{selectedPaymentMethod.account_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-teamax-secondary">Total:</span>
                    <span className="font-bold text-teamax-gold">₱{(totalPrice || 0)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="mission-btn w-full mt-4 py-3"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {paymentMethod !== 'cod' ? (
            <div className="rounded-xl bg-black border border-teamax-gold/20 p-4">
              <h4 className="font-medium text-teamax-gold mb-2">Digital Payment</h4>
              <p className="text-sm text-teamax-secondary">
                Please ensure you have completed the payment via {selectedPaymentMethod?.name || 'the selected method'} before confirming your order.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-black border border-teamax-gold/20 p-4">
              <h4 className="font-medium text-teamax-gold mb-2">Cash on Delivery</h4>
              <p className="text-sm text-teamax-secondary">
                Please prepare exact amount. {serviceType === 'dine-in' ? 'You will pay at the counter.' : `You will pay when you ${serviceType === 'pickup' ? 'pick up' : 'receive'} your order.`}
              </p>
            </div>
          )}
        </div>

        <div className="mission-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-medium text-teamax-gold">Final Order Summary</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="rounded-xl bg-black p-4 border border-teamax-gold/20">
              <h4 className="font-medium text-teamax-gold mb-2">Customer Details</h4>
              <p className="text-sm text-teamax-secondary">Name: {customerName}</p>
              <p className="text-sm text-teamax-secondary">Contact: {contactNumber}</p>
              <p className="text-sm text-teamax-secondary">Service: {serviceTypeLabel}</p>
              {serviceType === 'dine-in' && tableNumber.trim() && (
                <p className="text-sm text-teamax-secondary">Table: {tableNumber.trim()}</p>
              )}
              {serviceType === 'delivery' && (
                <>
                  <p className="text-sm text-teamax-secondary">Address: {address}</p>
                  {landmark && <p className="text-sm text-teamax-secondary">Landmark: {landmark}</p>}
                </>
              )}
              {serviceType === 'pickup' && (
                <p className="text-sm text-teamax-secondary">
                  Pickup Time: {pickupTime === 'custom' ? customTime : `${pickupTime} minutes`}
                </p>
              )}
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-teamax-gold/20">
                <div>
                  <h4 className="font-medium text-teamax-gold">{item.name}</h4>
                  {item.selectedVariation && (
                    <p className="text-sm text-teamax-secondary">Variation: {item.selectedVariation.name}</p>
                  )}
                  {item.selectedFlavor && (
                    <p className="text-sm text-teamax-secondary">Flavor: {item.selectedFlavor}</p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-sm text-teamax-secondary">
                      Add-ons: {item.selectedAddOns.map(addOn =>
                        addOn.quantity && addOn.quantity > 1
                          ? `${addOn.name} x${addOn.quantity}`
                          : addOn.name
                      ).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-teamax-secondary">₱{(item.totalPrice || 0)} x {item.quantity}</p>
                </div>
                <span className="font-semibold text-teamax-gold">₱{((item.totalPrice || 0) * (item.quantity || 0))}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-teamax-gold/20 pt-4 mb-6">
            <div className="flex items-center justify-between text-2xl font-display font-semibold text-teamax-gold">
              <span>Total:</span>
              <span>₱{(totalPrice || 0)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handlePlaceOrder();
            }}
            disabled={isSubmitting}
            className={`rounded-xl w-full py-4 font-bold text-lg uppercase tracking-widest flex items-center justify-center gap-2 ${isSubmitting
              ? 'border border-teamax-gold/20 bg-black text-teamax-secondary cursor-not-allowed'
              : messengerUrl
                ? 'bg-[#0084FF] hover:bg-[#0074e0] text-white transition-colors'
                : 'mission-btn'
              }`}
          >
            {messengerUrl && !isSubmitting && <MessageCircle className="h-5 w-5" />}
            {isSubmitting ? 'Sending Order...' : messengerUrl ? 'Send Order via Messenger' : 'Confirm & Place Order'}
          </button>

          <p className="text-xs text-teamax-secondary text-center mt-3">
            {messengerUrl
              ? 'Your order is saved and Messenger opens with your order details — just tap send.'
              : 'Your order will be saved and processed by our team.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
