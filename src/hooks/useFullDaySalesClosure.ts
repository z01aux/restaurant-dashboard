// ============================================
// ARCHIVO: src/hooks/useFullDaySalesClosure.ts
// CORREGIDO: Genera closure_number único con contador incremental
// ============================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useFullDaySalesClosure = () => {
  const [loading, setLoading] = useState(false);
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [closures, setClosures] = useState<any[]>([]);
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

  const loadCashRegisterStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('current_cash_register_fullday')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setCashRegister(data);
    } catch (error) {
      console.error('Error loading cash register:', error);
    }
  };

  const loadClosures = async (limit = 30) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_closures_fullday')
        .select('*')
        .order('closed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setClosures(data || []);
    } catch (error) {
      console.error('Error loading closures:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Función para generar closure_number único ────────────────────────────
  const generateClosureNumber = async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const baseNumber = `FULLDAY-CIERRE-${dateStr}`;

    // Buscar todos los cierres de hoy para saber el último número
    const { data, error } = await supabase
      .from('sales_closures_fullday')
      .select('closure_number')
      .ilike('closure_number', `${baseNumber}%`)
      .order('closure_number', { ascending: false });

    if (error) {
      console.error('Error verificando closure_number:', error);
      return `${baseNumber}-001`;
    }

    // Si no hay cierres hoy, empezar con 001
    if (!data || data.length === 0) {
      return `${baseNumber}-001`;
    }

    // Extraer el último número secuencial
    let maxNumber = 0;
    for (const item of data) {
      const match = item.closure_number.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }

    const nextNumber = maxNumber + 1;
    return `${baseNumber}-${String(nextNumber).padStart(3, '0')}`;
  };

  const openCashRegister = async (initialCash: number) => {
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      setLoading(true);
      
      // Verificar si ya hay una caja abierta
      const { data: current, error: checkError } = await supabase
        .from('current_cash_register_fullday')
        .select('is_open')
        .eq('id', 1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      if (current?.is_open) {
        return { success: false, error: 'Ya hay una caja abierta. Debes cerrarla primero.' };
      }

      const { error } = await supabase
        .from('current_cash_register_fullday')
        .upsert({
          id: 1,
          is_open: true,
          opened_at: new Date().toISOString(),
          opened_by: currentUser.id,
          initial_cash: initialCash,
          current_cash: initialCash,
        });

      if (error) throw error;

      await loadCashRegisterStatus();
      return { success: true };
    } catch (error: any) {
      console.error('Error opening cash register:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const closeCashRegister = async (finalCash: number, notes: string = '') => {
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
        return { success: false, error: 'La caja no está abierta' };
      }

      // Generar número de cierre único
      const closureNumber = await generateClosureNumber();

      // Crear el cierre
      const { error: insertError } = await supabase
        .from('sales_closures_fullday')
        .insert({
          closure_date: new Date().toISOString().split('T')[0],
          closure_number: closureNumber,
          opened_at: current.opened_at,
          closed_at: new Date().toISOString(),
          opened_by: current.opened_by,
          closed_by: currentUser.id,
          initial_cash: current.initial_cash,
          final_cash: finalCash,
          notes: notes,
          total_orders: 0,
          total_amount: 0,
          total_efectivo: 0,
          total_yape_plin: 0,
          total_tarjeta: 0,
          total_no_aplica: 0,
        });

      if (insertError) {
        // Si hay error de duplicado, reintentar una vez con nuevo número
        if (insertError.code === '23505') { // unique violation
          const newClosureNumber = await generateClosureNumber();
          const { error: retryError } = await supabase
            .from('sales_closures_fullday')
            .insert({
              closure_date: new Date().toISOString().split('T')[0],
              closure_number: newClosureNumber,
              opened_at: current.opened_at,
              closed_at: new Date().toISOString(),
              opened_by: current.opened_by,
              closed_by: currentUser.id,
              initial_cash: current.initial_cash,
              final_cash: finalCash,
              notes: notes,
              total_orders: 0,
              total_amount: 0,
              total_efectivo: 0,
              total_yape_plin: 0,
              total_tarjeta: 0,
              total_no_aplica: 0,
            });
          
          if (retryError) throw retryError;
        } else {
          throw insertError;
        }
      }

      // Cerrar la caja actual
      const { error: updateError } = await supabase
        .from('current_cash_register_fullday')
        .update({
          is_open: false,
          current_cash: 0,
        })
        .eq('id', 1);

      if (updateError) throw updateError;

      await loadCashRegisterStatus();
      await loadClosures();

      return { success: true };
    } catch (error: any) {
      console.error('Error closing cash register:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
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
    openCashRegister,
    closeCashRegister,
    loadClosures,
  };
};