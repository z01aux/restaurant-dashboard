// ============================================
// ARCHIVO: src/hooks/useLoncheritas.ts
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LoncheritasOrder {
  id: string;
  order_number: string;
  student_id: string | null;
  student_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  payment_method: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useLoncheritas = () => {
  const [orders, setOrders] = useState<LoncheritasOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async (limit = 100) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loncheritas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching loncheritas orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData: {
    student_id?: string | null;
    student_name: string;
    grade: string;
    section: string;
    guardian_name: string;
    phone?: string;
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
        .from('loncheritas')
        .insert([{
          student_id: orderData.student_id || null,
          student_name: orderData.student_name,
          grade: orderData.grade,
          section: orderData.section,
          guardian_name: orderData.guardian_name,
          phone: orderData.phone || null,
          items: itemsJson,
          total: total,
          payment_method: orderData.payment_method,
          notes: orderData.notes,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      setOrders(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating loncheritas order:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: LoncheritasOrder['status']) => {
    try {
      setOrders(prev => prev.map(order =>
        order.id === id ? { ...order, status } : order
      ));

      const { error } = await supabase
        .from('loncheritas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      setOrders(prev => prev.filter(order => order.id !== id));
      const { error } = await supabase.from('loncheritas').delete().eq('id', id);
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
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
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
    deleteOrder,
    getTodayOrders,
    getOrdersByDateRange
  };
};
