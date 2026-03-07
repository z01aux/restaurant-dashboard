// ============================================
// ARCHIVO: src/hooks/useOrders.ts (ACTUALIZADO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, DatabaseOrder, DatabaseOrderItem } from '../types';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const convertDatabaseOrdersToOrders = async (dbOrders: DatabaseOrder[]): Promise<Order[]> => {
    if (!dbOrders.length) return [];

    const orderIds = dbOrders.map(order => order.id);

    const { data: allItemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return [];
    }

    const itemsByOrderId = new Map<string, DatabaseOrderItem[]>();
    allItemsData?.forEach(item => {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id)!.push(item);
    });

    return dbOrders.map(dbOrder => {
      const items = itemsByOrderId.get(dbOrder.id) || [];
      
      const orderItems: OrderItem[] = items.map(item => ({
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
        orderNumber: dbOrder.order_number,
        kitchenNumber: dbOrder.kitchen_number,
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
        paymentMethod: dbOrder.payment_method,
        items: orderItems,
        createdAt: new Date(dbOrder.created_at),
        updatedAt: new Date(dbOrder.updated_at),
        studentId: dbOrder.student_id,
        orderType: dbOrder.order_type as 'regular' | 'fullday'
      };
    });
  };

  const fetchOrders = useCallback(async (limit = 1000) => {
    try {
      setLoading(true);
      setError(null);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ordersError) throw ordersError;
      
      const convertedOrders = await convertDatabaseOrdersToOrders(ordersData || []);
      setOrders(convertedOrders);
      setTotalCount(convertedOrders.length);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🟢 Función para recargar una orden específica (usada después de INSERT/UPDATE)
  const refreshOrder = useCallback(async (orderId: string) => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!orderData) return;

      const converted = await convertDatabaseOrdersToOrders([orderData]);
      if (converted.length > 0) {
        setOrders(prev => {
          const exists = prev.some(o => o.id === orderId);
          if (exists) {
            return prev.map(o => o.id === orderId ? converted[0] : o);
          } else {
            return [converted[0], ...prev];
          }
        });
      }
    } catch (error) {
      console.error('Error refreshing order:', error);
    }
  }, []);

  // 🟢 Suscripción en tiempo real para órdenes
  const handleOrderInsert = useCallback((newOrder: any) => {
    refreshOrder(newOrder.id);
  }, [refreshOrder]);

  const handleOrderUpdate = useCallback((updatedOrder: any) => {
    refreshOrder(updatedOrder.id);
  }, [refreshOrder]);

  const handleOrderDelete = useCallback((deletedId: string) => {
    setOrders(prev => prev.filter(order => order.id !== deletedId));
    setTotalCount(prev => prev - 1);
  }, []);

  useRealtimeSubscription({
    table: 'orders',
    onInsert: handleOrderInsert,
    onUpdate: handleOrderUpdate,
    onDelete: handleOrderDelete,
    enabled: true
  });

  // 🟢 Suscripción en tiempo real para items de órdenes
  useRealtimeSubscription({
    table: 'order_items',
    onInsert: (newItem: any) => refreshOrder(newItem.order_id),
    onUpdate: (updatedItem: any) => refreshOrder(updatedItem.order_id),
    onDelete: (deletedId: string) => {
      // Para DELETE necesitamos buscar la orden afectada
      // Esto es más complejo, podríamos simplemente recargar todo
      fetchOrders();
    },
    enabled: true
  });

  useEffect(() => {
    fetchOrders(500);
  }, []);

  const createOrder = async (orderData: any) => {
    try {
      const total = orderData.items.reduce(
        (sum: number, item: any) => sum + (item.menuItem.price * item.quantity), 
        0
      );

      const orderType = orderData.source.type === 'fullDay' ? 'fullday' : 'regular';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customerName,
          phone: orderData.phone,
          address: orderData.address,
          table_number: orderData.tableNumber,
          source_type: orderData.source.type,
          notes: orderData.notes,
          payment_method: orderData.paymentMethod,
          total: total,
          status: 'pending',
          student_id: orderData.studentId || null,
          order_type: orderType
        }])
        .select('*, order_number, kitchen_number')
        .single();

      if (orderError) throw orderError;

      const orderItems = orderData.items.map((item: any) => ({
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

      // No necesitamos actualizar setOrders manualmente
      // La suscripción lo hará automáticamente

      return { success: true, order };
    } catch (error: any) {
      console.error('Error en createOrder:', error);
      return { success: false, error: error.message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      // No necesitamos actualizar setOrders, la suscripción lo hará
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateOrderPayment = async (orderId: string, paymentMethod: Order['paymentMethod']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando método de pago:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      // No necesitamos actualizar setOrders, la suscripción lo hará
      return { success: true };
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      return { success: false, error: error.message };
    }
  };

  const exportOrdersToCSV = (ordersToExport: Order[]) => {
    if (ordersToExport.length === 0) {
      alert('No hay órdenes para exportar');
      return;
    }

    const headers = [
      'CLIENTE',
      'MONTO TOTAL',
      'MÉTODO DE PAGO',
      'TIPO DE PEDIDO',
      'FECHA',
      'HORA',
      'N° ORDEN',
      'N° COMANDA',
      'TELÉFONO',
      'PRODUCTOS',
      'TIPO'
    ];

    const csvData = ordersToExport.map(order => {
      const fecha = order.createdAt.toLocaleDateString('es-PE');
      const hora = order.createdAt.toLocaleTimeString('es-PE');
      const productos = order.items.map(item => 
        `${item.quantity}x ${item.menuItem.name}`
      ).join(' | ');

      return [
        order.customerName.toUpperCase(),
        `S/ ${order.total.toFixed(2)}`,
        order.paymentMethod || 'NO APLICA',
        order.source.type === 'phone' ? 'COCINA' : 
          order.source.type === 'walk-in' ? 'LOCAL' : 
          order.source.type === 'delivery' ? 'DELIVERY' : 'FULLDAY',
        fecha,
        hora,
        order.orderNumber || `ORD-${order.id.slice(-8)}`,
        order.kitchenNumber || `COM-${order.id.slice(-8)}`,
        order.phone,
        productos,
        order.orderType === 'fullday' ? 'FULLDAY' : 'REGULAR'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTodayOrders = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  }, [orders]);

  const getRegularOrders = useCallback(() => {
    return orders.filter(order => order.orderType === 'regular');
  }, [orders]);

  const getFullDayOrders = useCallback(() => {
    return orders.filter(order => order.orderType === 'fullday');
  }, [orders]);

  return {
    orders,
    loading,
    totalCount,
    error,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    updateOrderPayment,
    deleteOrder,
    exportOrdersToCSV,
    getTodayOrders,
    getRegularOrders,
    getFullDayOrders
  };
};
