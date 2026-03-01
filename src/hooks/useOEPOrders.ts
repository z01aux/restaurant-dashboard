// ============================================================
// ARCHIVO: src/hooks/useOEPOrders.ts (VERSIÓN SIMPLIFICADA)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { OEPOrder, OEPOrderStatus, OEPPaymentMethod } from '../types/oep';

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

            const convertedOrders: OEPOrder[] = (data || []).map((order: any) => ({
                id: order.id,
                order_number: order.order_number || '',
                customer_name: order.customer_name || '',
                phone: order.phone || null,
                address: order.address || null,
                items: Array.isArray(order.items) ? order.items : [],
                status: (order.status as OEPOrderStatus) || 'pending',
                total: Number(order.total) || 0,
                payment_method: order.payment_method as OEPPaymentMethod | null,
                notes: order.notes || null,
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

    const getTodayOrders = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= today && orderDate < tomorrow;
        });
    }, [orders]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return {
        orders,
        loading,
        totalCount,
        fetchOrders,
        updateOrderPayment,
        getTodayOrders
    };
};