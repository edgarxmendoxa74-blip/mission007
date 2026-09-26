import React, { useState } from 'react';
import { Package, Clock, CheckCircle2, XCircle, Search, Filter, ChevronRight, MapPin, Phone, User, CreditCard, MessageSquare, Trash2, Copy, Check } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../types';

const OrderManager: React.FC = () => {
    const { orders, loading, updateOrderStatus, deleteOrder } = useOrders();
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'preparing': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
        const result = await updateOrderStatus(orderId, newStatus);
        if (result.success && selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
    };

    const handleDelete = async (orderId: string) => {
        if (confirm('Are you sure you want to delete this order record?')) {
            const result = await deleteOrder(orderId);
            if (result.success && selectedOrder?.id === orderId) {
                setSelectedOrder(null);
            }
        }
    };

    const handleCopyOrderDetails = (order: Order) => {
        const itemsList = order.order_items?.map(item => {
            let details = `${item.quantity}x ${item.name}`;
            if (item.variation_name) details += ` (${item.variation_name})`;
            if (item.flavor_name) details += ` - ${item.flavor_name}`;
            if (item.add_ons && item.add_ons.length > 0) {
                details += ` + ${item.add_ons.map((ao: any) => ao.name).join(', ')}`;
            }
            return details;
        }).join('\n');

        const summary = `
📦 ORDER #${order.id.slice(0, 8).toUpperCase()}
👤 Customer: ${order.customer_name}
📞 Contact: ${order.contact_number}
🛵 Service: ${order.service_type.toUpperCase()}
${order.service_type === 'delivery'
            ? `📍 Address: ${order.address}${order.landmark ? `\n🏢 Landmark: ${order.landmark}` : ''}`
            : order.service_type === 'dine-in'
                ? `🍽️ Table: ${order.table_number || 'Not specified'}`
                : `🕒 Pickup Time: ${order.pickup_time}`}
💳 Payment: ${order.payment_method.toUpperCase()}
${order.notes ? `📝 Notes: ${order.notes}\n` : ''}
🛒 Items:
${itemsList}

💰 Total: ₱${(order.total_price || 0)}
`.trim();

        navigator.clipboard.writeText(summary);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };


    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teamax-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-display font-bold text-teamax-gold tracking-[0.08em] flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Manage Orders
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teamax-secondary" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-black border border-teamax-gold/30 text-teamax-primary placeholder:text-teamax-secondary/50 focus:ring-teamax-gold focus:border-teamax-gold rounded-xl outline-none text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-black border border-teamax-gold/30 rounded-xl p-1">
                        {['all', 'pending', 'preparing', 'completed', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${filterStatus === status
                                    ? 'mission-btn'
                                    : 'text-teamax-secondary hover:text-teamax-gold border-teamax-gold/30 hover:bg-teamax-gold/10'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders List */}
                <div className="lg:col-span-2 space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="bg-teamax-surface border border-dashed border-teamax-gold/30 rounded-xl p-12 text-center">
                            <Package className="h-12 w-12 text-teamax-secondary mx-auto mb-4" />
                            <p className="text-teamax-secondary font-display">No orders found.</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`group bg-teamax-surface border rounded-xl p-4 transition-all duration-300 cursor-pointer hover:shadow-gold shadow-gold ${selectedOrder?.id === order.id
                                    ? 'border-teamax-gold ring-1 ring-teamax-gold'
                                    : 'border-teamax-gold/20 hover:border-teamax-gold/40'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border ${order.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-black border-teamax-gold/20 text-teamax-secondary'
                                            }`}>
                                            {order.service_type === 'delivery' ? '🛵' : order.service_type === 'dine-in' ? '🍽️' : '🚶'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-teamax-primary">{order.customer_name}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-teamax-secondary">{formatDate(order.created_at)} • {order.order_items?.length || 0} items</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-teamax-primary">₱{(order.total_price || 0)}</p>
                                            <p className="text-[8px] font-bold text-teamax-secondary uppercase tracking-widest">{order.payment_method}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(order.id);
                                            }}
                                            className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl transition-colors flex"
                                            title="Delete Order Record"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <ChevronRight className={`h-5 w-5 text-teamax-secondary transition-transform ${selectedOrder?.id === order.id ? 'translate-x-1 text-teamax-gold' : 'group-hover:translate-x-1'}`} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Order Details Panel */}
                <div className="lg:col-span-1">
                    {selectedOrder ? (
                        <div className="mission-card rounded-xl p-6 shadow-gold sticky top-6 space-y-6 border border-teamax-gold/20 bg-teamax-surface">
                            <div className="flex items-center justify-between border-b border-teamax-gold/20 pb-4">
                                <h3 className="font-display font-bold text-lg text-teamax-gold tracking-[0.08em]">Order Details</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopyOrderDetails(selectedOrder)}
                                        className={`p-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider border ${isCopied ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'hover:bg-teamax-gold/10 text-teamax-secondary border-teamax-gold/20 hover:text-teamax-gold'}`}
                                        title="Copy Order Summary"
                                    >
                                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {isCopied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedOrder.id)}
                                        className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                                        title="Delete Order Record"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                            </div>

                            {/* Status Actions */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold">Update Status</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'pending', icon: Clock, label: 'Pending' },
                                        { id: 'preparing', icon: Package, label: 'Preparing' },
                                        { id: 'completed', icon: CheckCircle2, label: 'Complete' },
                                        { id: 'cancelled', icon: XCircle, label: 'Cancel' }
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleStatusUpdate(selectedOrder.id, s.id as any)}
                                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${selectedOrder.status === s.id
                                                ? 'mission-btn'
                                                : 'bg-teamax-surface text-teamax-secondary border border-teamax-gold/20 hover:border-teamax-gold/40'
                                                }`}
                                        >
                                            <s.icon className="h-3 w-3" />
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="space-y-4 pt-4 border-t border-teamax-gold/20">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 text-teamax-secondary mt-1" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold">Customer</p>
                                        <p className="text-sm font-medium text-teamax-primary">{selectedOrder.customer_name}</p>
                                        <p className="text-xs text-teamax-secondary flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {selectedOrder.contact_number}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-teamax-secondary mt-1" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold">Service: {selectedOrder.service_type}</p>
                                        {selectedOrder.service_type === 'delivery' ? (
                                            <p className="text-sm font-medium text-teamax-primary">
                                                {selectedOrder.address}
                                                {selectedOrder.landmark && <span className="block text-xs text-teamax-secondary">Landmark: {selectedOrder.landmark}</span>}
                                            </p>
                                        ) : selectedOrder.service_type === 'dine-in' ? (
                                            <p className="text-sm font-medium text-teamax-primary">Table: {selectedOrder.table_number || 'Not specified'}</p>
                                        ) : (
                                            <p className="text-sm font-medium text-teamax-primary">Pickup Time: {selectedOrder.pickup_time}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CreditCard className="h-4 w-4 text-teamax-secondary mt-1" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold">Payment</p>
                                        <p className="text-sm font-medium text-teamax-primary uppercase">{selectedOrder.payment_method}</p>
                                        {selectedOrder.reference_number && (
                                            <p className="text-xs text-teamax-secondary tracking-tighter">Ref: {selectedOrder.reference_number}</p>
                                        )}
                                    </div>
                                </div>

                                {selectedOrder.notes && (
                                    <div className="flex items-start gap-3 bg-black border border-teamax-gold/10 p-3 rounded-xl">
                                        <MessageSquare className="h-4 w-4 text-teamax-secondary mt-1" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold">Notes</p>
                                            <p className="text-xs text-teamax-primary italic">"{selectedOrder.notes}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Items */}
                            <div className="space-y-3 pt-4 border-t border-teamax-gold/20">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-gold">Items</p>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedOrder.order_items?.map((item) => (
                                        <div key={item.id} className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <h5 className="text-xs font-bold text-teamax-primary">{item.name}</h5>
                                                <p className="text-[10px] text-teamax-secondary">
                                                    {item.quantity} x ₱{(item.unit_price || 0)}
                                                    {item.variation_name && ` • ${item.variation_name}`}
                                                    {item.flavor_name && ` • ${item.flavor_name}`}
                                                </p>
                                                {item.add_ons && item.add_ons.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.add_ons.map((ao: any, idx: number) => (
                                                            <span key={idx} className="bg-teamax-gold/10 text-teamax-secondary text-[8px] px-1.5 py-0.5 rounded-xl border border-teamax-gold/20">
                                                                +{ao.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-teamax-primary">₱{(item.total_item_price || 0)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-teamax-gold/20">
                                <div className="flex justify-between items-center bg-teamax-gold text-black p-4 rounded-xl shadow-gold">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Grand Total</span>
                                    <span className="text-xl font-bold font-display">₱{(selectedOrder.total_price || 0)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-teamax-surface border border-dashed border-teamax-gold/30 rounded-xl p-12 text-center h-[200px] flex flex-col items-center justify-center space-y-2">
                            <ChevronRight className="h-8 w-8 text-teamax-secondary rotate-90" />
                            <p className="text-teamax-secondary text-xs font-bold uppercase tracking-widest">Select an order to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderManager;
