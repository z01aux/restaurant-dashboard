// ============================================
// ARCHIVO: src/components/oep/OEPOrdersManager.tsx
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Pencil, Printer, Calendar } from 'lucide-react';
import { useOEPOrders } from '../../hooks/useOEPOrders';
import { useOEPSalesClosure } from '../../hooks/useOEPSalesClosure';
import { useAuth } from '../../hooks/useAuth';
import { OEPPaymentModal } from './OEPPaymentModal';
import { OEPCashRegisterModal } from '../sales_oep/OEPCashRegisterModal';
import { FullDayDateFilter } from '../fullday/FullDayDateFilter';
import { OEPDateRangeModal } from './OEPDateRangeModal';
import { generateFullDayTicketSummary, printFullDayResumenTicket } from '../../utils/fulldayTicketUtils';
import { OEPOrder } from '../../types/oep';

export const OEPOrdersManager: React.FC = () => {
    const { orders, loading, updateOrderPayment } = useOEPOrders();
    const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useOEPSalesClosure();
    const { user } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OEPOrder | null>(null);
    const [showCashModal, setShowCashModal] = useState(false);
    const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);

    const filteredOrders = useMemo(() => {
        const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay   = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);

        let filtered = orders.filter(o => {
            const d = new Date(o.created_at);
            return d >= startOfDay && d <= endOfDay;
        });

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                o.customer_name?.toLowerCase().includes(term) ||
                o.phone?.includes(term) ||
                o.order_number?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [orders, searchTerm, selectedDate]);

    // ── Caja ─────────────────────────────────────────────────
    const handleOpenCash  = () => { setCashModalType('open');  setShowCashModal(true); };
    const handleCloseCash = () => { setCashModalType('close'); setShowCashModal(true); };

    const handleCashConfirm = async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
        if (cashModalType === 'open') {
            const r = await openCashRegister(data.initialCash!);
            if (r.success) { alert('✅ Caja abierta correctamente'); setShowCashModal(false); }
            else alert('❌ ' + r.error);
        } else {
            const r = await closeCashRegister(orders, data.finalCash!, data.notes || '');
            if (r.success) { alert('✅ Caja cerrada correctamente'); setShowCashModal(false); }
            else alert('❌ ' + r.error);
        }
    };

    // ── Pago ─────────────────────────────────────────────────
    const handleEditPayment = useCallback((order: OEPOrder) => {
        setSelectedOrder(order);
        setShowPaymentModal(true);
    }, []);

    const handleSavePaymentMethod = async (orderId: string, paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null) => {
        try {
            const result = await updateOrderPayment(orderId, paymentMethod);
            if (result.success) { alert('✅ Método de pago actualizado correctamente'); }
            else { alert('❌ Error al actualizar: ' + result.error); }
        } catch (error: any) {
            alert('❌ Error inesperado: ' + error.message);
        } finally {
            setShowPaymentModal(false);
            setSelectedOrder(null);
        }
    };

    // ── Exportar Excel ───────────────────────────────────────
    const handleExportExcel = useCallback(async (startDate: Date, endDate: Date) => {
        console.log('Exportando OEP a Excel:', startDate, endDate);
        alert('Función de exportación a Excel en desarrollo para OEP');
        // TODO: Implementar exportación a Excel para OEP
    }, []);

    // ── Imprimir Resumen ─────────────────────────────────────
    const handlePrintSummary = useCallback((startDate: Date, endDate: Date) => {
        const s = new Date(startDate); s.setHours(0,0,0,0);
        const e = new Date(endDate);   e.setHours(23,59,59,999);
        const filtered = orders.filter(o => { const d = new Date(o.created_at); return d >= s && d <= e; });
        if (!filtered.length) { alert('No hay pedidos en el rango seleccionado'); return; }
        printFullDayResumenTicket(generateFullDayTicketSummary(filtered as any), startDate, endDate);
    }, [orders]);

    const getPaymentColor = (method?: string | null) => {
        const map: Record<string, string> = {
            'EFECTIVO':  'bg-green-100 text-green-800',
            'YAPE/PLIN': 'bg-purple-100 text-purple-800',
            'TARJETA':   'bg-blue-100 text-blue-800',
        };
        return map[method || ''] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">

                    {/* Modales */}
                    <OEPPaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
                        order={selectedOrder}
                        onSave={handleSavePaymentMethod}
                    />
                    <OEPCashRegisterModal
                        isOpen={showCashModal}
                        onClose={() => setShowCashModal(false)}
                        type={cashModalType}
                        cashRegister={cashRegister}
                        orders={orders}
                        onConfirm={handleCashConfirm}
                        loading={salesLoading}
                    />
                    <OEPDateRangeModal
                        isOpen={showDateRangeModal}
                        onClose={() => setShowDateRangeModal(false)}
                        onConfirmTicket={handlePrintSummary}
                        onConfirmExcel={handleExportExcel}
                    />

                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Pedidos OEP</h1>
                            <p className="text-sm text-gray-600 mt-1">{filteredOrders.length} pedidos</p>
                        </div>
                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
                                <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-sm font-medium">Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}</span>
                            </div>
                            {!cashRegister?.is_open
                                ? <button onClick={handleOpenCash}  className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">Abrir Caja</button>
                                : <button onClick={handleCloseCash} className="bg-red-600   text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">Cerrar Caja</button>
                            }
                        </div>
                    </div>

                    {/* Filtro de fecha */}
                    <FullDayDateFilter
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        totalOrders={filteredOrders.length}
                    />

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button onClick={() => setShowDateRangeModal(true)} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center">
                            <Calendar size={16} className="mr-1" /> Reporte por Fechas
                        </button>
                        <button onClick={() => handlePrintSummary(selectedDate, selectedDate)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center">
                            <Printer size={16} className="mr-1" /> Imprimir Resumen
                        </button>
                    </div>

                    {/* Búsqueda */}
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

                    {/* Lista */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="text-gray-600 mt-2">Cargando pedidos OEP...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-4xl mb-3">📦</p>
                                <p className="text-gray-500">No hay pedidos para esta fecha</p>
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
                                                {order.address && (
                                                    <div className="md:col-span-2">
                                                        <div className="text-xs text-gray-500">Dirección</div>
                                                        <div className="text-sm text-gray-700">{order.address}</div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3">
                                                <div className="text-xs text-gray-500 mb-2">Productos</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.items.map((item: any, i: number) => (
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
                                                {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee') && (
                                                    <button
                                                        onClick={() => handleEditPayment(order)}
                                                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm border border-blue-300"
                                                        title="Cambiar método de pago"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {order.notes && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="text-xs text-gray-500">Notas:</div>
                                            <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded mt-1">{order.notes}</div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Historial de cierres */}
                    {closures.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-sm font-bold text-gray-700 mb-3">Últimos cierres de caja</h3>
                            <div className="space-y-2">
                                {closures.slice(0, 5).map((c: any) => (
                                    <div key={c.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2 text-sm">
                                        <span className="font-mono text-gray-600">{c.closure_number}</span>
                                        <span className="text-gray-500">{new Date(c.closed_at).toLocaleDateString('es-ES')}</span>
                                        <span className="font-semibold text-blue-600">S/ {c.final_cash?.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};