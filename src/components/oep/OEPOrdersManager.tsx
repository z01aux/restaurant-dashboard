// ARCHIVO: src/components/oep/OEPOrdersManager.tsx
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Pencil, FileSpreadsheet, Printer } from 'lucide-react';
import { useOEPOrders } from '../../hooks/useOEPOrders';
import { useOEPSalesClosure } from '../../hooks/useOEPSalesClosure';
import { OEPCashRegisterModal } from '../sales_oep/OEPCashRegisterModal';
import { OEPPaymentModal } from './OEPPaymentModal';
import { OEPOrder } from '../../types/oep';
import { exportOEPToExcel, exportOEPByDateRange } from '../../utils/oepExportUtils';
import { generateOEPTicketSummary, printOEPResumenTicket } from '../../utils/oepTicketUtils';

// ─── Modal de rango de fechas (inline) ────────────────────────
const getTodayString = (): string => {
  const now = new Date();
  const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  return `${peruDate.getFullYear()}-${String(peruDate.getMonth()+1).padStart(2,'0')}-${String(peruDate.getDate()).padStart(2,'0')}`;
};
const createPeruDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};
interface DateRangeModalProps { isOpen: boolean; onClose: () => void; onConfirm: (s: Date, e: Date) => void; title: string; }
const DateRangeModal: React.FC<DateRangeModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate]     = useState(getTodayString());
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={() => { onConfirm(createPeruDate(startDate), createPeruDate(endDate)); onClose(); }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">Generar</button>
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────
export const OEPOrdersManager: React.FC = () => {
  const { orders, loading, updateOrderPayment } = useOEPOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister } = useOEPSalesClosure();

  const [searchTerm, setSearchTerm]             = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder]       = useState<OEPOrder | null>(null);
  const [showCashModal, setShowCashModal]       = useState(false);
  const [cashModalType, setCashModalType]       = useState<'open' | 'close'>('open');
  const [showDateRangeExcel, setShowDateRangeExcel]   = useState(false);
  const [showDateRangeTicket, setShowDateRangeTicket] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(o =>
      o.customer_name?.toLowerCase().includes(term) ||
      o.phone?.includes(term) ||
      o.order_number?.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  // ─── Reportes ─────────────────────────────────────────────────
  const handleExcelHoy = useCallback(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayOrders = orders.filter(o => {
      const d = new Date(o.created_at); d.setHours(0,0,0,0);
      return d.getTime() === today.getTime();
    });
    exportOEPToExcel(todayOrders, 'today');
  }, [orders]);

  const handleExcelRango = useCallback((s: Date, e: Date) => {
    exportOEPByDateRange(orders, s, e);
  }, [orders]);

  const handleTicketResumen = useCallback((startDate: Date, endDate: Date) => {
    const s = new Date(startDate); s.setHours(0,0,0,0);
    const e = new Date(endDate);   e.setHours(23,59,59,999);
    const filtered = orders.filter(o => { const d = new Date(o.created_at); return d >= s && d <= e; });
    if (!filtered.length) { alert('No hay pedidos en el rango seleccionado'); return; }
    printOEPResumenTicket(generateOEPTicketSummary(filtered), startDate, endDate);
  }, [orders]);

  // ─── Caja ─────────────────────────────────────────────────────
  const handleOpenCash  = useCallback(() => { setCashModalType('open');  setShowCashModal(true); }, []);
  const handleCloseCash = useCallback(() => { setCashModalType('close'); setShowCashModal(true); }, []);

  const handleCashConfirm = useCallback(async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const r = await openCashRegister(data.initialCash!);
      if (r.success) { alert('✅ Caja OEP abierta correctamente'); setShowCashModal(false); }
      else alert('❌ Error al abrir caja: ' + r.error);
    } else {
      const r = await closeCashRegister(orders, data.finalCash!, data.notes || '');
      if (r.success) { alert('✅ Caja OEP cerrada correctamente'); setShowCashModal(false); }
      else alert('❌ Error al cerrar caja: ' + r.error);
    }
  }, [cashModalType, openCashRegister, closeCashRegister, orders]);

  // ─── Pago ──────────────────────────────────────────────────────
  const handleEditPayment = (order: OEPOrder) => { setSelectedOrder(order); setShowPaymentModal(true); };
  const handleSavePaymentMethod = async (orderId: string, paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null) => {
    try {
      const result = await updateOrderPayment(orderId, paymentMethod);
      if (result.success) alert('✅ Método de pago actualizado correctamente');
      else alert('❌ Error al actualizar: ' + result.error);
    } catch (error: any) { alert('❌ Error inesperado: ' + error.message); }
    finally { setShowPaymentModal(false); setSelectedOrder(null); }
  };

  const getPaymentColor = (method?: string | null) => ({
    'EFECTIVO':  'bg-green-100 text-green-800',
    'YAPE/PLIN': 'bg-purple-100 text-purple-800',
    'TARJETA':   'bg-blue-100 text-blue-800',
  }[method || ''] || 'bg-gray-100 text-gray-800');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">

          {/* Modales */}
          <OEPCashRegisterModal isOpen={showCashModal} onClose={() => setShowCashModal(false)}
            type={cashModalType} cashRegister={cashRegister} orders={orders}
            onConfirm={handleCashConfirm} loading={salesLoading} />
          <OEPPaymentModal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
            order={selectedOrder} onSave={handleSavePaymentMethod} />
          <DateRangeModal isOpen={showDateRangeExcel} onClose={() => setShowDateRangeExcel(false)}
            onConfirm={handleExcelRango} title="📊 Reporte Excel por Fechas - OEP" />
          <DateRangeModal isOpen={showDateRangeTicket} onClose={() => setShowDateRangeTicket(false)}
            onConfirm={handleTicketResumen} title="🖨️ Ticket Resumen por Fechas - OEP" />

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedidos OEP</h1>
              <p className="text-sm text-gray-600 mt-1">{filteredOrders.length} pedidos</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">Caja OEP: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}</span>
              </div>
              {!cashRegister?.is_open
                ? <button onClick={handleOpenCash} disabled={salesLoading} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50">💰 Abrir Caja OEP</button>
                : <button onClick={handleCloseCash} disabled={salesLoading} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50">🔒 Cerrar Caja OEP</button>
              }
            </div>
          </div>

          {/* Botones de reportes */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={handleExcelHoy} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors">
              <FileSpreadsheet size={16} /> Excel Hoy
            </button>
            <button onClick={() => setShowDateRangeExcel(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors">
              <FileSpreadsheet size={16} /> Reporte por Fechas
            </button>
            <button onClick={() => setShowDateRangeTicket(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors">
              <Printer size={16} /> Ticket Resumen
            </button>
          </div>

          {/* Búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, teléfono o número de orden..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
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
              <div className="text-center py-12"><p className="text-gray-500">No hay pedidos</p></div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">#{order.order_number}</span>
                        <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div><div className="text-xs text-gray-500">Cliente</div><div className="font-semibold text-gray-900">{order.customer_name}</div></div>
                        {order.phone && <div><div className="text-xs text-gray-500">Teléfono</div><div className="text-sm text-gray-700">{order.phone}</div></div>}
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
                      <div className="text-lg font-bold text-blue-600 mb-2">S/ {order.total.toFixed(2)}</div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full inline-block ${getPaymentColor(order.payment_method)}`}>
                          {order.payment_method || 'NO APLICA'}
                        </span>
                        <button onClick={() => handleEditPayment(order)}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm border border-blue-300"
                          title="Cambiar método de pago"><Pencil size={14} /></button>
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
