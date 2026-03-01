// ============================================================
// ARCHIVO: src/hooks/useOEP.ts
// Hook principal para pedidos OEP
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { OEPOrder, OEPDatabaseOrder } from '../types/oep';

export const useOEP = () => {
    const [orders, setOrders] = useState<OEPOrder[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = useCallback(async (limit = 100) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('oep')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            const convertedOrders: OEPOrder[] = (data || []).map((order: OEPDatabaseOrder) => ({
                ...order,
                created_at: new Date(order.created_at),
                updated_at: new Date(order.updated_at)
            }));

            setOrders(convertedOrders);
        } catch (error) {
            console.error('Error fetching OEP orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createOrder = useCallback(async (orderData: {
        customer_name: string;
        phone?: string;
        address?: string;
        items: Array<{
            menuItem: {
                id: string;
                name: string;
                price: number;
            };
            quantity: number;
            notes?: string;
        }>;
        payment_method?: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA';
        notes?: string;
    }) => {
        try {
            const total = orderData.items.reduce(
                (sum, item) => sum + (item.menuItem.price * item.quantity),
                0
            );

            const itemsJson = orderData.items.map(item => ({
                id: item.menuItem.id,
                name: item.menuItem.name,
                price: item.menuItem.price,
                quantity: item.quantity,
                notes: item.notes
            }));

            const { data, error } = await supabase
                .from('oep')
                .insert([{
                    customer_name: orderData.customer_name,
                    phone: orderData.phone || null,
                    address: orderData.address || null,
                    items: itemsJson,
                    total: total,
                    payment_method: orderData.payment_method,
                    notes: orderData.notes,
                    status: 'pending'
                }])
                .select()
                .single();

            if (error) throw error;

            const newOrder: OEPOrder = {
                ...data,
                created_at: new Date(data.created_at),
                updated_at: new Date(data.updated_at)
            };

            setOrders(prev => [newOrder, ...prev]);
            return { success: true, data: newOrder };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, []);

    const updateOrderStatus = useCallback(async (id: string, status: OEPOrder['status']) => {
        try {
            setOrders(prev => prev.map(order =>
                order.id === id ? { ...order, status } : order
            ));

            const { error } = await supabase
                .from('oep')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            const original = orders.find(o => o.id === id);
            if (original) {
                setOrders(prev => prev.map(order =>
                    order.id === id ? original : order
                ));
            }
            return { success: false, error: error.message };
        }
    }, [orders]);

    const updateOrderPayment = useCallback(async (id: string, paymentMethod: OEPOrder['payment_method']) => {
        try {
            setOrders(prev => prev.map(order =>
                order.id === id ? { ...order, payment_method: paymentMethod } : order
            ));

            const { error } = await supabase
                .from('oep')
                .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            const original = orders.find(o => o.id === id);
            if (original) {
                setOrders(prev => prev.map(order =>
                    order.id === id ? original : order
                ));
            }
            return { success: false, error: error.message };
        }
    }, [orders]);

    const deleteOrder = useCallback(async (id: string) => {
        try {
            setOrders(prev => prev.filter(order => order.id !== id));
            const { error } = await supabase.from('oep').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, []);

    const getTodayOrders = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        });
    }, [orders]);

    const getOrdersByDateRange = useCallback((startDate: Date, endDate: Date) => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= start && orderDate <= end;
        });
    }, [orders]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return {
        orders,
        loading,
        fetchOrders,
        createOrder,
        updateOrderStatus,
        updateOrderPayment,
        deleteOrder,
        getTodayOrders,
        getOrdersByDateRange
    };
};