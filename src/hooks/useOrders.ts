import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, DatabaseOrder, DatabaseOrderItem } from '../types';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Función para actualizar estadísticas del cliente
  const updateCustomerStats = async (customerName: string, phone: string, orderTotal: number) => {
    try {
      console.log('🔄 Actualizando estadísticas para cliente:', customerName, phone);
      
      // Buscar si el cliente ya existe
      const { data: existingCustomers, error: searchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone);

      if (searchError) {
        console.error('Error buscando cliente:', searchError);
        return;
      }

      if (existingCustomers && existingCustomers.length > 0) {
        // Cliente existe - actualizar sus estadísticas
        const customer = existingCustomers[0];
        console.log('✅ Cliente encontrado, actualizando estadísticas:', customer);

        const { error: updateError } = await supabase
          .from('customers')
          .update({
            orders_count: (customer.orders_count || 0) + 1,
            total_spent: (customer.total_spent || 0) + orderTotal,
            last_order: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id);

        if (updateError) {
          console.error('Error actualizando estadísticas del cliente:', updateError);
        } else {
          console.log('✅ Estadísticas de cliente actualizadas correctamente');
        }
      } else {
        // Cliente nuevo - crear registro
        console.log('🆕 Cliente nuevo, creando registro');
        
        const { error: insertError } = await supabase
          .from('customers')
          .insert([{
            name: customerName,
            phone: phone,
            orders_count: 1,
            total_spent: orderTotal,
            last_order: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error creando nuevo cliente:', insertError);
        } else {
          console.log('✅ Nuevo cliente creado correctamente');
        }
      }
    } catch (error) {
      console.error('Error en updateCustomerStats:', error);
    }
  };

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
          payment_method: orderData.paymentMethod,
          total: total,
          status: 'pending',
        }])
        .select('*, order_number, kitchen_number')
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

      // ACTUALIZAR ESTADÍSTICAS DEL CLIENTE
      await updateCustomerStats(orderData.customerName, orderData.phone, total);

      await fetchOrders();
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
      
      await fetchOrders();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      console.log('🔄 Intentando eliminar orden:', orderId);
      
      // Primero eliminar los items de la orden
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

  // Función para exportar órdenes a CSV
  const exportOrdersToCSV = (ordersToExport: Order[]) => {
    if (ordersToExport.length === 0) {
      alert('No hay órdenes para exportar');
      return;
    }

    const headers = [
      'Número de Orden',
      'Número de Cocina',
      'Cliente',
      'Teléfono',
      'Tipo',
      'Mesa',
      'Dirección',
      'Método de Pago',
      'Estado',
      'Total',
      'Notas',
      'Fecha Creación',
      'Items'
    ];

    const csvData = ordersToExport.map(order => {
      const itemsString = order.items.map(item => 
        `${item.quantity}x ${item.menuItem.name} - S/ ${(item.menuItem.price * item.quantity).toFixed(2)}`
      ).join('; ');

      return [
        order.orderNumber || '',
        order.kitchenNumber || '',
        order.customerName,
        order.phone,
        order.source.type === 'phone' ? 'Cocina' : order.source.type === 'walk-in' ? 'Local' : 'Delivery',
        order.tableNumber || '',
        order.address || '',
        order.paymentMethod || 'NO APLICA',
        order.status,
        `S/ ${order.total.toFixed(2)}`,
        order.notes || '',
        order.createdAt.toLocaleString(),
        itemsString
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para obtener órdenes del día actual
  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
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
    exportOrdersToCSV,
    getTodayOrders
  };
};