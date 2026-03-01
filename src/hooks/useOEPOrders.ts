// ============================================================
// ARCHIVO: src/hooks/useOEPOrders.ts (CORREGIDO - CON LISTENER DE EVENTOS)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { OEPOrder, OEPDatabaseOrder, OEPOrderStatus, OEPPaymentMethod } from '../types/oep';

export const useOEPOrders = () => {
    const [orders, setOrders] = useState<OEPOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async (limit = 1000) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 Intentando cargar pedidos OEP desde Supabase...');

            // Verificar conexión a Supabase
            const { error: testError } = await supabase
                .from('oep')
                .select('count', { count: 'exact', head: true });

            if (testError) {
                console.error('❌ Error de conexión a Supabase:', testError);
                setError('Error de conexión a la base de datos');
                setLoading(false);
                return;
            }

            // Cargar pedidos
            const { data, error } = await supabase
                .from('oep')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Error al cargar pedidos OEP:', error);
                setError(error.message);
                throw error;
            }

            console.log('📦 Datos crudos de Supabase:', data);

            if (!data || data.length === 0) {
                console.log('ℹ️ No hay pedidos OEP en la base de datos');
                setOrders([]);
                setTotalCount(0);
                return;
            }

            // Convertir los datos correctamente
            const convertedOrders: OEPOrder[] = data.map((order: OEPDatabaseOrder) => {
                console.log('🔄 Procesando orden:', order.id, order.order_number);
                
                return {
                    id: order.id,
                    order_number: order.order_number || '',
                    customer_name: order.customer_name || '',
                    phone: order.phone || null,
                    address: order.address || null,
                    items: Array.isArray(order.items) ? order.items : [],
                    status: (order.status as OEPOrderStatus) || 'pending',
                    total: Number(order.total) || 0,
                    payment_method: order.payment_method as OEPPaymentMethod | null,
                    notes: order.notes || null,
                    created_at: new Date(order.created_at),
                    updated_at: new Date(order.updated_at)
                };
            });

            console.log('✅ Pedidos OEP convertidos:', convertedOrders.length);
            console.log('📋 Primer pedido:', convertedOrders[0]);

            setOrders(convertedOrders);
            setTotalCount(convertedOrders.length);
            
        } catch (error: any) {
            console.error('❌ Error en fetchOrders:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateOrderStatus = async (orderId: string, status: OEPOrderStatus) => {
        try {
            const { error } = await supabase
                .from('oep')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status } : order
            ));

            return { success: true };
        } catch (error: any) {
            console.error('Error updating OEP order status:', error);
            return { success: false, error: error.message };
        }
    };

    const updateOrderPayment = async (orderId: string, paymentMethod: OEPPaymentMethod | null) => {
        try {
            const { error } = await supabase
                .from('oep')
                .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, payment_method: paymentMethod } : order
            ));

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const deleteOrder = async (orderId: string) => {
        try {
            const { error } = await supabase
                .from('oep')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.filter(order => order.id !== orderId));
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const getTodayOrders = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= today && orderDate < tomorrow;
        });
    }, [orders]);

    const refreshOrders = useCallback(() => {
        console.log('🔄 Refrescando pedidos OEP...');
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        console.log('🔄 useOEPOrders: Ejecutando fetchOrders inicial');
        fetchOrders();

        // ============================================================
        // CORRECCIÓN: Escuchar el evento de nuevo pedido OEP/Cocina
        // Cuando OrderReception crea un pedido de Cocina (phone) u OEP,
        // este listener detecta el evento y refresca los pedidos OEP
        // inmediatamente sin esperar el polling de 30 segundos.
        // ============================================================
        const handleNewOEPOrder = (event: Event) => {
            const customEvent = event as CustomEvent;
            const orderData = customEvent.detail;
            // Refrescar si es un pedido OEP o de Cocina (phone)
            if (
                orderData?.orderType === 'oep' ||
                orderData?.source?.type === 'oep' ||
                orderData?.source?.type === 'phone'
            ) {
                console.log('📦 Nuevo pedido OEP/Cocina detectado, refrescando lista OEP...');
                setTimeout(() => fetchOrders(1000), 200);
            }
        };

        window.addEventListener('newOrderCreated', handleNewOEPOrder);

        // Configurar polling para actualizar cada 30 segundos
        const interval = setInterval(() => {
            console.log('🔄 Polling: Actualizando pedidos OEP');
            fetchOrders();
        }, 30000);

        return () => {
            window.removeEventListener('newOrderCreated', handleNewOEPOrder);
            clearInterval(interval);
        };
    }, [fetchOrders]);

    return {
        orders,
        loading,
        totalCount,
        error,
        fetchOrders,
        refreshOrders,
        updateOrderStatus,
        updateOrderPayment,
        deleteOrder,
        getTodayOrders
    };
};
