import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  orders_count: number;
  total_spent: number;
  last_order: string | null;
  created_at: string;
  updated_at: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
      console.log('✅ Clientes cargados:', data?.length);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: {
    name: string;
    phone: string;
    address?: string;
    email?: string;
  }) => {
    try {
      // Verificar si ya existe un cliente con el mismo teléfono
      const { data: existing, error: checkError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerData.phone.trim());

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        return { 
          success: false, 
          error: 'Ya existe un cliente con este número de teléfono',
          data: existing[0]
        };
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerData.name.trim(),
          phone: customerData.phone.trim(),
          address: customerData.address?.trim(),
          email: customerData.email?.trim(),
          orders_count: 0,
          total_spent: 0,
          last_order: null
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCustomers(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? data : customer
      ));
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Función para buscar cliente por teléfono
  const findCustomerByPhone = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone.trim())
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Función para actualizar estadísticas manualmente - CORREGIDA
  const refreshCustomerStats = async (customerId: string) => {
    try {
      // Primero obtener el cliente para saber su teléfono
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;
      if (!customer) throw new Error('Cliente no encontrado');

      console.log('📞 Actualizando estadísticas para teléfono:', customer.phone);

      // Obtener todas las órdenes del cliente por su número de teléfono
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('phone', customer.phone); // Usamos 'phone' en lugar de 'customer_id'

      if (ordersError) throw ordersError;

      console.log('📊 Órdenes encontradas:', orders?.length);

      const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
      const ordersCount = orders?.length || 0;
      
      // Obtener la última orden
      let lastOrder = null;
      if (orders && orders.length > 0) {
        const { data: lastOrderData } = await supabase
          .from('orders')
          .select('created_at')
          .eq('phone', customer.phone)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        lastOrder = lastOrderData?.created_at || null;
      }

      // Actualizar cliente
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          orders_count: ordersCount,
          total_spent: totalSpent,
          last_order: lastOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      console.log('✅ Estadísticas actualizadas:', { ordersCount, totalSpent, lastOrder });

      await fetchCustomers();
      return { success: true };
    } catch (error: any) {
      console.error('Error en refreshCustomerStats:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findCustomerByPhone,
    refreshCustomerStats
  };
};