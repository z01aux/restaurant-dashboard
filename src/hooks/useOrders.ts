// ============================================
// ARCHIVO COMPLETO: src/hooks/useOrders.ts
// CON FUNCIÓN PARA ACTUALIZAR MÉTODO DE PAGO
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, DatabaseOrder, DatabaseOrderItem } from '../types';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Cache para items de órdenes
  // const itemsCache = new Map<string, OrderItem[]>();

  // Función para actualizar estadísticas del cliente
  const updateCustomerStats = async (customerName: string, phone: string, orderTotal: number) => {
    try {
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

  // Función optimizada para convertir múltiples órdenes a la vez
  const convertDatabaseOrdersToOrders = async (dbOrders: DatabaseOrder[]): Promise<Order[]> => {
    if (!dbOrders.length) return [];

    // Obtener todos los IDs de las órdenes
    const orderIds = dbOrders.map(order => order.id);

    // Obtener TODOS los items de UNA SOLA consulta
    const { data: allItemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return [];
    }

    // Organizar items por order_id usando un Map (más rápido que reduce)
    const itemsByOrderId = new Map<string, DatabaseOrderItem[]>();
    allItemsData?.forEach(item => {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id)!.push(item);
    });

    // Convertir todas las órdenes en un solo mapeo
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
        updatedAt: new Date(dbOrder.updated_at)
      };
    });
  };

  // ============================================
  // CONSULTA ULTRARRÁPIDA: Carga masiva optimizada
  // ============================================
  const fetchOrders = useCallback(async (limit = 1000) => {
    try {
      setLoading(true);
      
      // Calcular fecha de hace 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Primero obtener el total de órdenes
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Obtener TODAS las órdenes de UNA SOLA consulta
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ordersError) throw ordersError;
      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Convertir todas las órdenes en UNA SOLA operación
      console.time('convertOrders');
      const convertedOrders = await convertDatabaseOrdersToOrders(ordersData);
      console.timeEnd('convertOrders');

      setOrders(convertedOrders);
      console.log(`✅ Cargadas ${convertedOrders.length} órdenes en tiempo récord`);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // CREAR ORDEN OPTIMIZADO (con inserción directa)
  // ============================================
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

      // Insertar orden
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

      // Preparar items para inserción masiva
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        menu_item_name: item.menuItem.name,
        menu_item_price: item.menuItem.price,
        quantity: item.quantity,
        notes: item.notes,
      }));

      // Insertar todos los items de UNA SOLA VEZ
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Actualizar estadísticas del cliente (en segundo plano, no bloquea)
      updateCustomerStats(orderData.customerName, orderData.phone, total).catch(console.error);

      // Crear objeto de orden para el frontend
      const newOrder: Order = {
        id: order.id,
        orderNumber: order.order_number,
        kitchenNumber: order.kitchen_number,
        customerName: orderData.customerName,
        phone: orderData.phone,
        address: orderData.address,
        tableNumber: orderData.tableNumber,
        source: orderData.source,
        status: 'pending',
        total: total,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        items: orderData.items.map(item => ({
          menuItem: {
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            category: '',
            type: 'food',
            available: true,
            isDailySpecial: false
          },
          quantity: item.quantity,
          notes: item.notes
        })),
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at)
      };

      // Actualizar el estado local INMEDIATAMENTE (sin esperar)
      setOrders(prev => [newOrder, ...prev]);
      
      return { success: true, order: newOrder };
    } catch (error: any) {
      console.error('Error en createOrder:', error);
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // ACTUALIZAR ESTADO (optimizado)
  // ============================================
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      // Actualizar UI inmediatamente (optimistic update)
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        // Revertir en caso de error
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: order.status } : order
        ));
        throw error;
      }
      
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // NUEVO MÉTODO: Actualizar método de pago
  // ============================================
  const updateOrderPayment = async (
    orderId: string, 
    paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | undefined
  ) => {
    try {
      // Guardar el método anterior por si hay que revertir
      const previousOrder = orders.find(o => o.id === orderId);
      
      // Actualizar UI inmediatamente (optimistic update)
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, paymentMethod } : order
      ));

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          payment_method: paymentMethod,
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        // Revertir en caso de error
        if (previousOrder) {
          setOrders(prev => prev.map(order => 
            order.id === orderId ? { ...order, paymentMethod: previousOrder.paymentMethod } : order
          ));
        }
        throw error;
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error actualizando método de pago:', error);
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // ELIMINAR ORDEN (optimizado)
  // ============================================
  const deleteOrder = async (orderId: string) => {
    try {
      // Eliminar de UI inmediatamente
      const orderToDelete = orders.find(o => o.id === orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId));

      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        // Revertir
        if (orderToDelete) {
          setOrders(prev => [...prev, orderToDelete]);
        }
        throw itemsError;
      }

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        // Revertir
        if (orderToDelete) {
          setOrders(prev => [...prev, orderToDelete]);
        }
        throw orderError;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // EXPORTAR A CSV (sin cambios)
  // ============================================
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

  // ============================================
  // OBTENER ÓRDENES DE HOY (optimizado)
  // ============================================
  const getTodayOrders = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  }, [orders]);

  // Cargar datos al iniciar UNA SOLA VEZ
  useEffect(() => {
    fetchOrders(500); // Cargar 500 órdenes iniciales
  }, []); // Sin dependencias para que solo cargue una vez

  return {
    orders,
    loading,
    totalCount,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    updateOrderPayment, // NUEVO MÉTODO EXPORTADO
    deleteOrder,
    exportOrdersToCSV,
    getTodayOrders
  };
};