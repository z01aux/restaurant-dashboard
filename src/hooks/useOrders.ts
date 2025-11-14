import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, DatabaseOrder, DatabaseOrderItem } from '../types';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Función para convertir de DatabaseOrder a Order
  const convertDatabaseOrderToOrder = async (dbOrder: DatabaseOrder): Promise<Order> => {
    // Obtener los items de la orden
    const { data: itemsData, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', dbOrder.id);

    if (error) throw error;

    const items: OrderItem[] = (itemsData || []).map((item: DatabaseOrderItem) => ({
      menuItem: {
        id: item.menu_item_id,
        name: item.menu_item_name,
        price: parseFloat(item.menu_item_price as any),
        category: '',
        type: 'food',
        available: true,
        isDailySpecial: false
      },
      quantity: item.quantity,
      notes: item.notes || ''
    }));

    return {
      id: dbOrder.id,
      orderNumber: dbOrder.order_number,      // Nuevo campo
      kitchenNumber: dbOrder.kitchen_number,  // Nuevo campo
      customerName: dbOrder.customer_name,
      phone: dbOrder.phone,
      address: dbOrder.address,
      tableNumber: dbOrder.table_number,
      source: {
        type: dbOrder.source_type,
        ...(dbOrder.source_type === 'delivery' && { deliveryAddress: dbOrder.address })
      },
      status: dbOrder.status,
      total: parseFloat(dbOrder.total as any),
      notes: dbOrder.notes,
      items: items,
      createdAt: new Date(dbOrder.created_at),
      updatedAt: new Date(dbOrder.updated_at)
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Convertir todas las órdenes
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(convertDatabaseOrderToOrder)
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    customerName: string;
    phone: string;
    address?: string;
    tableNumber?: string;
    source: {
      type: 'phone' | 'walk-in' | 'delivery';
      deliveryAddress?: string;
    };
    notes?: string;
    items: Array<{
      menuItem: {
        id: string;
        name: string;
        price: number;
      };
      quantity: number;
      notes?: string;
    }>;
  }) => {
    try {
      const total = orderData.items.reduce(
        (sum, item) => sum + (item.menuItem.price * item.quantity), 
        0
      );

      // Crear la orden en Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customerName,
          phone: orderData.phone,
          address: orderData.address,
          table_number: orderData.tableNumber,
          source_type: orderData.source.type,
          notes: orderData.notes,
          total: total,
          status: 'pending',
        }])
        .select(`
          *,
          order_number,
          kitchen_number
        `)
        .single();

      if (orderError) throw orderError;

      // Crear los items de la orden
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        menu_item_name: item.menuItem.name,
        menu_item_price: item.menuItem.price,
        quantity: item.quantity,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

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
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchOrders();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      console.log('🔄 Intentando eliminar orden:', orderId);
      
      // Primero eliminar los items de la orden (debido a la foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error eliminando items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Items eliminados, ahora eliminando orden...');

      // Luego eliminar la orden
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        console.error('Error eliminando orden:', orderError);
        throw orderError;
      }

      console.log('✅ Orden eliminada de Supabase');

      // Actualizar el estado local
      setOrders(prev => prev.filter(order => order.id !== orderId));
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error completo al eliminar:', error);
      return { success: false, error: error.message };
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
    deleteOrder,
  };
};
