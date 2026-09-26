import React, { useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, X, PenLine, CheckCircle2, ShoppingCart } from 'lucide-react';
import { SMART_CATEGORIES, SMART_MENU } from '../data/smartMenu';
import { useOrders } from '../hooks/useOrders';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { AddOn, CartItem, CheckoutServiceType, MenuItem, Order, Variation } from '../types';

const peso = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const unitPrice = (item: MenuItem, variation?: Variation, addOns: AddOn[] = []) =>
  (variation ? variation.price : (item.effectivePrice || item.basePrice || 0)) +
  addOns.reduce((s, a) => s + a.price, 0);

const lineLabel = (line: CartItem) =>
  [line.selectedVariation?.name, ...(line.selectedAddOns || []).map(a => `+${a.name}`)]
    .filter(Boolean)
    .join(' · ');

const PosTerminal: React.FC = () => {
  const { createOrder } = useOrders({ autoFetch: false });
  const { paymentMethods } = usePaymentMethods();

  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [ticket, setTicket] = useState<CartItem[]>([]);

  // Variation / add-on picker for the product being added
  const [picking, setPicking] = useState<MenuItem | null>(null);
  const [pickVariation, setPickVariation] = useState<Variation | undefined>();
  const [pickAddOns, setPickAddOns] = useState<AddOn[]>([]);

  // Manual (off-menu) line
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');

  // Order details
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<CheckoutServiceType>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [tendered, setTendered] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Order['status']>('completed');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const products = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SMART_MENU.filter(p =>
      p.available !== false &&
      (category === 'all' || p.category === category) &&
      (!q || p.name.toLowerCase().includes(q))
    );
  }, [category, search]);

  const total = ticket.reduce((s, l) => s + l.totalPrice * l.quantity, 0);
  const itemCount = ticket.reduce((s, l) => s + l.quantity, 0);
  const tenderedAmount = Number(tendered) || 0;
  const change = tenderedAmount - total;

  const addLine = (item: MenuItem, variation?: Variation, addOns: AddOn[] = [], qty = 1) => {
    const price = unitPrice(item, variation, addOns);
    const signature = `${item.id}|${variation?.id || ''}|${addOns.map(a => a.id).sort().join(',')}`;
    setTicket(prev => {
      const existing = prev.find(l => l.id === signature);
      if (existing) {
        return prev.map(l => (l.id === signature ? { ...l, quantity: l.quantity + qty } : l));
      }
      return [...prev, {
        ...item,
        id: signature,
        menuItemId: item.id,
        quantity: qty,
        selectedVariation: variation,
        selectedAddOns: addOns,
        totalPrice: price
      }];
    });
    setMessage(null);
  };

  const handleProductClick = (item: MenuItem) => {
    if ((item.variations?.length || 0) > 0 || (item.addOns?.length || 0) > 0) {
      setPicking(item);
      setPickVariation(item.variations?.[0]);
      setPickAddOns([]);
    } else {
      addLine(item);
    }
  };

  const confirmPick = () => {
    if (!picking) return;
    addLine(picking, pickVariation, pickAddOns);
    setPicking(null);
  };

  const addCustomLine = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(customPrice);
    const qty = Math.max(1, Math.floor(Number(customQty) || 1));
    if (!customName.trim() || !(price > 0)) return;
    addLine(
      {
        id: `custom-${customName.trim().toLowerCase().replace(/\s+/g, '-')}-${price}`,
        name: customName.trim(),
        description: 'Manual entry',
        basePrice: price,
        category: 'custom'
      },
      undefined,
      [],
      qty
    );
    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
  };

  const changeQty = (id: string, delta: number) => {
    setTicket(prev => prev
      .map(l => (l.id === id ? { ...l, quantity: l.quantity + delta } : l))
      .filter(l => l.quantity > 0));
  };

  const resetSale = () => {
    setTicket([]);
    setCustomerName('');
    setContactNumber('');
    setTableNumber('');
    setReferenceNumber('');
    setTendered('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (ticket.length === 0) return;
    setSubmitting(true);
    setMessage(null);
    const result = await createOrder({
      customerName: customerName.trim() || 'Walk-in',
      contactNumber: contactNumber.trim(),
      serviceType,
      tableNumber: serviceType === 'dine-in' && tableNumber.trim() ? tableNumber.trim() : undefined,
      pickupTime: serviceType === 'pickup' ? 'Walk-in' : undefined,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      total,
      notes: [notes.trim(), 'POS entry'].filter(Boolean).join(' — '),
      items: ticket
    }, status);
    setSubmitting(false);

    if (result.success) {
      setMessage({
        ok: true,
        text: paymentMethod === 'Cash' && tenderedAmount >= total
          ? `Sale recorded. Change due: ${peso(change)}`
          : 'Sale recorded.'
      });
      resetSale();
    } else {
      setMessage({ ok: false, text: `Failed to record sale: ${result.error}` });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Products */}
      <div className="lg:col-span-3 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teamax-gold/60" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="mission-input pl-11"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[{ id: 'all', name: 'All', icon: '📋' }, ...SMART_CATEGORIES].map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-xl flex-shrink-0 px-3 py-2 text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap transition-colors ${category === c.id
                ? 'bg-teamax-gold text-black border-teamax-gold'
                : 'border-teamax-gold/30 text-teamax-gold hover:bg-teamax-gold/10'}`}
            >
              <span className="mr-1">{c.icon}</span>{c.name.split(' – ')[0]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => handleProductClick(p)}
              className="mission-card p-4 text-left hover:border-teamax-gold transition-colors flex flex-col justify-between min-h-[96px]"
            >
              <span className="font-bold text-sm text-teamax-primary leading-snug">{p.name}</span>
              <span className="text-xs text-teamax-gold font-bold mt-2">
                {p.variations?.length
                  ? `from ${peso(Math.min(...p.variations.map(v => v.price)))}`
                  : peso(p.effectivePrice || p.basePrice)}
              </span>
            </button>
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-xs text-teamax-secondary italic py-8 text-center">No products match.</p>
          )}
        </div>

        {/* Manual input */}
        <form onSubmit={addCustomLine} className="mission-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-3 flex items-center gap-2">
            <PenLine className="h-4 w-4" /> Manual Item
          </h3>
          <div className="grid grid-cols-6 gap-2">
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Item name"
              className="mission-input col-span-6 sm:col-span-3"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              placeholder="Price"
              className="mission-input col-span-3 sm:col-span-1"
            />
            <input
              type="number"
              min="1"
              value={customQty}
              onChange={e => setCustomQty(e.target.value)}
              placeholder="Qty"
              className="mission-input col-span-3 sm:col-span-1"
              title="Quantity"
            />
            <button
              type="submit"
              disabled={!customName.trim() || !(Number(customPrice) > 0)}
              className="mission-btn col-span-6 sm:col-span-1 py-3 text-[10px] flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </form>
      </div>

      {/* Ticket */}
      <div className="lg:col-span-2">
        <div className="mission-card p-5 lg:sticky lg:top-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-teamax-gold tracking-[0.12em] uppercase flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Current Sale
            </h3>
            {ticket.length > 0 && (
              <button onClick={() => setTicket([])} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300">
                Clear
              </button>
            )}
          </div>

          {ticket.length === 0 ? (
            <p className="text-xs text-teamax-secondary italic py-6 text-center">Tap a product or add a manual item.</p>
          ) : (
            <ul className="divide-y divide-teamax-gold/10 max-h-72 overflow-y-auto -mx-1 px-1">
              {ticket.map(l => (
                <li key={l.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-teamax-primary truncate">{l.name}</p>
                    {lineLabel(l) && <p className="text-[11px] text-teamax-secondary truncate">{lineLabel(l)}</p>}
                    <p className="text-[11px] text-teamax-secondary">{peso(l.totalPrice)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(l.id, -1)} className="rounded-xl p-1.5 border border-teamax-gold/30 text-teamax-gold" title="Decrease">
                      {l.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-teamax-primary tabular-nums">{l.quantity}</span>
                    <button onClick={() => changeQty(l.id, 1)} className="rounded-xl p-1.5 border border-teamax-gold/30 text-teamax-gold" title="Increase">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-20 text-right text-sm font-bold text-teamax-gold tabular-nums">{peso(l.totalPrice * l.quantity)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-between items-baseline border-t border-teamax-gold/30 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary">Total · {itemCount} item{itemCount === 1 ? '' : 's'}</span>
            <span className="text-2xl font-bold text-teamax-gold tabular-nums">{peso(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer (Walk-in)" className="mission-input col-span-2 sm:col-span-1" />
            <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="Contact (optional)" className="mission-input col-span-2 sm:col-span-1" />
            <select value={serviceType} onChange={e => setServiceType(e.target.value as CheckoutServiceType)} className="mission-input" title="Service type">
              <option value="dine-in" className="bg-teamax-dark">Dine-In</option>
              <option value="pickup" className="bg-teamax-dark">Take-Out</option>
              <option value="delivery" className="bg-teamax-dark">Delivery</option>
            </select>
            {serviceType === 'dine-in' && (
              <input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Table #" className="mission-input" />
            )}
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Order['status'])}
              className={`mission-input ${serviceType === 'dine-in' ? 'col-span-2' : ''}`}
              title="Order status"
            >
              <option value="completed" className="bg-teamax-dark">Completed</option>
              <option value="pending" className="bg-teamax-dark">Send as Pending</option>
              <option value="preparing" className="bg-teamax-dark">Preparing</option>
            </select>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mission-input col-span-2" title="Payment method">
              <option value="Cash" className="bg-teamax-dark">Cash</option>
              {paymentMethods.map(m => (
                <option key={m.id} value={m.name} className="bg-teamax-dark">{m.name}</option>
              ))}
            </select>
            {paymentMethod === 'Cash' ? (
              <>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tendered}
                  onChange={e => setTendered(e.target.value)}
                  placeholder="Cash tendered"
                  className="mission-input"
                />
                <div className={`rounded-xl flex flex-col justify-center px-3 border ${tendered && change < 0 ? 'border-red-500/40' : 'border-teamax-gold/20'} bg-black`}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-teamax-secondary">{tendered && change < 0 ? 'Short' : 'Change'}</span>
                  <span className={`text-sm font-bold tabular-nums ${tendered && change < 0 ? 'text-red-400' : 'text-teamax-primary'}`}>
                    {tendered ? peso(Math.abs(change)) : '—'}
                  </span>
                </div>
              </>
            ) : (
              <input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="Reference #" className="mission-input col-span-2" />
            )}
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="mission-input col-span-2" />
          </div>

          {message && (
            <p className={`text-xs flex items-center gap-2 ${message.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {message.ok && <CheckCircle2 className="h-4 w-4" />}
              {message.text}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={ticket.length === 0 || submitting || (paymentMethod === 'Cash' && !!tendered && change < 0)}
            className="mission-btn w-full py-4 text-xs disabled:opacity-40"
          >
            {submitting ? 'Recording...' : `Record Sale · ${peso(total)}`}
          </button>
        </div>
      </div>

      {/* Variation / add-on picker */}
      {picking && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={() => setPicking(null)}>
          <div className="mission-card bg-teamax-surface w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-lg font-display font-bold text-teamax-gold">{picking.name}</h3>
              <button onClick={() => setPicking(null)} className="text-teamax-secondary hover:text-teamax-gold" title="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!!picking.variations?.length && (
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary mb-2">Variation</p>
                <div className="grid grid-cols-2 gap-2">
                  {picking.variations.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setPickVariation(v)}
                      className={`rounded-xl p-3 border text-left text-sm ${pickVariation?.id === v.id
                        ? 'border-teamax-gold bg-teamax-gold/10 text-teamax-gold'
                        : 'border-teamax-gold/20 text-teamax-primary'}`}
                    >
                      <span className="block font-bold">{v.name}</span>
                      <span className="text-xs">{peso(v.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!!picking.addOns?.length && (
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary mb-2">Add-ons</p>
                <div className="space-y-2">
                  {picking.addOns.map(a => {
                    const on = pickAddOns.some(x => x.id === a.id);
                    return (
                      <label key={a.id} className={`rounded-xl flex items-center justify-between p-3 border cursor-pointer text-sm ${on ? 'border-teamax-gold bg-teamax-gold/10' : 'border-teamax-gold/20'}`}>
                        <span className="flex items-center gap-2 text-teamax-primary">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => setPickAddOns(prev => on ? prev.filter(x => x.id !== a.id) : [...prev, a])}
                            className="accent-[#D4AF37]"
                          />
                          {a.name}
                        </span>
                        <span className="text-teamax-gold text-xs font-bold">+{peso(a.price)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={confirmPick} className="mission-btn w-full py-4 text-xs">
              Add · {peso(unitPrice(picking, pickVariation, pickAddOns))}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosTerminal;
