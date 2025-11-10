import { useState, useEffect } from 'react';
import { supabase, Order, OrderItem } from '../lib/supabase';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    customer_name: string;
    phone: string;
    address?: string;
    table_number?: string;
    source_type: 'phone' | 'walk-in' | 'delivery';
    notes?: string;
    items: Array<{
      menu_item_id: string;
      menu_item_name: string;
      menu_item_price: number;
      quantity: number;
      notes?: string;
    }>;
  }) => {
    try {
      const total = orderData.items.reduce(
        (sum, item) => sum + (item.menu_item_price * item.quantity), 
        0
      );

      // Crear la orden
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customer_name,
          phone: orderData.phone,
          address: orderData.address,
          table_number: orderData.table_number,
          source_type: orderData.source_type,
          notes: orderData.notes,
          total,
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear los items de la orden
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.menu_item_name,
        menu_item_price: item.menu_item_price,
        quantity: item.quantity,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Actualizar estadísticas del cliente
      await updateCustomerStats(orderData.phone, orderData.customer_name, total);

      await fetchOrders();
      return { success: true, order };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? data : order
      ));
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateCustomerStats = async (phone: string, name: string, orderTotal: number) => {
    try {
      // Buscar cliente existente
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (existingCustomer) {
        // Actualizar cliente existente
        await supabase
          .from('customers')
          .update({
            orders_count: existingCustomer.orders_count + 1,
            total_spent: existingCustomer.total_spent + orderTotal,
            last_order: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCustomer.id);
      } else {
        // Crear nuevo cliente
        await supabase
          .from('customers')
          .insert([{
            name,
            phone,
            orders_count: 1,
            total_spent: orderTotal,
            last_order: new Date().toISOString(),
          }]);
      }
    } catch (error) {
      console.error('Error updating customer stats:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    fetchOrders,
    createOrder,
    updateOrderStatus,
  };
};