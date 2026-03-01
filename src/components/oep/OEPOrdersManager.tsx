// ============================================================
// ARCHIVO: src/components/oep/OEPOrdersManager.tsx
// Gestor principal de pedidos OEP
// Equivalente exacto de: src/components/fullday/FullDayOrdersManager.tsx
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Download, Calendar, Printer, FileSpreadsheet, Pencil } from 'lucide-react';
import { useOEPOrders }        from '../../hooks/useOEPOrders';
import { useOEPSalesClosure }  from '../../hooks/useOEPSalesClosure';
import { OEPCashRegisterModal } from '../sales_oep/OEPCashRegisterModal';
import { OEPDateRangeModal }   from './OEPDateRangeModal';
import { OEPDateFilter }       from './OEPDateFilter';
import { OEPPaymentModal }     from './OEPPaymentModal';
import { OEPPaymentSummary, OEPSalesHistory } from './OEPPaymentSummary';
import { exportOEPToCSV, exportOEPToExcel, exportOEPByDateRange } from '../../utils/oepExcelUtils';
import { generateOEPTicketSummary, printOEPResumenTicket }       from '../../utils/oepTicketUtils';
import { OEPOrder, OEPPaymentMethod } from '../../types/oep';

export const OEPOrdersManager: React.FC = () => {
  const { orders, loading, getTodayOrders, updateOrderPayment } = useOEPOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useOEPSalesClosure();

  const [searchTerm,         setSearchTerm]         = useState('');
  const [selectedDate,       setSelectedDate]        = useState<Date>(new Date());
  const [showHistory,        setShowHistory]         = useState(false);
  const [showCashModal,      setShowCashModal]       = useState(false);
  const [cashModalType,      setCashModalType]       = useState<'open' | 'close'>('open');
  const [showDateRangeModal, setShowDateRangeModal]  = useState(false);
  const [exporting,          setExporting]           = useState(false);
  const [showPaymentModal,   setShowPaymentModal]    = useState(false);
  const [selectedOrder,      setSelectedOrder]       = useState<OEPOrder | null>(null);

  // ── Filtrado de pedidos ───────────────────────────────────
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    const startOfDay = new Date(selectedDate); startOfDay.setHours(0,  0,  0,  0);
    const endOfDay   = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);

    filtered = filtered.filter(o => {
      const d = new Date(o.created_at);
      return d >= startOfDay && d <= endOfDay;
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.student_name?.toLowerCase().includes(term)  ||
        o.guardian_name?.toLowerCase().includes(term) ||
        o.order_number?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [orders, searchTerm, selectedDate]);

  // ── Exportaciones ─────────────────────────────────────────
  const handleExportTodayCSV = useCallback(() => {
    if (exporting) return;
    setExporting(true);
    try { exportOEPToCSV(getTodayOrders(), 'oep_hoy'); } finally { setExporting(false); }
  }, [getTodayOrders, exporting]);

  const handleExportAllCSV = useCallback(() => {
    if (exporting) return;
    setExporting(true);
    try { exportOEPToCSV(orders, 'oep_todos'); } finally { setExporting(false); }
  }, [orders, exporting]);

  const handleExportTodayExcel = () => exportOEPToExcel(getTodayOrders(), 'today');
  const handleExportAllExcel   = () => exportOEPToExcel(orders, 'all');

  const handleExportSummary = async (startDate: Date, endDate: Date) => {
    const s = new Date(startDate); s.setHours(0,  0,  0, 0);
    const e = new Date(endDate);   e.setHours(23, 59, 59, 999);
    const filtered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= s && d <= e;
    });
    if (!filtered.length) { alert('No hay pedidos en el rango seleccionado'); return; }
    printOEPResumenTicket(generateOEPTicketSummary(filtered), startDate, endDate);
  };

  const handleExportByDateRange = (startDate: Date, endDate: Date) =>
    exportOEPByDateRange(orders, startDate, endDate);

  // ── Caja ──────────────────────────────────────────────────
  const handleOpenCash  = () => { setCashModalType('open');  setShowCashModal(true); };
  const handleCloseCash = () => { setCashModalType('close'); setShowCashModal(true); };

  const handleCashConfirm = async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const r = await openCashRegister(data.initialCash!);
      if (r.success) { alert('✅ Caja OEP abierta correctamente'); setShowCashModal(false); }
      else { alert('❌ ' + r.error); }
    } else {
      const r = await closeCashRegister(data.finalCash!, data.notes || '');
      if (r.success) { alert('✅ Caja OEP cerrada correctamente'); setShowCashModal(false); }
      else { alert('❌ ' + r.error); }
    }
  };

  // ── Edición de pago ───────────────────────────────────────
  const handleEditPayment = useCallback((order: OEPOrder) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleSavePaymentMethod = useCallback(async (orderId: string, paymentMethod: OEPPaymentMethod) => {
    try {
      const result = await updateOrderPayment(orderId, paymentMethod);
      if (!result.success) { alert('❌ Error al actualizar: ' + result.error); }
      else { alert('✅ Método de pago actualizado correctamente'); }
    } catch (error: any) {
      alert('❌ Error inesperado: ' + error.message);
    } finally {
      setShowPaymentModal(false);
      setSelectedOrder(null);
    }
  }, [updateOrderPayment]);

  const getPaymentColor = (method?: string | null) => {
    const map: Record<string, string> = {
      'EFECTIVO':  'bg-green-100 text-green-800',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800',
      'TARJETA':   'bg-blue-100 text-blue-800',
    };
    return map[method || ''] || 'bg-gray-100 text-gray-800';
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">

          {/* Modal edición de pago */}
          <OEPPaymentModal
            isOpen={showPaymentModal}
            onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
            order={selectedOrder}
            onSave={handleSavePaymentMethod}
          />

          {/* Modal de caja */}
          <OEPCashRegisterModal
            isOpen={showCashModal}
            onClose={() => setShowCashModal(false)}
            type={cashModalType}
            cashRegister={cashRegister}
            orders={orders}
            onConfirm={handleCashConfirm}
            loading={salesLoading}
          />

          {/* Modal rango de fechas */}
          <OEPDateRangeModal
            isOpen={showDateRangeModal}
            onClose={() => setShowDateRangeModal(false)}
            onConfirm={handleExportByDateRange}
          />

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedidos OEP</h1>
              <p className="text-sm text-gray-600 mt-1">{filteredOrders.length} pedidos</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
                <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}</span>
              </div>
              {!cashRegister?.is_open
                ? <button onClick={handleOpenCash}  className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">Abrir Caja</button>
                : <button onClick={handleCloseCash} className="bg-red-600   text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">Cerrar Caja</button>
              }
              <button onClick={() => setShowHistory(!showHistory)} className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700">
                {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>

          {/* Filtro de fecha */}
          <OEPDateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            totalOrders={filteredOrders.length}
          />

          {/* Historial de cierres */}
          {showHistory && <OEPSalesHistory closures={closures} />}

          {/* Resumen de pagos */}
          <OEPPaymentSummary orders={filteredOrders} />

          {/* Botones de exportación */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={handleExportTodayCSV} disabled={exporting}
              className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 flex items-center disabled:opacity-50">
              <Download size={16} className="mr-1" /> CSV Hoy
            </button>
            <button onClick={handleExportAllCSV} disabled={exporting}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center disabled:opacity-50">
              <Download size={16} className="mr-1" /> CSV Todo
            </button>
            <button onClick={handleExportTodayExcel}
              className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center">
              <FileSpreadsheet size={16} className="mr-1" /> Excel Hoy
            </button>
            <button onClick={handleExportAllExcel}
              className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center">
              <FileSpreadsheet size={16} className="mr-1" /> Excel Todo
            </button>
            <button onClick={() => setShowDateRangeModal(true)}
              className="bg-cyan-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-cyan-700 flex items-center">
              <Calendar size={16} className="mr-1" /> Reporte por Fechas
            </button>
            <button onClick={() => handleExportSummary(selectedDate, selectedDate)}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center">
              <Printer size={16} className="mr-1" /> Ticket Resumen
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
                placeholder="Buscar por alumno, apoderado o número de orden..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando pedidos OEP...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay pedidos OEP para esta fecha</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">

                      {/* Número y hora */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          #{order.order_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Datos del alumno */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div>
                          <div className="text-xs text-gray-500">Alumno</div>
                          <div className="font-semibold text-gray-900">{order.student_name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Grado y Sección</div>
                          <div className="font-medium text-gray-700">{order.grade} - Sección "{order.section}"</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Apoderado</div>
                          <div className="text-gray-700">{order.guardian_name}</div>
                        </div>
                        {order.phone && (
                          <div>
                            <div className="text-xs text-gray-500">Teléfono</div>
                            <div className="text-gray-700">{order.phone}</div>
                          </div>
                        )}
                      </div>

                      {/* Productos */}
                      <div className="mb-2">
                        <div className="text-xs text-gray-500 mb-1">Productos</div>
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Total y pago */}
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        S/ {order.total.toFixed(2)}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentColor(order.payment_method)}`}>
                          {order.payment_method || 'Sin pago'}
                        </span>
                        <button
                          onClick={() => handleEditPayment(order)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 mt-1"
                        >
                          <Pencil size={12} />
                          <span>Editar pago</span>
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
