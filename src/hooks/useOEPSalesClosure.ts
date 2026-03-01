// ============================================================
// ARCHIVO: src/hooks/useOEPSalesClosure.ts
// Hook para caja y cierres del módulo OEP
// Equivalente exacto de: src/hooks/useFullDaySalesClosure.ts
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useOEPSalesClosure = () => {
  const [loading,      setLoading]      = useState(false);
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [closures,     setClosures]     = useState<any[]>([]);
  const [currentUser,  setCurrentUser]  = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('restaurant-user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); }
      catch (error) { console.error('Error parsing user:', error); }
    }
  }, []);

  const loadCashRegisterStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('current_cash_register_oep')    // ← tabla oep
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setCashRegister(data);
    } catch (error) {
      console.error('Error loading OEP cash register:', error);
    }
  };

  const loadClosures = async (limit = 30) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_closures_oep')           // ← tabla oep
        .select('*')
        .order('closed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setClosures(data || []);
    } catch (error) {
      console.error('Error loading OEP closures:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCashRegister = async (initialCash: number) => {
    if (!currentUser) return { success: false, error: 'Usuario no autenticado' };

    try {
      setLoading(true);
      const { error } = await supabase
        .from('current_cash_register_oep')    // ← tabla oep
        .update({
          is_open:      true,
          opened_at:    new Date().toISOString(),
          opened_by:    currentUser.id,
          initial_cash: initialCash,
          current_cash: initialCash,
        })
        .eq('id', 1);

      if (error) throw error;
      await loadCashRegisterStatus();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const closeCashRegister = async (finalCash: number, notes: string = '') => {
    if (!currentUser) return { success: false, error: 'Usuario no autenticado' };

    try {
      setLoading(true);

      const { data: current, error: currentError } = await supabase
        .from('current_cash_register_oep')    // ← tabla oep
        .select('*')
        .eq('id', 1)
        .single();

      if (currentError) throw currentError;
      if (!current?.is_open) return { success: false, error: 'La caja no está abierta' };

      const today   = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

      const closureNumber = `OEP-CIERRE-${dateStr}-001`;

      const { error: insertError } = await supabase
        .from('sales_closures_oep')           // ← tabla oep
        .insert({
          closure_date:   today.toISOString().split('T')[0],
          closure_number: closureNumber,
          opened_at:      current.opened_at,
          closed_at:      new Date().toISOString(),
          opened_by:      current.opened_by,
          closed_by:      currentUser.id,
          initial_cash:   current.initial_cash,
          final_cash:     finalCash,
          notes:          notes,
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('current_cash_register_oep')    // ← tabla oep
        .update({ is_open: false, current_cash: 0 })
        .eq('id', 1);

      if (updateError) throw updateError;

      await loadCashRegisterStatus();
      await loadClosures();
      return { success: true };
    } catch (error: any) {
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
