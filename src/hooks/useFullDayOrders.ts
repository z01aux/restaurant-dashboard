import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FullDayOrder } from '../types/fullday';

export const useFullDayOrders = () => {
  const [orders, setOrders] = useState<FullDayOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = useCallback(async (limit = 1000) => {
    try {
      setLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('fullday')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      const convertedOrders = (data || []).map(order => ({
        ...order,
        created_at: new Date(order.created_at),
        updated_at: new Date(order.updated_at)
      }));
      
      setOrders(convertedOrders);
      setTotalCount(convertedOrders.length);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('fullday')
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

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('fullday')
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
    deleteOrder,
    getTodayOrders
  };
};