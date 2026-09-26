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
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'preparing': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
${order.service_type === 'delivery' ? `📍 Address: ${order.address}${order.landmark ? `\n🏢 Landmark: ${order.landmark}` : ''}` : `🕒 Pickup Time: ${order.pickup_time}`}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-serif font-bold text-black flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Manage Orders
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
                        {['all', 'pending', 'preparing', 'completed', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filterStatus === status
                                    ? 'bg-black text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
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
                        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-serif">No orders found.</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`group bg-white border rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:shadow-lg ${selectedOrder?.id === order.id
                                    ? 'border-black ring-1 ring-black shadow-md'
                                    : 'border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                            {order.service_type === 'delivery' ? '🛵' : '🚶'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-black">{order.customer_name}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500">{formatDate(order.created_at)} • {order.order_items?.length || 0} items</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-black">₱{(order.total_price || 0)}</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{order.payment_method}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(order.id);
                                            }}
                                            className="p-2 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-full transition-colors flex bg-white"
                                            title="Delete Order Record"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <ChevronRight className={`h-5 w-5 text-gray-300 transition-transform ${selectedOrder?.id === order.id ? 'translate-x-1 text-black' : 'group-hover:translate-x-1'}`} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Order Details Panel */}
                <div className="lg:col-span-1">
                    {selectedOrder ? (
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm sticky top-6 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="font-serif font-bold text-lg text-black">Order Details</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopyOrderDetails(selectedOrder)}
                                        className={`p-2 rounded-full transition-all duration-200 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${isCopied ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-50 text-gray-500'}`}
                                        title="Copy Order Summary"
                                    >
                                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {isCopied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedOrder.id)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                                        title="Delete Order Record"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                            </div>

                            {/* Status Actions */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Status</p>
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
                                                ? 'bg-black text-white border-black shadow-md'
                                                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                                }`}
                                        >
                                            <s.icon className="h-3 w-3" />
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                                        <p className="text-sm font-medium text-black">{selectedOrder.customer_name}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {selectedOrder.contact_number}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service: {selectedOrder.service_type}</p>
                                        {selectedOrder.service_type === 'delivery' ? (
                                            <p className="text-sm font-medium text-black">
                                                {selectedOrder.address}
                                                {selectedOrder.landmark && <span className="block text-xs text-gray-500">Landmark: {selectedOrder.landmark}</span>}
                                            </p>
                                        ) : (
                                            <p className="text-sm font-medium text-black">Pickup Time: {selectedOrder.pickup_time}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CreditCard className="h-4 w-4 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment</p>
                                        <p className="text-sm font-medium text-black uppercase">{selectedOrder.payment_method}</p>
                                        {selectedOrder.reference_number && (
                                            <p className="text-xs text-gray-500 tracking-tighter">Ref: {selectedOrder.reference_number}</p>
                                        )}
                                    </div>
                                </div>

                                {selectedOrder.notes && (
                                    <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-2xl">
                                        <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</p>
                                            <p className="text-xs text-gray-700 italic">"{selectedOrder.notes}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Items */}
                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items</p>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedOrder.order_items?.map((item) => (
                                        <div key={item.id} className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <h5 className="text-xs font-bold text-black">{item.name}</h5>
                                                <p className="text-[10px] text-gray-500">
                                                    {item.quantity} x ₱{(item.unit_price || 0)}
                                                    {item.variation_name && ` • ${item.variation_name}`}
                                                    {item.flavor_name && ` • ${item.flavor_name}`}
                                                </p>
                                                {item.add_ons && item.add_ons.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.add_ons.map((ao: any, idx: number) => (
                                                            <span key={idx} className="bg-gray-100 text-[8px] px-1.5 py-0.5 rounded text-gray-600">
                                                                +{ao.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-black">₱{(item.total_item_price || 0)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center bg-black text-white p-4 rounded-2xl shadow-lg">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Grand Total</span>
                                    <span className="text-xl font-bold font-serif">₱{(selectedOrder.total_price || 0)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center h-[200px] flex flex-col items-center justify-center space-y-2">
                            <ChevronRight className="h-8 w-8 text-gray-200 rotate-90" />
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Select an order to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderManager;
