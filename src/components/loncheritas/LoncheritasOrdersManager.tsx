// ============================================
// ARCHIVO: src/components/loncheritas/LoncheritasOrdersManager.tsx
// VERSIÓN CON PREVIEW DESACTIVADO EN ZONA DE ACCIONES
// ============================================

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'; // ← Añadido useRef
import { Search, Pencil, Calendar, ChevronLeft, ChevronRight, Printer, FileSpreadsheet, Trash2 } from 'lucide-react';
import { useLoncheritasOrders } from '../../hooks/useLoncheritasOrders';
import { useLoncheritasSalesClosure } from '../../hooks/useLoncheritasSalesClosure';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { LoncheritasCashRegisterModal } from './LoncheritasCashRegisterModal';
import { LoncheritasPaymentModal } from './LoncheritasPaymentModal';
import { LoncheritasDateFilter } from './LoncheritasDateFilter';
import { PaymentFilter } from '../ui/PaymentFilter';
import { LoncheritasOrderPreview } from './LoncheritasOrderPreview';
import LoncheritasTicket from './LoncheritasTicket';
import { LoncheritasOrder, LoncheritasPaymentMethod } from '../../types/loncheritas';
import { exportLoncheritasToExcel, exportLoncheritasByDateRange } from '../../utils/loncheritasExportUtils';
import { generateLoncheritasTicketSummary, printLoncheritasResumenTicket } from '../../utils/loncheritasTicketUtils';

// ============================================
// COMPONENTE MEMOIZADO PARA CADA FILA DE ORDEN
// ============================================
const LoncheritasOrderRow = React.memo(({
  order,
  onMouseEnter,
  onMouseLeave,
  onEditPayment,
  onDelete,
  getDisplayNumber,
  getPaymentColor,
  getPaymentText,
  isAdmin
}: {
  order: LoncheritasOrder;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onEditPayment: (order: LoncheritasOrder) => void;
  onDelete: (orderId: string, orderNumber: string) => void;
  getDisplayNumber: (order: LoncheritasOrder) => string;
  getPaymentColor: (method?: string | null) => string;
  getPaymentText: (method?: string | null) => string;
  isAdmin: boolean;
}) => {
  const displayNumber = getDisplayNumber(order);
  const actionsRef = useRef<HTMLDivElement>(null); // ← Referencia para el área de acciones

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEditPayment(order);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(order.id, displayNumber);
  };

  // Manejador personalizado para mouse enter que ignora si viene de acciones
  const handleRowMouseEnter = (e: React.MouseEvent) => {
    // Si el mouse está sobre el área de acciones, no activar preview
    if (actionsRef.current && actionsRef.current.contains(e.target as Node)) {
      return;
    }
    onMouseEnter(e);
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer group relative"
      onMouseEnter={handleRowMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-2 mb-1">
          <div className="text-sm font-medium text-orange-600">
            {displayNumber}
          </div>
        </div>
        <div className="font-medium text-gray-900">{order.student_name}</div>
        <div className="text-sm text-gray-600">{order.grade} - Sección {order.section}</div>
        <div className="text-sm font-bold text-orange-600 mt-1">
          S/ {order.total.toFixed(2)}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="mb-1">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 items-center space-x-1">
            <span>🍱</span>
            <span>Loncheritas</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.payment_method)}`}>
            {getPaymentText(order.payment_method)}
          </span>

          <button
            onClick={handleEditClick}
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm border border-blue-300"
            title="Cambiar método de pago"
          >
            <Pencil size={14} />
          </button>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">
          {new Date(order.created_at).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(order.created_at).toLocaleTimeString()}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">
          {order.items.length} producto(s)
        </div>
        <div className="text-xs text-gray-500 truncate max-w-xs">
          {order.items.map(item => item.name).join(', ')}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 text-sm font-medium">
        <div ref={actionsRef} className="flex space-x-2"> {/* ← Referencia aquí */}
          <LoncheritasTicket order={order} />
          {isAdmin && (
            <button
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar pedido"
            >
              <Trash2 size={16} />
            </button>
          )}
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
  const { orders, loading, getTodayOrders, updateOrderPayment, deleteOrder } = useLoncheritasOrders(); // ← Añadido deleteOrder
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useLoncheritasSalesClosure();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentSort, setCurrentSort] = useState('status-time');
  const [previewOrder, setPreviewOrder] = useState<LoncheritasOrder | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LoncheritasOrder | null>(null);
  const [showDateRangeExcel, setShowDateRangeExcel] = useState(false);
  const [showDateRangeTicket, setShowDateRangeTicket] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [localOrders, setLocalOrders] = useState<LoncheritasOrder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deletedOrder, setDeletedOrder] = useState<{id: string, number: string} | null>(null); // ← Para notificación

  useEffect(() => {
    if (orders.length > 0 && !isInitialized) {
      setLocalOrders(orders);
      setIsInitialized(true);
    }
  }, [orders, isInitialized]);

  // Ocultar notificación después de 3 segundos
  useEffect(() => {
    if (deletedOrder) {
      const timer = setTimeout(() => {
        setDeletedOrder(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deletedOrder]);

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

  // Filtrar por fecha
  const dateFilteredOrders = useMemo(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return localOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });
  }, [localOrders, selectedDate]);

  // FILTROS Y ORDENAMIENTO
  const filteredAndSortedOrders = useMemo(() => {
    if (!dateFilteredOrders.length) return [];
    let filtered = dateFilteredOrders;

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.student_name?.toLowerCase().includes(term) ||
        o.guardian_name?.toLowerCase().includes(term) ||
        o.order_number?.toLowerCase().includes(term)
      );
    }

    // Filtrar por método de pago
    if (paymentFilter) {
      filtered = filtered.filter(o => o.payment_method === paymentFilter);
    }

    // Ordenar
    if (filtered.length > 1) {
      filtered = [...filtered].sort((a, b) => {
        switch (currentSort) {
          case 'status-time': {
            const so: Record<string, number> = { pending: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 5 };
            if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status];
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          case 'waiting-time':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'total-desc':      return b.total - a.total;
          case 'created-desc':    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'created-asc':     return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default: return 0;
        }
      });
    }

    return filtered;
  }, [dateFilteredOrders, searchTerm, paymentFilter, currentSort]);

  // PAGINACIÓN
  const pagination = usePagination({
    items: filteredAndSortedOrders,
    itemsPerPage,
    mobileBreakpoint: 768
  });

  // Calcular totalPages manualmente
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  // HANDLERS PARA PREVIEW
  const handleRowMouseEnter = useCallback((order: LoncheritasOrder, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setPreviewOrder(null);
  }, []);

  // ── Eliminar pedido ───────────────────────────────────────────
  const handleDeleteOrder = useCallback(async (orderId: string, orderNumber: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el pedido ${orderNumber}?`)) {
      // Eliminar optimistamente de la UI
      setLocalOrders(prev => prev.filter(o => o.id !== orderId));
      
      const result = await deleteOrder(orderId);
      if (result.success) {
        setDeletedOrder({ id: orderId, number: orderNumber });
      } else {
        alert('❌ Error al eliminar el pedido: ' + result.error);
        // Recargar para restaurar el pedido
        setLocalOrders(orders);
      }
    }
  }, [deleteOrder, orders]);

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

  // Funciones auxiliares
  const getDisplayNumber = useCallback((order: LoncheritasOrder) => {
    return order.order_number || `LON-${order.id.slice(-8).toUpperCase()}`;
  }, []);

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

  const sortOptions = useMemo(() => [
    { value: 'status-time',       label: '🔄 Estado + Tiempo' },
    { value: 'waiting-time',      label: '⏱️ Tiempo Espera' },
    { value: 'total-desc',        label: '💰 Mayor Monto' },
    { value: 'created-desc',      label: '📅 Más Recientes' },
    { value: 'created-asc',       label: '📅 Más Antiguas' },
  ], []);

  const handleClearFilters = useCallback(() => {
    setPaymentFilter('');
    setSearchTerm('');
  }, []);

  const hasActiveFilters = paymentFilter !== '' || searchTerm !== '';

  // Determinar si el usuario es admin
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* NOTIFICACIÓN DE PEDIDO ELIMINADO */}
      {deletedOrder && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full">
          <span>Pedido {deletedOrder.number} eliminado correctamente</span>
        </div>
      )}

      {/* PREVIEW */}
      {previewOrder && (
        <LoncheritasOrderPreview
          order={previewOrder}
          isVisible={true}
          position={previewPosition}
          shouldIgnoreEvents={true}
        />
      )}

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

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🍱</span> Pedidos Loncheritas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedOrders.length} pedidos · Total del día: <span className="font-semibold text-orange-600">S/ {todayTotal.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}</span>
          </div>
          {!cashRegister?.is_open ? (
            <button onClick={handleOpenCash} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">💰 Abrir Caja</button>
          ) : (
            <button onClick={handleCloseCash} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">🔒 Cerrar Caja</button>
          )}
        </div>
      </div>

      {/* FILTRO DE FECHA CON FLECHAS */}
      <LoncheritasDateFilter
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        totalOrders={filteredAndSortedOrders.length}
      />

      {/* FILTRO POR MÉTODO DE PAGO CON MONTOS */}
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

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleExcelHoy} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center space-x-1">
          <FileSpreadsheet size={16} /><span>Excel Hoy</span>
        </button>
        <button onClick={() => setShowDateRangeExcel(true)} className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center space-x-1">
          <FileSpreadsheet size={16} /><span>Reporte por Fechas</span>
        </button>
        <button onClick={() => setShowDateRangeTicket(true)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center space-x-1">
          <Printer size={16} /><span>Ticket Resumen</span>
        </button>
      </div>

      {/* FILTROS - Buscar */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por alumno, apoderado..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Indicadores de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {paymentFilter && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPaymentColor(paymentFilter)}`}>
                  {getPaymentText(paymentFilter)}
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  🔍 Búsqueda: "{searchTerm}"
                </span>
              )}
            </div>
            <button
              onClick={handleClearFilters}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* CONTROLES DE PAGINACIÓN Y ORDENAMIENTO */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg p-4 border border-gray-200 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div className="text-sm text-gray-600">
            Mostrando {((pagination.currentPage - 1) * itemsPerPage) + 1}-
            {Math.min(pagination.currentPage * itemsPerPage, filteredAndSortedOrders.length)} de{' '}
            <span className="font-semibold">{filteredAndSortedOrders.length}</span> pedidos
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            
            <select
              value={currentSort}
              onChange={(e) => setCurrentSort(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={pagination.prevPage}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="px-3 py-1 text-sm">
                {pagination.currentPage} / {totalPages}
              </span>
              
              <button
                onClick={pagination.nextPage}
                disabled={pagination.currentPage === totalPages}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA - CON HOVER PREVIEW Y BOTÓN ELIMINAR */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading && !isInitialized ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando...</p>
          </div>
        ) : pagination.currentItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay pedidos para el {selectedDate.toLocaleDateString('es-PE')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumno / Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área / Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagination.currentItems.map((order) => (
                  <LoncheritasOrderRow
                    key={order.id}
                    order={order}
                    onMouseEnter={(e) => handleRowMouseEnter(order, e)}
                    onMouseLeave={handleRowMouseLeave}
                    onEditPayment={handleEditPayment}
                    onDelete={handleDeleteOrder}
                    getDisplayNumber={getDisplayNumber}
                    getPaymentColor={getPaymentColor}
                    getPaymentText={getPaymentText}
                    isAdmin={isAdmin}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INFO DE TOTALES */}
      {filteredAndSortedOrders.length > 0 && (
        <div className="bg-white rounded-lg p-4 border text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">Total mostrado:</span> S/ {filteredAndSortedOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}
            </div>
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
                <span className="font-semibold text-orange-600">S/ {c.final_cash?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
