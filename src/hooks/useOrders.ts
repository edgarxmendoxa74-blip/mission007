import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderData } from '../types';

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
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
    }, []);


    const createOrder = async (orderData: OrderData) => {
        try {
            setLoading(true);

            // 1. Create the order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_name: orderData.customerName,
                    contact_number: orderData.contactNumber,
                    service_type: orderData.serviceType,
                    address: orderData.address,
                    landmark: orderData.landmark,
                    pickup_time: orderData.pickupTime,
                    payment_method: orderData.paymentMethod,
                    reference_number: orderData.referenceNumber,
                    total_price: orderData.total,
                    notes: orderData.notes,
                    status: 'pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create the order items
            const orderItems = orderData.items.map(item => ({
                order_id: order.id,
                menu_item_id: item.menuItemId,
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
