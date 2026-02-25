// ============================================
// ARCHIVO: src/hooks/useFullDaySalesClosure.ts (CORREGIDO)
// Hook para gestión de caja de pedidos FullDay
// ============================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FullDayOrder } from './useFullDay';
import { SalesClosure, CashRegisterStatus, DailySummary, TopProduct } from '../types/sales';

// Extendemos la interfaz para FullDay
export interface FullDaySalesClosure extends Omit<SalesClosure, 'total_phone' | 'total_walk_in' | 'total_delivery'> {
  total_fullday: number;
}

export const useFullDaySalesClosure = () => {
  const [loading, setLoading] = useState(false);
  const [cashRegister, setCashRegister] = useState<CashRegisterStatus | null>(null);
  const [closures, setClosures] = useState<FullDaySalesClosure[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('restaurant-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, []);

  // Cargar estado de caja de FullDay
  const loadCashRegisterStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('current_cash_register_fullday')
        .select(`
          *,
          opened_by:opened_by (id, name, username),
          last_closure:last_closure_id (*)
        `)
        .eq('id', 1)
        .single();

      if (error) throw error;
      setCashRegister(data);
    } catch (error) {
      console.error('Error loading FullDay cash register:', error);
    }
  };

  // Cargar historial de cierres de FullDay
  const loadClosures = async (limit = 30) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_closures_fullday')
        .select(`
          *,
          opened_by:opened_by (id, name, username),
          closed_by:closed_by (id, name, username)
        `)
        .order('closed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setClosures(data || []);
    } catch (error) {
      console.error('Error loading FullDay closures:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generar resumen del día para FullDay
  const getTodaySummary = async (orders: FullDayOrder[]): Promise<DailySummary> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    // Calcular totales por método de pago
    const byPaymentMethod = {
      EFECTIVO: todayOrders
        .filter(o => o.payment_method === 'EFECTIVO')
        .reduce((sum, o) => sum + o.total, 0),
      YAPE_PLIN: todayOrders
        .filter(o => o.payment_method === 'YAPE/PLIN')
        .reduce((sum, o) => sum + o.total, 0),
      TARJETA: todayOrders
        .filter(o => o.payment_method === 'TARJETA')
        .reduce((sum, o) => sum + o.total, 0),
      NO_APLICA: todayOrders
        .filter(o => !o.payment_method)
        .reduce((sum, o) => sum + o.total, 0),
    };

    // Para FullDay, solo tenemos un tipo de pedido
    const byOrderType = {
      phone: 0,
      walk_in: 0,
      delivery: 0
    };

    // Contar por estado
    const byStatus = {
      pending: todayOrders.filter(o => o.status === 'pending').length,
      preparing: todayOrders.filter(o => o.status === 'preparing').length,
      ready: todayOrders.filter(o => o.status === 'ready').length,
      delivered: todayOrders.filter(o => o.status === 'delivered').length,
      cancelled: todayOrders.filter(o => o.status === 'cancelled').length,
    };

    // Calcular productos más vendidos
    const productMap = new Map<string, TopProduct>();
    
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.price * item.quantity;
        } else {
          productMap.set(item.id, {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            total: item.price * item.quantity,
            category: 'FullDay',
          });
        }
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      total_orders: todayOrders.length,
      total_amount: todayOrders.reduce((sum, o) => sum + o.total, 0),
      by_payment_method: byPaymentMethod,
      by_order_type: byOrderType,
      by_status: byStatus,
      top_products: topProducts,
    };
  };

  // Abrir caja de FullDay
  const openCashRegister = async (initialCash: number) => {
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      setLoading(true);

      const { data: current, error: checkError } = await supabase
        .from('current_cash_register_fullday')
        .select('is_open')
        .eq('id', 1)
        .single();

      if (checkError) throw checkError;

      if (current?.is_open) {
        return { success: false, error: 'La caja de FullDay ya está abierta' };
      }

      const { error } = await supabase
        .from('current_cash_register_fullday')
        .update({
          is_open: true,
          opened_at: new Date().toISOString(),
          opened_by: currentUser.id,
          initial_cash: initialCash,
          current_cash: initialCash,
        })
        .eq('id', 1);

      if (error) throw error;

      await loadCashRegisterStatus();
      return { success: true };
    } catch (error: any) {
      console.error('Error opening FullDay cash register:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Cerrar caja de FullDay
  const closeCashRegister = async (
    orders: FullDayOrder[],
    finalCash: number,
    notes: string = ''
  ) => {
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      setLoading(true);

      const { data: current, error: currentError } = await supabase
        .from('current_cash_register_fullday')
        .select('*')
        .eq('id', 1)
        .single();

      if (currentError) throw currentError;
      if (!current?.is_open) {
        return { success: false, error: 'La caja de FullDay no está abierta' };
      }

      const summary = await getTodaySummary(orders);

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      
      const { count, error: countError } = await supabase
        .from('sales_closures_fullday')
        .select('*', { count: 'exact', head: true })
        .eq('closure_date', today.toISOString().split('T')[0]);

      if (countError) throw countError;

      const closureNumber = `FULLDAY-CIERRE-${dateStr}-${String((count || 0) + 1).padStart(3, '0')}`;

      const { data: closure, error: insertError } = await supabase
        .from('sales_closures_fullday')
        .insert({
          closure_date: today.toISOString().split('T')[0],
          closure_number: closureNumber,
          opened_at: current.opened_at,
          closed_at: new Date().toISOString(),
          opened_by: current.opened_by,
          closed_by: currentUser.id,
          initial_cash: current.initial_cash,
          final_cash: finalCash,
          
          total_efectivo: summary.by_payment_method.EFECTIVO,
          total_yape_plin: summary.by_payment_method.YAPE_PLIN,
          total_tarjeta: summary.by_payment_method.TARJETA,
          total_no_aplica: summary.by_payment_method.NO_APLICA,
          
          total_fullday: summary.total_amount,
          
          total_orders: summary.total_orders,
          total_amount: summary.total_amount,
          
          orders_pending: summary.by_status.pending,
          orders_preparing: summary.by_status.preparing,
          orders_ready: summary.by_status.ready,
          orders_delivered: summary.by_status.delivered,
          orders_cancelled: summary.by_status.cancelled,
          
          notes: notes,
          top_products: summary.top_products,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('current_cash_register_fullday')
        .update({
          is_open: false,
          current_cash: 0,
          last_closure_id: closure.id,
        })
        .eq('id', 1);

      if (updateError) throw updateError;

      await loadCashRegisterStatus();
      await loadClosures();

      return { success: true, closure };
    } catch (error: any) {
      console.error('Error closing FullDay cash register:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Obtener cierre por ID
  const getClosureById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('sales_closures_fullday')
        .select(`
          *,
          opened_by:opened_by (id, name, username),
          closed_by:closed_by (id, name, username)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error getting FullDay closure:', error);
      return { success: false, error: error.message };
    }
  };

  // Buscar cierre por fecha
  const getClosureByDate = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_closures_fullday')
        .select('*')
        .eq('closure_date', dateStr)
        .order('closed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error getting FullDay closure by date:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    loadCashRegisterStatus();
    loadClosures(10);
  }, []);

  return {
    loading,
    cashRegister,
    closures,
    loadCashRegisterStatus,
    loadClosures,
    openCashRegister,
    closeCashRegister,
    getClosureById,
    getClosureByDate,
    getTodaySummary,
  };
};