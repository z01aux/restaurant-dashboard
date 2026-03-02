import React, { useState, useMemo, useCallback } from 'react';
import { Search, Printer, Calendar, Pencil } from 'lucide-react';
import { useFullDayOrders } from '../../hooks/useFullDayOrders';
import { useFullDaySalesClosure } from '../../hooks/useFullDaySalesClosure';
import { useAuth } from '../../hooks/useAuth';
import { FullDayCashRegisterModal } from '../sales_fullday/FullDayCashRegisterModal';
import { FullDaySalesHistory } from '../sales_fullday/FullDaySalesHistory';
import { FullDayDateRangeModal } from './FullDayDateRangeModal';
import { FullDayDateFilter } from './FullDayDateFilter';
import { FullDayPaymentModal } from './FullDayPaymentModal';
import FullDayTicket from './FullDayTicket';
import { exportFullDayByDateRange } from '../../utils/fulldayExportUtils';
import { generateFullDayTicketSummary, printFullDayResumenTicket } from '../../utils/fulldayTicketUtils';
import { FullDayOrder, FullDayPaymentMethod } from '../../types/fullday';

export const FullDayOrdersManager: React.FC = () => {
  const { orders, loading, getTodayOrders, updateOrderPayment } = useFullDayOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useFullDaySalesClosure();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Estado para modal de edición de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<FullDayOrder | null>(null);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter(o => {
      const d = new Date(o.created_at);
      return d >= startOfDay && d <= endOfDay;
    });
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.student_name?.toLowerCase().includes(term) ||
        o.guardian_name?.toLowerCase().includes(term) ||
        o.order_number?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [orders, searchTerm, selectedDate]);

  // ── Exportaciones ────────────────────────────────────────────
  const handleExportSummary = async (startDate: Date, endDate: Date) => {
    const s = new Date(startDate); s.setHours(0,0,0,0);
    const e = new Date(endDate);   e.setHours(23,59,59,999);
    const filtered = orders.filter(o => { const d = new Date(o.created_at); return d >= s && d <= e; });
    if (!filtered.length) { alert('No hay pedidos en el rango seleccionado'); return; }
    printFullDayResumenTicket(generateFullDayTicketSummary(filtered), startDate, endDate);
  };

  const handleExportByDateRange = (startDate: Date, endDate: Date) =>
    exportFullDayByDateRange(orders, startDate, endDate);

  // ── Caja ─────────────────────────────────────────────────────
  const handleOpenCash  = () => { setCashModalType('open');  setShowCashModal(true); };
  const handleCloseCash = () => { setCashModalType('close'); setShowCashModal(true); };

  const handleCashConfirm = async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const r = await openCashRegister(data.initialCash!);
      if (r.success) { alert('✅ Caja abierta correctamente'); setShowCashModal(false); } else alert('❌ ' + r.error);
    } else {
      const r = await closeCashRegister(data.finalCash!, data.notes || '');
      if (r.success) { alert('✅ Caja cerrada correctamente'); setShowCashModal(false); } else alert('❌ ' + r.error);
    }
  };

  // ── Edición de pago ──────────────────────────────────────────
  const handleEditPayment = useCallback((order: FullDayOrder) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleSavePaymentMethod = useCallback(async (orderId: string, paymentMethod: FullDayPaymentMethod) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">

          {/* Modal edición de pago */}
          <FullDayPaymentModal
            isOpen={showPaymentModal}
            onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
            order={selectedOrder}
            onSave={handleSavePaymentMethod}
          />

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedidos FullDay</h1>
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

          <FullDayDateFilter selectedDate={selectedDate} onDateChange={setSelectedDate} totalOrders={filteredOrders.length} />
          {showHistory && <FullDaySalesHistory closures={closures} />}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setShowDateRangeModal(true)} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center">
              <Calendar size={16} className="mr-1" /> Reporte por Fechas
            </button>
            <button onClick={() => handleExportSummary(selectedDate, selectedDate)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center">
              <Printer size={16} className="mr-1" /> Imprimir Resumen
            </button>
          </div>

          {/* Búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por alumno, apoderado o número de orden..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay pedidos para esta fecha</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">

                      {/* Número y hora */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
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

                      {/* Productos */}
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">Productos</div>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                              <span className="font-semibold text-purple-600">{item.quantity}x</span>
                              <span className="ml-1 text-gray-700">{item.name}</span>
                              {item.notes && <span className="ml-1 text-xs text-gray-500 italic">({item.notes})</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Botones de ticket (imprimir + PDF) */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <FullDayTicket order={order} />
                      </div>

                    </div>

                    {/* Panel derecho: total + método de pago + botón editar */}
                    <div className="text-right ml-4 min-w-[130px]">
                      <div className="text-lg font-bold text-purple-600 mb-2">
                        S/ {order.total.toFixed(2)}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full inline-block ${getPaymentColor(order.payment_method)}`}>
                          {order.payment_method || 'NO APLICA'}
                        </span>
                        {/* Botón editar pago — admin, manager y employee */}
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

                  {/* Notas */}
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

          {/* Modales */}
          <FullDayCashRegisterModal
            isOpen={showCashModal}
            onClose={() => setShowCashModal(false)}
            type={cashModalType}
            cashRegister={cashRegister}
            orders={orders}
            onConfirm={handleCashConfirm}
            loading={salesLoading}
          />
          <FullDayDateRangeModal
            isOpen={showDateRangeModal}
            onClose={() => setShowDateRangeModal(false)}
            onConfirm={handleExportByDateRange}
          />

        </div>
      </div>
    </div>
  );
};

----------------------------------------

ARCHIVO: REVISION 01/src/components/fullday/FullDayPaymentModal.tsx
Tamaño: 6.98 KB
Tipo: application/typescript+jsx
Contenido:
----------------------------------------
// ============================================
// ARCHIVO: src/components/fullday/FullDayPaymentModal.tsx
// Modal para cambiar método de pago en FullDay
// ============================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, Minus } from 'lucide-react';
import { FullDayOrder } from '../../types/fullday';

interface FullDayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: FullDayOrder | null;
  onSave: (orderId: string, paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null) => Promise<void>;
}

export const FullDayPaymentModal: React.FC<FullDayPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedMethod(order.payment_method);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSave = async () => {
    if (selectedMethod === order.payment_method) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onSave(order.id, selectedMethod);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const paymentOptions = [
    { value: 'EFECTIVO', label: 'Efectivo', icon: DollarSign, color: 'green' },
    { value: 'YAPE/PLIN', label: 'Yape/Plin', icon: Smartphone, color: 'purple' },
    { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
    { value: 'none', label: 'No Aplica', icon: Minus, color: 'gray' }
  ];

  const handleSelectMethod = (value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none') => {
    if (value === 'none') {
      setSelectedMethod(null);
    } else {
      setSelectedMethod(value);
    }
  };

  const isSelected = (value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none') => {
    if (value === 'none') {
      return selectedMethod === null;
    }
    return selectedMethod === value;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard size={20} />
              <h2 className="text-lg font-bold">Cambiar Método de Pago</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors" disabled={saving}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Pedido:</span>
              <span className="font-semibold text-gray-900">{order.order_number}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Alumno:</span>
              <span className="font-semibold text-gray-900">{order.student_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className="font-bold text-purple-600">S/ {order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Método actual:</span>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg flex items-center space-x-2">
              {order.payment_method === 'EFECTIVO' && <DollarSign size={18} className="text-green-600" />}
              {order.payment_method === 'YAPE/PLIN' && <Smartphone size={18} className="text-purple-600" />}
              {order.payment_method === 'TARJETA' && <CreditCard size={18} className="text-blue-600" />}
              {!order.payment_method && <Minus size={18} className="text-gray-600" />}
              <span className="font-medium">{order.payment_method || 'NO APLICA'}</span>
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-3">
            Nuevo método de pago:
          </label>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              const selected = isSelected(option.value as any);
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectMethod(option.value as any)}
                  disabled={saving}
                  className={`
                    p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2
                    ${selected 
                      ? `border-${option.color}-500 bg-${option.color}-50` 
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }
                    ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Icon size={24} className={`text-${option.color}-600`} />
                  <span className={`text-sm font-medium text-${option.color}-800`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selectedMethod === order.payment_method}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Actualizar Pago</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
----------------------------------------

ARCHIVO: REVISION 01/src/components/fullday/FullDayPaymentSummary.tsx
Tamaño: 4.34 KB
Tipo: application/typescript+jsx
Contenido: