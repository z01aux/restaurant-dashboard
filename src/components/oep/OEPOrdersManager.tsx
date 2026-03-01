// ============================================================
// ARCHIVO: src/components/oep/OEPOrdersManager.tsx (VERSIÓN SIMPLIFICADA)
// ============================================================

import React, { useState, useMemo } from 'react';
import { Search, Pencil } from 'lucide-react';
import { useOEPOrders } from '../../hooks/useOEPOrders';
import { OEPPaymentModal } from './OEPPaymentModal';
import { OEPOrder } from '../../types/oep';

export const OEPOrdersManager: React.FC = () => {
    const { orders, loading, updateOrderPayment } = useOEPOrders();
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OEPOrder | null>(null);

    const filteredOrders = useMemo(() => {
        let filtered = orders;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                o.customer_name?.toLowerCase().includes(term) ||
                o.phone?.includes(term) ||
                o.order_number?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [orders, searchTerm]);

    const handleEditPayment = (order: OEPOrder) => {
        setSelectedOrder(order);
        setShowPaymentModal(true);
    };

    const handleSavePaymentMethod = async (orderId: string, paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null) => {
        try {
            const result = await updateOrderPayment(orderId, paymentMethod);
            if (result.success) {
                alert('✅ Método de pago actualizado correctamente');
            } else {
                alert('❌ Error al actualizar: ' + result.error);
            }
        } catch (error: any) {
            alert('❌ Error inesperado: ' + error.message);
        } finally {
            setShowPaymentModal(false);
            setSelectedOrder(null);
        }
    };

    const getPaymentColor = (method?: string | null) => {
        const map: Record<string, string> = {
            'EFECTIVO': 'bg-green-100 text-green-800',
            'YAPE/PLIN': 'bg-purple-100 text-purple-800',
            'TARJETA': 'bg-blue-100 text-blue-800',
        };
        return map[method || ''] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">

                    <OEPPaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
                        order={selectedOrder}
                        onSave={handleSavePaymentMethod}
                    />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Pedidos OEP</h1>
                            <p className="text-sm text-gray-600 mt-1">{filteredOrders.length} pedidos</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por cliente, teléfono o número de orden..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="text-gray-600 mt-2">Cargando pedidos OEP...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No hay pedidos</p>
                            </div>
                        ) : (
                            filteredOrders.map(order => (
                                <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    #{order.order_number}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(order.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <div className="text-xs text-gray-500">Cliente</div>
                                                    <div className="font-semibold text-gray-900">{order.customer_name}</div>
                                                </div>
                                                {order.phone && (
                                                    <div>
                                                        <div className="text-xs text-gray-500">Teléfono</div>
                                                        <div className="text-sm text-gray-700">{order.phone}</div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3">
                                                <div className="text-xs text-gray-500 mb-2">Productos</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                                                            <span className="font-semibold text-blue-600">{item.quantity}x</span>
                                                            <span className="ml-1 text-gray-700">{item.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right ml-4 min-w-[130px]">
                                            <div className="text-lg font-bold text-blue-600 mb-2">
                                                S/ {order.total.toFixed(2)}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full inline-block ${getPaymentColor(order.payment_method)}`}>
                                                    {order.payment_method || 'NO APLICA'}
                                                </span>
                                                <button
                                                    onClick={() => handleEditPayment(order)}
                                                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm border border-blue-300"
                                                    title="Cambiar método de pago"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};