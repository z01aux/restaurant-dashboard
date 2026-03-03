// ============================================================
// ARCHIVO: src/components/oep/OEPOrdersManager.tsx
// VERSIÓN CORREGIDA - Con la misma lógica que la pestaña Órdenes
// ============================================================

import React, { useState, useMemo, useCallback } from 'react'; // ← Eliminado useEffect
import { Search, Printer, FileSpreadsheet, Pencil } from 'lucide-react'; // ← Eliminado Download
import { useOEPOrders } from '../../hooks/useOEPOrders';
import { useOEPSalesClosure } from '../../hooks/useOEPSalesClosure';
import { usePagination } from '../../hooks/usePagination';
import { OEPCashRegisterModal } from '../sales_oep/OEPCashRegisterModal';
import { OEPPaymentModal } from './OEPPaymentModal';
import { OEPDateFilter } from './OEPDateFilter';
import { PaymentFilter } from '../ui/PaymentFilter';
import { OrderPreview } from '../orders/OrderPreview';
import OEPTicket from './OEPTicket';
import { OEPOrder } from '../../types/oep';
import { exportOEPToExcel, exportOEPByDateRange } from '../../utils/oepExportUtils';
import { generateOEPTicketSummary, printOEPResumenTicket } from '../../utils/oepTicketUtils';

// ─── Componente de fila memoizado (igual que en Órdenes) ────
const OEPOrderRow = React.memo(({
  order,
  onMouseEnter,
  onMouseLeave,
  onEditPayment,
  getPaymentColor,
  getPaymentText
}: {
  order: OEPOrder;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onEditPayment: (order: OEPOrder) => void;
  getPaymentColor: (method?: string | null) => string;
  getPaymentText: (method?: string | null) => string;
}) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEditPayment(order);
  };

  // Formatear productos para mostrar (como en Órdenes)
  const productosText = order.items
    .map(item => `${item.quantity}x ${item.name}`)
    .join(', ');

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer group relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* N° Orden / Cliente */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-2 mb-1">
          <div className="text-sm font-medium text-blue-600">
            #{order.order_number}
          </div>
        </div>
        <div className="font-medium text-gray-900">{order.customer_name}</div>
        <div className="text-xs text-gray-500 mt-1">
          {new Date(order.created_at).toLocaleTimeString()}
        </div>
      </td>

      {/* Teléfono / Dirección */}
      <td className="px-4 sm:px-6 py-4">
        {order.phone && (
          <div className="text-sm text-gray-600 mb-1">📞 {order.phone}</div>
        )}
        {order.address && (
          <div className="text-xs text-gray-500">📍 {order.address}</div>
        )}
      </td>

      {/* Productos */}
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">
          {order.items.length} producto(s)
        </div>
        <div className="text-xs text-gray-500 truncate max-w-xs" title={productosText}>
          {productosText}
        </div>
      </td>

      {/* Método de Pago */}
      <td className="px-4 sm:px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.payment_method)}`}>
          {getPaymentText(order.payment_method)}
        </span>
      </td>

      {/* Total */}
      <td className="px-4 sm:px-6 py-4">
        <div className="text-lg font-bold text-blue-600">
          S/ {order.total.toFixed(2)}
        </div>
      </td>

      {/* Acciones */}
      <td className="px-4 sm:px-6 py-4 text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={handleEditClick}
            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
            title="Cambiar método de pago"
          >
            <Pencil size={16} />
          </button>
          <OEPTicket order={order} />
        </div>
      </td>
    </tr>
  );
});

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(createPeruDate(startDate), createPeruDate(endDate)); onClose(); }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
          >
            Generar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────
export const OEPOrdersManager: React.FC = () => {
  const { orders, loading, getTodayOrders, updateOrderPayment } = useOEPOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useOEPSalesClosure();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [paymentFilter, setPaymentFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [previewOrder, setPreviewOrder] = useState<OEPOrder | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OEPOrder | null>(null);
  const [showDateRangeExcel, setShowDateRangeExcel] = useState(false);
  const [showDateRangeTicket, setShowDateRangeTicket] = useState(false);

  // Calcular total del día
  const todayTotal = useMemo(() =>
    getTodayOrders().reduce((sum, o) => sum + o.total, 0),
    [getTodayOrders]
  );

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

  // FILTROS (igual que en Órdenes)
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

    // Filtro por búsqueda (como en Órdenes)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.customer_name?.toLowerCase().includes(term) ||
        o.order_number?.toLowerCase().includes(term) ||
        o.phone?.includes(term)
      );
    }

    return filtered;
  }, [orders, searchTerm, selectedDate, paymentFilter]);

  // PAGINACIÓN (exactamente igual que en Órdenes)
  const pagination = usePagination({
    items: filteredOrders,
    itemsPerPage,
    mobileBreakpoint: 768
  });

  // HANDLERS PARA PREVIEW (exactamente igual que en Órdenes)
  const handleRowMouseEnter = useCallback((order: OEPOrder, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setPreviewOrder(null);
  }, []);

  // ── Reportes ──────────────────────────────────────────────────
  const handleExcelHoy = useCallback(() => {
    exportOEPToExcel(getTodayOrders(), 'today');
  }, [getTodayOrders]);

  const handleExcelRango = useCallback((startDate: Date, endDate: Date) => {
    exportOEPByDateRange(orders, startDate, endDate);
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
    printOEPResumenTicket(generateOEPTicketSummary(filtered), startDate, endDate);
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
        alert('✅ Caja OEP abierta correctamente');
        setShowCashModal(false);
      } else alert('❌ ' + r.error);
    } else {
      const r = await closeCashRegister(orders, data.finalCash!, data.notes || '');
      if (r.success) {
        alert('✅ Caja OEP cerrada correctamente');
        setShowCashModal(false);
      } else alert('❌ ' + r.error);
    }
  };

  // ── Pago ─────────────────────────────────────────────────────
  const handleEditPayment = useCallback((order: OEPOrder) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleSavePaymentMethod = useCallback(async (orderId: string, paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null) => {
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

  // Funciones auxiliares (igual que en Órdenes)
  const getPaymentColor = useCallback((method?: string | null) => {
    const colors: Record<string, string> = {
      'EFECTIVO': 'bg-green-100 text-green-800 border-green-200',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'TARJETA': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[method || ''] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const getPaymentText = useCallback((method?: string | null) => {
    const texts: Record<string, string> = {
      'EFECTIVO': 'EFECTIVO',
      'YAPE/PLIN': 'YAPE/PLIN',
      'TARJETA': 'TARJETA',
    };
    return texts[method || ''] || 'NO APLICA';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">

          {/* PREVIEW - exactamente igual que en Órdenes */}
          {previewOrder && (
            <OrderPreview
              order={previewOrder as any}
              isVisible={true}
              position={previewPosition}
              shouldIgnoreEvents={true}
            />
          )}

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
          <DateRangeModal
            isOpen={showDateRangeExcel}
            onClose={() => setShowDateRangeExcel(false)}
            onConfirm={handleExcelRango}
            title="📊 Reporte Excel por Fechas - OEP"
          />
          <DateRangeModal
            isOpen={showDateRangeTicket}
            onClose={() => setShowDateRangeTicket(false)}
            onConfirm={handleTicketResumen}
            title="🖨️ Ticket Resumen por Fechas - OEP"
          />

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📦</span> Pedidos OEP
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredOrders.length} pedidos · Total del día: <span className="font-semibold text-blue-600">S/ {todayTotal.toFixed(2)}</span>
              </p>
            </div>
            
            {/* Botón de caja */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
              
              {!cashRegister?.is_open ? (
                <button onClick={handleOpenCash} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2">
                  <span>💰</span> Abrir Caja
                </button>
              ) : (
                <button onClick={handleCloseCash} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2">
                  <span>🔒</span> Cerrar Caja
                </button>
              )}
            </div>
          </div>

          {/* Selector de fecha */}
          <OEPDateFilter
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
                placeholder="Buscar por cliente, teléfono o número de orden..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

          {/* TABLA - EXACTAMENTE IGUAL QUE EN ÓRDENES */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando pedidos...</p>
              </div>
            ) : pagination.currentItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-gray-500">No hay pedidos para esta fecha</p>
                {paymentFilter && (
                  <button
                    onClick={() => setPaymentFilter('')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Quitar filtro de pago
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente / Pedido
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método Pago
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagination.currentItems.map((order) => (
                      <OEPOrderRow
                        key={order.id}
                        order={order}
                        onMouseEnter={(e) => handleRowMouseEnter(order, e)}
                        onMouseLeave={handleRowMouseLeave}
                        onEditPayment={handleEditPayment}
                        getPaymentColor={getPaymentColor}
                        getPaymentText={getPaymentText}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* INFO DE PAGINACIÓN - igual que en Órdenes */}
          {filteredOrders.length > 0 && (
            <div className="mt-4 bg-white rounded-lg p-4 border text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">Mostrando:</span>{' '}
                  {((pagination.currentPage - 1) * itemsPerPage) + 1}-
                  {Math.min(pagination.currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length} pedidos
                </div>
                <div>
                  <span className="font-semibold">Total mostrado:</span> S/ {filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* CONTROLES DE PAGINACIÓN - igual que en Órdenes */}
          {filteredOrders.length > itemsPerPage && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Mostrar:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={pagination.prevPage}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                <button
                  onClick={pagination.nextPage}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Historial de cierres */}
          {closures.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Últimos cierres de caja</h3>
              <div className="space-y-2">
                {closures.slice(0, 5).map(c => (
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
