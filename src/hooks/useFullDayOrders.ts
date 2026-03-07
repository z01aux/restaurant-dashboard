// ============================================
// ARCHIVO: src/hooks/useFullDayOrders.ts (ACTUALIZADO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FullDayOrder, FullDayDatabaseOrder, FullDayOrderStatus, FullDayPaymentMethod } from '../types/fullday';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useFullDayOrders = () => {
  const [orders, setOrders] = useState<FullDayOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Función para convertir datos de DB a tipo Order
  const convertDatabaseOrder = (dbOrder: FullDayDatabaseOrder): FullDayOrder => ({
    ...dbOrder,
    status: dbOrder.status as FullDayOrderStatus,
    payment_method: dbOrder.payment_method as FullDayOrder['payment_method'],
    created_at: new Date(dbOrder.created_at),
    updated_at: new Date(dbOrder.updated_at)
  });

  // Cargar órdenes iniciales
  const fetchOrders = useCallback(async (limit = 1000) => {
    try {
      setLoading(true);
      setError(null);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('fullday')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      const convertedOrders: FullDayOrder[] = (data || []).map(convertDatabaseOrder);
      setOrders(convertedOrders);
      setTotalCount(convertedOrders.length);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🟢 NUEVO: Suscripción en tiempo real
  const handleInsert = useCallback((newOrder: any) => {
    setOrders(prev => {
      // Evitar duplicados
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

  useRealtimeSubscription<FullDayDatabaseOrder>({
    table: 'fullday',
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    enabled: true
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Actualizar estado de una orden
  const updateOrderStatus = async (orderId: string, status: FullDayOrderStatus) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));

      const { error } = await supabase
        .from('fullday')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      // Revertir optimistic update en caso de error
      await fetchOrders();
      return { success: false, error: error.message };
    }
  };

  // Actualizar método de pago
  const updateOrderPayment = async (orderId: string, paymentMethod: FullDayPaymentMethod) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, payment_method: paymentMethod } : order
      ));

      const { error } = await supabase
        .from('fullday')
        .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      // Revertir optimistic update en caso de error
      await fetchOrders();
      return { success: false, error: error.message };
    }
  };

  // Eliminar orden
  const deleteOrder = async (orderId: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setTotalCount(prev => prev - 1);

      const { error } = await supabase
        .from('fullday')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      // Revertir optimistic update en caso de error
      await fetchOrders();
      return { success: false, error: error.message };
    }
  };

  // Obtener pedidos de hoy
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
