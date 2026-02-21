// ============================================
// ARCHIVO OPTIMIZADO: src/hooks/useOrders.ts
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, DatabaseOrder, DatabaseOrderItem } from '../types';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Función para actualizar estadísticas del cliente
  const updateCustomerStats = async (customerName: string, phone: string, orderTotal: number) => {
    try {
      console.log('🔄 Actualizando estadísticas para cliente:', customerName, phone);
      
      const { data: existingCustomers, error: searchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone);

      if (searchError) throw searchError;

      if (existingCustomers && existingCustomers.length > 0) {
        const customer = existingCustomers[0];
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            orders_count: (customer.orders_count || 0) + 1,
            total_spent: (customer.total_spent || 0) + orderTotal,
            last_order: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id);

        if (updateError) console.error('Error actualizando estadísticas:', updateError);
      } else {
        const { error: insertError } = await supabase
          .from('customers')
          .insert([{
            name: customerName,
            phone: phone,
            orders_count: 1,
            total_spent: orderTotal,
            last_order: new Date().toISOString(),
          }]);

        if (insertError) console.error('Error creando nuevo cliente:', insertError);
      }
    } catch (error) {
      console.error('Error en updateCustomerStats:', error);
    }
  };

  // Función para convertir de DatabaseOrder a Order
  const convertDatabaseOrderToOrder = async (dbOrder: DatabaseOrder): Promise<Order> => {
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
      items: items,
      createdAt: new Date(dbOrder.created_at),
      updatedAt: new Date(dbOrder.updated_at)
    };
  };

  // ============================================
  // CONSULTA OPTIMIZADA: Solo últimos 30 días
  // ============================================
  const fetchOrders = useCallback(async (limit = 500) => {
    try {
      setLoading(true);
      
      // Calcular fecha de hace 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Primero obtener el total de órdenes (para referencia)
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Luego obtener las órdenes con límite
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ordersError) throw ordersError;

      // Convertir las órdenes en lotes para no bloquear
      const ordersWithItems: Order[] = [];
      
      // Procesar en lotes de 10 para no sobrecargar
      for (let i = 0; i < (ordersData || []).length; i += 10) {
        const batch = (ordersData || []).slice(i, i + 10);
        const batchResults = await Promise.all(
          batch.map(dbOrder => convertDatabaseOrderToOrder(dbOrder))
        );
        ordersWithItems.push(...batchResults);
        
        // Pequeña pausa para no bloquear el event loop
        if (i + 10 < (ordersData || []).length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setOrders(ordersWithItems);
      console.log(`✅ Cargadas ${ordersWithItems.length} órdenes de los últimos 30 días`);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    paymentMethod?: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA';
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
        }])
        .select('*, order_number, kitchen_number')
        .single();

      if (orderError) throw orderError;

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

      await updateCustomerStats(orderData.customerName, orderData.phone, total);

      // Actualizar la lista de órdenes (agregar la nueva al inicio)
      const newOrder = await convertDatabaseOrderToOrder(order);
      setOrders(prev => [newOrder, ...prev]);
      
      return { success: true, order };
    } catch (error: any) {
      console.error('Error en createOrder:', error);
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
      
      // Actualizar el estado local
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      
      return { success: true, data };
    } catch (error: any) {
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

      setOrders(prev => prev.filter(order => order.id !== orderId));
      
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
      'PRODUCTOS'
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
          order.source.type === 'walk-in' ? 'LOCAL' : 'DELIVERY',
        fecha,
        hora,
        order.orderNumber || `ORD-${order.id.slice(-8)}`,
        order.kitchenNumber || `COM-${order.id.slice(-8)}`,
        order.phone,
        productos
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

  // Cargar datos al iniciar
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    totalCount,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    exportOrdersToCSV,
    getTodayOrders
  };
};