// ============================================================
// ARCHIVO: src/hooks/useOEPOrders.ts
// Hook para gestionar pedidos OEP (con tipos)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { OEPOrder, OEPDatabaseOrder, OEPOrderStatus, OEPPaymentMethod } from '../types/oep';

export const useOEPOrders = () => {
    const [orders, setOrders] = useState<OEPOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const fetchOrders = useCallback(async (limit = 1000) => {
        try {
            setLoading(true);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('oep')
                .select('*')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            const convertedOrders: OEPOrder[] = (data || []).map((order: OEPDatabaseOrder) => ({
                ...order,
                status: order.status as OEPOrderStatus,
                payment_method: order.payment_method as OEPOrder['payment_method'],
                created_at: new Date(order.created_at),
                updated_at: new Date(order.updated_at)
            }));

            setOrders(convertedOrders);
            setTotalCount(convertedOrders.length);
        } catch (error) {
            console.error('Error fetching OEP orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateOrderStatus = async (orderId: string, status: OEPOrderStatus) => {
        try {
            const { error } = await supabase
                .from('oep')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status } : order
            ));

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const updateOrderPayment = async (orderId: string, paymentMethod: OEPPaymentMethod | null) => {
        try {
            const { error } = await supabase
                .from('oep')
                .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, payment_method: paymentMethod } : order
            ));

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const deleteOrder = async (orderId: string) => {
        try {
            const { error } = await supabase
                .from('oep')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.filter(order => order.id !== orderId));
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const getTodayOrders = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        });
    }, [orders]);

    useEffect(() => {
        fetchOrders();
    }, []);

    return {
        orders,
        loading,
        totalCount,
        fetchOrders,
        updateOrderStatus,
        updateOrderPayment,
        deleteOrder,
        getTodayOrders
    };
};