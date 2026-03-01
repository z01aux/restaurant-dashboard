// ============================================================
// ARCHIVO: src/hooks/useOEPSalesClosure.ts
// Hook para caja y cierres del módulo OEP
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { OEPOrder } from '../types/oep';

export const useOEPSalesClosure = () => {
    const [loading, setLoading] = useState(false);
    const [cashRegister, setCashRegister] = useState<any>(null);
    const [closures, setClosures] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

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
                .from('current_cash_register_oep')
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
                .from('sales_closures_oep')
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
                .from('current_cash_register_oep')
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
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const closeCashRegister = async (orders: OEPOrder[], finalCash: number, notes: string = '') => {
        if (!currentUser) return { success: false, error: 'Usuario no autenticado' };

        try {
            setLoading(true);

            const { data: current, error: currentError } = await supabase
                .from('current_cash_register_oep')
                .select('*')
                .eq('id', 1)
                .single();

            if (currentError) throw currentError;
            if (!current?.is_open) return { success: false, error: 'La caja no está abierta' };

            // Calcular resumen del día
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayOrders = orders.filter(o => {
                const d = new Date(o.created_at);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            });

            const totalAmount = todayOrders.reduce((s, o) => s + o.total, 0);
            const totalEfectivo = todayOrders.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
            const totalYape = todayOrders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
            const totalTarjeta = todayOrders.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
            const totalNoAplica = todayOrders.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);

            // Generar top productos
            const productMap = new Map();
            todayOrders.forEach(order => {
                order.items.forEach((item: any) => {
                    const existing = productMap.get(item.id);
                    if (existing) {
                        existing.quantity += item.quantity;
                        existing.total += item.price * item.quantity;
                    } else {
                        productMap.set(item.id, {
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                            total: item.price * item.quantity
                        });
                    }
                });
            });

            const topProducts = Array.from(productMap.values())
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);

            // Conteo por estado
            const ordersPending = todayOrders.filter(o => o.status === 'pending').length;
            const ordersPreparing = todayOrders.filter(o => o.status === 'preparing').length;
            const ordersReady = todayOrders.filter(o => o.status === 'ready').length;
            const ordersDelivered = todayOrders.filter(o => o.status === 'delivered').length;
            const ordersCancelled = todayOrders.filter(o => o.status === 'cancelled').length;

            const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
            const closureNumber = `OEP-CIERRE-${dateStr}-001`;

            // Crear el cierre
            const { data: closure, error: insertError } = await supabase
                .from('sales_closures_oep')
                .insert({
                    closure_date: today.toISOString().split('T')[0],
                    closure_number: closureNumber,
                    opened_at: current.opened_at,
                    closed_at: new Date().toISOString(),
                    opened_by: current.opened_by,
                    closed_by: currentUser.id,
                    initial_cash: current.initial_cash,
                    final_cash: finalCash,

                    total_efectivo: totalEfectivo,
                    total_yape_plin: totalYape,
                    total_tarjeta: totalTarjeta,
                    total_no_aplica: totalNoAplica,

                    total_orders: todayOrders.length,
                    total_amount: totalAmount,

                    orders_pending: ordersPending,
                    orders_preparing: ordersPreparing,
                    orders_ready: ordersReady,
                    orders_delivered: ordersDelivered,
                    orders_cancelled: ordersCancelled,

                    notes: notes,
                    top_products: topProducts
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Cerrar la caja
            const { error: updateError } = await supabase
                .from('current_cash_register_oep')
                .update({
                    is_open: false,
                    current_cash: 0,
                    last_closure_id: closure.id
                })
                .eq('id', 1);

            if (updateError) throw updateError;

            await loadCashRegisterStatus();
            await loadClosures();

            return { success: true, closure };
        } catch (error: any) {
            console.error('Error closing OEP cash register:', error);
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
        loadClosures
    };
};