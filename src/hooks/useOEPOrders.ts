// ============================================================
// ARCHIVO: src/hooks/useOEPOrders.ts
// ACTUALIZADO: Mapea created_by_id y created_by_name
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { OEPOrder, OEPOrderStatus, OEPPaymentMethod } from '../types/oep';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useOEPOrders = () => {
  const [orders, setOrders] = useState<OEPOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const convertDatabaseOrder = (dbOrder: any): OEPOrder => ({
    id: dbOrder.id,
    order_number:    dbOrder.order_number || '',
    customer_name:   dbOrder.customer_name || '',
    phone:           dbOrder.phone || null,
    address:         dbOrder.address || null,
    items:           Array.isArray(dbOrder.items) ? dbOrder.items : [],
    status:          (dbOrder.status as OEPOrderStatus) || 'pending',
    total:           Number(dbOrder.total) || 0,
    payment_method:  dbOrder.payment_method as OEPPaymentMethod | null,
    notes:           dbOrder.notes || null,
    created_at:      new Date(dbOrder.created_at),
    updated_at:      new Date(dbOrder.updated_at),
    // ── Quién generó el pedido ──────────────
    created_by_id:   dbOrder.created_by_id   || null,
    created_by_name: dbOrder.created_by_name || null,
  });

  const fetchOrders = useCallback(async (limit = 1000) => {
    try {
      setLoading(true);
      setError(null);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('oep')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const convertedOrders: OEPOrder[] = (data || []).map(convertDatabaseOrder);
      setOrders(convertedOrders);
      setTotalCount(convertedOrders.length);
    } catch (error) {
      console.error('Error fetching OEP orders:', error);
      setError('Error al cargar pedidos OEP');
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
    table: 'oep',
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    enabled: true
  });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderPayment = async (orderId: string, paymentMethod: OEPPaymentMethod | null) => {
    try {
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, payment_method: paymentMethod } : order
      ));

      const { error } = await supabase
        .from('oep')
        .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= today && orderDate < tomorrow;
    });
  }, [orders]);

  return {
    orders,
    loading,
    totalCount,
    error,
    fetchOrders,
    updateOrderPayment,
    getTodayOrders
  };
};
