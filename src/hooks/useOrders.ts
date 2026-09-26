import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderData } from '../types';

// Items from the static smart menu use slug ids (e.g. "coffee-black-protocol"),
// which can't go into the uuid menu_item_id column. The item name, price,
// variation and add-ons are stored on the order line regardless.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const toMenuItemId = (id: string) => (UUID_RE.test(id) ? id : null);

// Customers can create orders but not read them (RLS), so the storefront
// passes { autoFetch: false } to skip the admin order feed.
export const useOrders = ({ autoFetch = true }: { autoFetch?: boolean } = {}) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (*)
        `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setOrders(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!autoFetch) return;
        fetchOrders();

        // Subscribe to real-time changes
        const ordersSubscription = supabase
            .channel('public:orders')
            .on('postgres_changes' as any, { event: '*', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersSubscription);
        };
    }, [autoFetch]);


    // Storefront orders are always inserted as 'pending' (the only status anon
    // may insert); the admin POS records walk-in sales directly as completed.
    const createOrder = async (orderData: OrderData, status: Order['status'] = 'pending') => {
        try {
            setLoading(true);

            // 1. Create the order. The id is generated client-side because
            // anonymous customers can't select the inserted row back.
            const order = { id: crypto.randomUUID() };
            const { error: orderError } = await supabase
                .from('orders')
                .insert({
                    id: order.id,
                    customer_name: orderData.customerName,
                    contact_number: orderData.contactNumber,
                    service_type: orderData.serviceType,
                    table_number: orderData.tableNumber,
                    address: orderData.address,
                    landmark: orderData.landmark,
                    pickup_time: orderData.pickupTime,
                    payment_method: orderData.paymentMethod,
                    reference_number: orderData.referenceNumber,
                    total_price: orderData.total,
                    notes: orderData.notes,
                    status
                });

            if (orderError) throw orderError;

            // 2. Create the order items
            const orderItems = orderData.items.map(item => ({
                order_id: order.id,
                menu_item_id: toMenuItemId(item.menuItemId),
                name: item.name,
                quantity: item.quantity,
                unit_price: item.totalPrice,
                variation_name: item.selectedVariation?.name,
                flavor_name: item.selectedFlavor,
                add_ons: item.selectedAddOns || [],
                total_item_price: item.totalPrice * item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            if (autoFetch) fetchOrders();
            return { success: true, order };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, status: Order['status']) => {
        try {
            const { error: updateError } = await supabase
                .from('orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (updateError) throw updateError;

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const deleteOrder = async (orderId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (deleteError) throw deleteError;

            setOrders(prev => prev.filter(o => o.id !== orderId));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    return {
        orders,
        loading,
        error,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        refreshOrders: fetchOrders
    };
};
