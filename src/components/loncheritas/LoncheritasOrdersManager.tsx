// ============================================
// ARCHIVO: src/components/loncheritas/LoncheritasOrdersManager.tsx
// VERSIÓN COMPLETA CON:
// - Selector de fecha con flechas
// - Filtro de pago con montos
// - Ticket por pedido (Imprimir + PDF)
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Printer, FileSpreadsheet, Pencil } from 'lucide-react';
import { useLoncheritasOrders } from '../../hooks/useLoncheritasOrders';
import { useLoncheritasSalesClosure } from '../../hooks/useLoncheritasSalesClosure';
import { useAuth } from '../../hooks/useAuth';
import { LoncheritasCashRegisterModal } from './LoncheritasCashRegisterModal';
import { LoncheritasPaymentModal } from './LoncheritasPaymentModal';
import { LoncheritasDateFilter } from './LoncheritasDateFilter';
import { PaymentFilter } from '../ui/PaymentFilter';
import LoncheritasTicket from './LoncheritasTicket'; // ← NUEVO
import { LoncheritasOrder, LoncheritasPaymentMethod } from '../../types/loncheritas';
import { exportLoncheritasToExcel, exportLoncheritasByDateRange } from '../../utils/loncheritasExportUtils';
import { generateLoncheritasTicketSummary, printLoncheritasResumenTicket } from '../../utils/loncheritasTicketUtils';

// ─── Modal de rango de fechas ────────────────────────────────
const getTodayString = (): string => {
  const now = new Date();
  const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  return `${peruDate.getFullYear()}-${String(peruDate.getMonth() + 1).padStart(2, '0')}-${String(peruDate.getDate()).padStart(2, '0')}`;
};

const createPeruDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  title: string;
}

const DateRangeModal: React.FC<DateRangeModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(createPeruDate(startDate), createPeruDate(endDate)); onClose(); }}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold"
          >
            Generar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────
export const LoncheritasOrdersManager: React.FC = () => {
  const { orders, loading, getTodayOrders, updateOrderPayment } = useLoncheritasOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useLoncheritasSalesClosure();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LoncheritasOrder | null>(null);
  const [showDateRangeExcel, setShowDateRangeExcel] = useState(false);
  const [showDateRangeTicket, setShowDateRangeTicket] = useState(false);

  // Calcular MONTOS TOTALES por método de pago para el día seleccionado
  const paymentTotals = useMemo(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= startOfDay && d <= endOfDay;
    });

    return {
      efectivo: dayOrders
        .filter(o => o.payment_method === 'EFECTIVO')
        .reduce((sum, o) => sum + o.total, 0),
      yape: dayOrders
        .filter(o => o.payment_method === 'YAPE/PLIN')
        .reduce((sum, o) => sum + o.total, 0),
      tarjeta: dayOrders
        .filter(o => o.payment_method === 'TARJETA')
        .reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders, selectedDate]);

  // FILTROS
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filtro por fecha
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter(o => {
      const d = new Date(o.created_at);
      return d >= startOfDay && d <= endOfDay;
    });

    // Filtro por método de pago
    if (paymentFilter) {
      filtered = filtered.filter(o => o.payment_method === paymentFilter);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.student_name?.toLowerCase().includes(term) ||
        o.guardian_name?.toLowerCase().includes(term) ||
        o.order_number?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [orders, searchTerm, selectedDate, paymentFilter]);

  const todayTotal = useMemo(() =>
    getTodayOrders().reduce((sum, o) => sum + o.total, 0),
    [getTodayOrders]
  );

  // ── Reportes ──────────────────────────────────────────────────
  const handleExcelHoy = useCallback(() => {
    exportLoncheritasToExcel(getTodayOrders(), 'today');
  }, [getTodayOrders]);

  const handleExcelRango = useCallback((startDate: Date, endDate: Date) => {
    exportLoncheritasByDateRange(orders, startDate, endDate);
  }, [orders]);

  const handleTicketResumen = useCallback((startDate: Date, endDate: Date) => {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    const filtered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= s && d <= e;
    });
    if (!filtered.length) {
      alert('No hay pedidos en el rango seleccionado');
      return;
    }
    printLoncheritasResumenTicket(generateLoncheritasTicketSummary(filtered), startDate, endDate);
  }, [orders]);

  // ── Caja ─────────────────────────────────────────────────────
  const handleOpenCash = () => {
    setCashModalType('open');
    setShowCashModal(true);
  };
  const handleCloseCash = () => {
    setCashModalType('close');
    setShowCashModal(true);
  };

  const handleCashConfirm = async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const r = await openCashRegister(data.initialCash!);
      if (r.success) {
        alert('✅ Caja Loncheritas abierta correctamente');
        setShowCashModal(false);
      } else alert('❌ ' + r.error);
    } else {
      const r = await closeCashRegister(data.finalCash!, data.notes || '');
      if (r.success) {
        alert('✅ Caja Loncheritas cerrada correctamente');
        setShowCashModal(false);
      } else alert('❌ ' + r.error);
    }
  };

  // ── Pago ─────────────────────────────────────────────────────
  const handleEditPayment = useCallback((order: LoncheritasOrder) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleSavePaymentMethod = useCallback(async (orderId: string, paymentMethod: LoncheritasPaymentMethod) => {
    try {
      const result = await updateOrderPayment(orderId, paymentMethod);
      if (!result.success) alert('❌ Error al actualizar: ' + result.error);
      else alert('✅ Método de pago actualizado correctamente');
    } catch (error: any) {
      alert('❌ Error inesperado: ' + error.message);
    } finally {
      setShowPaymentModal(false);
      setSelectedOrder(null);
    }
  }, [updateOrderPayment]);

  const getPaymentColor = (method?: string | null) => {
    const map: Record<string, string> = {
      'EFECTIVO': 'bg-green-100 text-green-800',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800',
      'TARJETA': 'bg-blue-100 text-blue-800',
    };
    return map[method || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">

          {/* Modales */}
          <LoncheritasPaymentModal
            isOpen={showPaymentModal}
            onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
            order={selectedOrder}
            onSave={handleSavePaymentMethod}
          />
          <LoncheritasCashRegisterModal
            isOpen={showCashModal}
            onClose={() => setShowCashModal(false)}
            type={cashModalType}
            onConfirm={handleCashConfirm}
            loading={salesLoading}
          />
          <DateRangeModal
            isOpen={showDateRangeExcel}
            onClose={() => setShowDateRangeExcel(false)}
            onConfirm={handleExcelRango}
            title="📊 Reporte Excel por Fechas - Loncheritas"
          />
          <DateRangeModal
            isOpen={showDateRangeTicket}
            onClose={() => setShowDateRangeTicket(false)}
            onConfirm={handleTicketResumen}
            title="🖨️ Ticket Resumen por Fechas - Loncheritas"
          />

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍱 Pedidos Loncheritas</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredOrders.length} pedidos · Total del día: S/ {todayTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
              {!cashRegister?.is_open
                ? <button onClick={handleOpenCash} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all">💰 Abrir Caja</button>
                : <button onClick={handleCloseCash} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all">🔒 Cerrar Caja</button>
              }
            </div>
          </div>

          {/* Selector de fecha con flechas */}
          <LoncheritasDateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            totalOrders={filteredOrders.length}
          />

          {/* Filtro por método de pago con montos */}
          <div className="mb-4">
            <PaymentFilter
              paymentFilter={paymentFilter}
              setPaymentFilter={setPaymentFilter}
              totalEfectivo={paymentTotals.efectivo}
              totalYape={paymentTotals.yape}
              totalTarjeta={paymentTotals.tarjeta}
              showAmounts={true}
            />
          </div>

          {/* Botones de reportes */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={handleExcelHoy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors">
              <FileSpreadsheet size={16} /> Excel Hoy
            </button>
            <button onClick={() => setShowDateRangeExcel(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors">
              <FileSpreadsheet size={16} /> Reporte por Fechas
            </button>
            <button onClick={() => setShowDateRangeTicket(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors">
              <Printer size={16} /> Ticket Resumen
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Indicador de filtro activo */}
          {paymentFilter && (
            <div className="mb-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="text-sm text-blue-700">
                <span className="font-semibold">Filtro activo:</span> Mostrando solo pedidos en {
                  paymentFilter === 'EFECTIVO' ? '💵 Efectivo' :
                    paymentFilter === 'YAPE/PLIN' ? '📱 Yape/Plin' : '💳 Tarjeta'
                }
              </span>
              <button
                onClick={() => setPaymentFilter('')}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Limpiar filtro
              </button>
            </div>
          )}

          {/* Lista de pedidos con tickets */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🍱</p>
                <p className="text-gray-500">No hay pedidos para esta fecha</p>
                {paymentFilter && (
                  <button
                    onClick={() => setPaymentFilter('')}
                    className="mt-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Quitar filtro de pago
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-mono bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          #{order.order_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div>
                          <div className="text-xs text-gray-500">Alumno</div>
                          <div className="font-semibold text-gray-900">{order.student_name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Grado y Sección</div>
                          <div className="text-sm text-gray-700">{order.grade} - Sección {order.section}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Apoderado</div>
                          <div className="text-sm text-gray-700">{order.guardian_name}</div>
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
                              <span className="font-semibold text-orange-600">{item.quantity}x</span>
                              <span className="ml-1 text-gray-700">{item.name}</span>
                              {item.notes && <span className="ml-1 text-xs text-gray-500 italic">({item.notes})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* NUEVO: Botones de ticket */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <LoncheritasTicket order={order} />
                      </div>
                    </div>

                    <div className="text-right ml-4 min-w-[130px]">
                      <div className="text-lg font-bold text-orange-600 mb-2">
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
                {closures.slice(0, 5).map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2 text-sm">
                    <span className="font-mono text-gray-600">{c.closure_number}</span>
                    <span className="text-gray-500">{new Date(c.closed_at).toLocaleDateString('es-ES')}</span>
                    <span className="font-semibold text-orange-600">S/ {c.final_cash?.toFixed(2)}</span>
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