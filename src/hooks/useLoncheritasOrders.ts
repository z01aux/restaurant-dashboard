// ============================================
// ARCHIVO: src/hooks/useLoncheritasOrders.ts (ACTUALIZADO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  LoncheritasOrder,
  LoncheritasDatabaseOrder,
  LoncheritasOrderStatus,
  LoncheritasPaymentMethod
} from '../types/loncheritas';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useLoncheritasOrders = () => {
  const [orders, setOrders] = useState<LoncheritasOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const convertDatabaseOrder = (dbOrder: LoncheritasDatabaseOrder): LoncheritasOrder => ({
    ...dbOrder,
    status: dbOrder.status as LoncheritasOrderStatus,
    payment_method: dbOrder.payment_method as LoncheritasOrder['payment_method'],
    created_at: new Date(dbOrder.created_at),
    updated_at: new Date(dbOrder.updated_at)
  });

  const fetchOrders = useCallback(async (limit = 1000) => {
    try {
      setLoading(true);
      setError(null);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('loncheritas')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const convertedOrders: LoncheritasOrder[] = (data || []).map(convertDatabaseOrder);
      setOrders(convertedOrders);
      setTotalCount(convertedOrders.length);
    } catch (error) {
      console.error('Error fetching loncheritas orders:', error);
      setError('Error al cargar pedidos Loncheritas');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🟢 Suscripción en tiempo real
  const handleInsert = useCallback((newOrder: any) => {
    setOrders(prev => {
      if (prev.some(o => o.id === newOrder.id)) return prev;
      return [convertDatabaseOrder(newOrder), ...prev];
    });
    setTotalCount(prev => prev + 1);
  }, []);

  const handleUpdate = useCallback((updatedOrder: any) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.id ? convertDatabaseOrder(updatedOrder) : order
    ));
  }, []);

  const handleDelete = useCallback((deletedId: string) => {
    setOrders(prev => {
      const newOrders = prev.filter(order => order.id !== deletedId);
      setTotalCount(newOrders.length);
      return newOrders;
    });
  }, []);

  useRealtimeSubscription({
    table: 'loncheritas',
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    enabled: true
  });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: LoncheritasOrderStatus) => {
    try {
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      ));

      const { error } = await supabase
        .from('loncheritas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      await fetchOrders();
      return { success: false, error: error.message };
    }
  };

  const updateOrderPayment = async (orderId: string, paymentMethod: LoncheritasPaymentMethod) => {
    try {
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, payment_method: paymentMethod } : order
      ));

      const { error } = await supabase
        .from('loncheritas')
        .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      await fetchOrders();
      return { success: false, error: error.message };
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setTotalCount(prev => prev - 1);

      const { error } = await supabase
        .from('loncheritas')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      await fetchOrders();
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

  return {
    orders,
    loading,
    totalCount,
    error,
    fetchOrders,
    updateOrderStatus,
    updateOrderPayment,
    deleteOrder,
    getTodayOrders
  };
};
