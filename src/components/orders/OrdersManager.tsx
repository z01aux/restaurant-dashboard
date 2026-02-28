// ============================================
// ARCHIVO: src/components/orders/OrdersManager.tsx
// CON FILTRO POR ÁREA Y SELECTOR DE FECHA ESTILO FULLDAY
// SIN TARJETAS DE ESTADÍSTICAS
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Pencil, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Order } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination, isDesktopPagination, isMobilePagination } from '../../hooks/usePagination';
import { PaginationControls } from '../ui/PaginationControls';
import { OrderPreview } from './OrderPreview';
import OrderTicket from './OrderTicket';
import { exportOrdersToExcel, exportOrdersByDateRange } from '../../utils/exportUtils';
import { generateTicketSummary, printResumenTicket } from '../../utils/ticketUtils';
import { useSalesClosure } from '../../hooks/useSalesClosure';
import { CashRegisterModal } from '../sales/CashRegisterModal';
import { SalesHistory } from '../sales/SalesHistory';
import { PaymentMethodModal } from './PaymentMethodModal';
import { DateRangeModal } from './DateRangeModal';
import { formatDateForDisplay } from '../../utils/dateUtils';

// ============================================
// COMPONENTE DE SELECCIÓN DE FECHA (ESTILO FULLDAY)
// ============================================
const DateSelector: React.FC<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  showOnlyToday: boolean;
  onToggleShowOnlyToday: () => void;
}> = ({ selectedDate, onDateChange, showOnlyToday, onToggleShowOnlyToday }) => {
  
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Si showOnlyToday está activo, mostramos un selector simplificado
  if (showOnlyToday) {
    return (
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex items-center space-x-2">
          <Calendar size={18} className="text-gray-500" />
          <span className="font-medium text-gray-700">Hoy: {formatDate(new Date())}</span>
        </div>
        <button
          onClick={onToggleShowOnlyToday}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Ver todas las fechas
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Selector de fecha con flechas */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Día anterior"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
            <Calendar size={18} className="text-red-600" />
            <span className="font-medium text-red-800">
              {formatDate(selectedDate)}
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Día siguiente"
            disabled={isToday(selectedDate)}
          >
            <ChevronRight size={20} className={`${isToday(selectedDate) ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center space-x-2">
          {!isToday(selectedDate) && (
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Ver Hoy
            </button>
          )}
          <button
            onClick={onToggleShowOnlyToday}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Volver a "Solo Hoy"
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE MEMOIZADO PARA CADA FILA DE ORDEN
// ============================================
const OrderRow = React.memo(({
  order,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  onEditPayment,
  user,
  getDisplayNumber,
  getNumberType,
  getSourceText,
  getPaymentColor,
  getPaymentText,
  getAreaIcon
}: {
  order: Order;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onDelete: (orderId: string, displayNumber: string) => void;
  onEditPayment: (order: Order) => void;
  user: any;
  getDisplayNumber: (order: Order) => string;
  getNumberType: (order: Order) => string;
  getSourceText: (type: string) => string;
  getPaymentColor: (method?: string) => string;
  getPaymentText: (method?: string) => string;
  getAreaIcon: (type: string) => string;
}) => {
  const displayNumber = getDisplayNumber(order);
  const numberType = getNumberType(order);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEditPayment(order);
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer group relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-2 mb-1">
          <div className={`text-sm font-medium ${
            numberType === 'kitchen' ? 'text-green-600' : 'text-blue-600'
          }`}>
            {displayNumber}
          </div>
          {numberType === 'kitchen' ? (
            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
              COCINA
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              NORMAL
            </span>
          )}
        </div>
        <div className="font-medium text-gray-900">{order.customerName}</div>
        <div className="text-sm font-bold text-red-600">
          S/ {order.total.toFixed(2)}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="mb-1">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 items-center space-x-1">
            <span>{getAreaIcon(order.source.type)}</span>
            <span>{getSourceText(order.source.type)}</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.paymentMethod)}`}>
            {getPaymentText(order.paymentMethod)}
          </span>

          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee') && (
            <button
              onClick={handleEditClick}
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm border border-blue-300"
              title="Cambiar método de pago"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleTimeString()}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">
          {order.items.length} producto(s)
        </div>
        <div className="text-xs text-gray-500 truncate max-w-xs">
          {order.items.map((item: any) => item.menuItem.name).join(', ')}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 text-sm font-medium">
        <div className="flex space-x-2">
          <OrderTicket order={order} />
          {user?.role === 'admin' && (
            <button
              onClick={() => onDelete(order.id, displayNumber)}
              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar orden"
            >
              🗑️
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const OrdersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>(''); // '' = todas, 'phone', 'walk-in', 'delivery'
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentSort, setCurrentSort] = useState('status-time');
  const [deletedOrder, setDeletedOrder] = useState<{id: string, number: string} | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showOnlyToday, setShowOnlyToday] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { user } = useAuth();
  const {
    orders,
    loading,
    deleteOrder,
    updateOrderPayment,
    exportOrdersToCSV,
    getTodayOrders,
    fetchOrders,
    getRegularOrders
  } = useOrders();

  const {
    cashRegister,
    loading: salesLoading,
    openCashRegister,
    closeCashRegister,
    getTodaySummary
  } = useSalesClosure();

  const regularOrders = useMemo(() => getRegularOrders(), [getRegularOrders, orders]);

  useEffect(() => {
    if (regularOrders.length > 0 && !isInitialized) {
      setLocalOrders(regularOrders);
      setIsInitialized(true);
    }
  }, [regularOrders, isInitialized]);

  useEffect(() => {
    const handleNewOrder = (event: CustomEvent) => {
      const newOrder = event.detail;
      if (newOrder.orderType !== 'fullday') {
        setLocalOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
      }
      setTimeout(() => fetchOrders(500), 100);
    };
    window.addEventListener('newOrderCreated', handleNewOrder as EventListener);
    return () => window.removeEventListener('newOrderCreated', handleNewOrder as EventListener);
  }, [fetchOrders]);

  useEffect(() => {
    if (regularOrders.length > 0) {
      setLocalOrders(prev => {
        const merged = [...regularOrders];
        const existingIds = new Set(merged.map(o => o.id));
        prev.forEach(order => {
          if (order.id.startsWith('temp-') && !existingIds.has(order.id)) merged.push(order);
        });
        return merged.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
  }, [regularOrders]);

  const sortOptions = useMemo(() => [
    { value: 'status-time',       label: '🔄 Estado + Tiempo' },
    { value: 'waiting-time',      label: '⏱️ Tiempo Espera' },
    { value: 'delivery-priority', label: '🚚 Delivery Priority' },
    { value: 'total-desc',        label: '💰 Mayor Monto' },
    { value: 'created-desc',      label: '📅 Más Recientes' },
    { value: 'created-asc',       label: '📅 Más Antiguas' },
  ], []);

  // Filtrar por fecha según el modo seleccionado
  const dateFilteredOrders = useMemo(() => {
    if (showOnlyToday) {
      // Modo "Solo Hoy" - usa la función existente
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return localOrders.filter(order => {
        const d = new Date(order.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else {
      // Modo selector de fecha - filtrar por la fecha seleccionada
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      return localOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
    }
  }, [localOrders, showOnlyToday, selectedDate]);

  const filteredAndSortedOrders = useMemo(() => {
    if (!dateFilteredOrders.length) return [];
    let filtered = dateFilteredOrders;

    // Filtrar por área
    if (areaFilter) {
      filtered = filtered.filter(o => o.source.type === areaFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.customerName?.toLowerCase().includes(term) ||
        o.orderNumber?.toLowerCase().includes(term) ||
        o.kitchenNumber?.toLowerCase().includes(term) ||
        o.phone?.includes(term)
      );
    }

    // Filtrar por método de pago
    if (paymentFilter) {
      filtered = filtered.filter(o => o.paymentMethod === paymentFilter);
    }

    // Ordenar
    if (filtered.length > 1) {
      filtered = [...filtered].sort((a, b) => {
        switch (currentSort) {
          case 'status-time': {
            const so: Record<string, number> = { pending: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 5 };
            if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status];
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          case 'waiting-time':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'delivery-priority': {
            const to: Record<string, number> = { delivery: 1, phone: 2, 'walk-in': 3 };
            return to[a.source.type] - to[b.source.type];
          }
          case 'total-desc':      return b.total - a.total;
          case 'created-desc':    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'created-asc':     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          default: return 0;
        }
      });
    }

    return filtered;
  }, [dateFilteredOrders, searchTerm, areaFilter, paymentFilter, currentSort]);

  const pagination = usePagination({
    items: filteredAndSortedOrders,
    itemsPerPage,
    mobileBreakpoint: 768
  });

  const getDisplayNumber = useCallback((order: Order) => {
    if (order.source.type === 'phone') return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  }, []);

  const getNumberType   = useCallback((order: Order) => order.source.type === 'phone' ? 'kitchen' : 'order', []);
  const getSourceText   = useCallback((t: string) => ({ phone: 'Teléfono', 'walk-in': 'Presencial', delivery: 'Delivery' }[t] || t), []);
  const getAreaIcon     = useCallback((t: string) => ({ phone: '🍳', 'walk-in': '👤', delivery: '🚚' }[t] || '📋'), []);
  
  const getPaymentColor = useCallback((m?: string) => ({
    'EFECTIVO':  'bg-green-100 text-green-800 border-green-200',
    'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
    'TARJETA':   'bg-blue-100 text-blue-800 border-blue-200',
  }[m || ''] || 'bg-gray-100 text-gray-800 border-gray-200'), []);
  
  const getPaymentText  = useCallback((m?: string) => ({ EFECTIVO: 'EFECTIVO', 'YAPE/PLIN': 'YAPE/PLIN', TARJETA: 'TARJETA' }[m || ''] || 'NO APLICA'), []);

  const handleRowMouseEnter = useCallback((order: Order, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);
  const handleRowMouseLeave = useCallback(() => setPreviewOrder(null), []);

  const handleDeleteOrder = useCallback(async (orderId: string, orderNumber: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la orden ${orderNumber}?`)) {
      setLocalOrders(prev => prev.filter(o => o.id !== orderId));
      const result = await deleteOrder(orderId);
      if (result.success) {
        setDeletedOrder({ id: orderId, number: orderNumber });
        setTimeout(() => setDeletedOrder(null), 3000);
      }
    }
  }, [deleteOrder]);

  const handleEditPayment = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleSavePaymentMethod = useCallback(async (orderId: string, newPaymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | undefined) => {
    try {
      const previousMethod = localOrders.find(o => o.id === orderId)?.paymentMethod;
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentMethod: newPaymentMethod } : o));
      const result = await updateOrderPayment(orderId, newPaymentMethod);
      if (!result.success) {
        setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentMethod: previousMethod } : o));
        alert('❌ Error al actualizar el método de pago: ' + result.error);
      } else {
        alert('✅ Método de pago actualizado correctamente');
      }
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      alert('❌ Error inesperado: ' + error.message);
    }
  }, [updateOrderPayment, localOrders]);

  const handleExportExcel = useCallback(async (startDate: Date, endDate: Date) => {
    if (exporting) return;
    setExporting(true);
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
    toast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generando reporte...</span></div>';
    document.body.appendChild(toast);
    try {
      const todaySummary = await getTodaySummary(regularOrders);
      console.log('📊 Resumen:', todaySummary);
      await exportOrdersByDateRange(regularOrders, startDate, endDate);
    } catch (error: any) {
      const errToast = document.createElement('div');
      errToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
      errToast.innerHTML = `<div>❌ Error: ${error.message}</div>`;
      document.body.appendChild(errToast);
      setTimeout(() => { if (document.body.contains(errToast)) document.body.removeChild(errToast); }, 3000);
    } finally {
      if (document.body.contains(toast)) document.body.removeChild(toast);
      setExporting(false);
    }
  }, [regularOrders, getTodaySummary, exporting]);

  const handlePrintTicket = useCallback((startDate: Date, endDate: Date) => {
    const filtered = regularOrders.filter(o => {
      const d = new Date(o.createdAt); d.setHours(0, 0, 0, 0);
      const s = new Date(startDate);   s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);     e.setHours(23, 59, 59, 999);
      return d >= s && d <= e;
    });
    if (!filtered.length) { alert('No hay órdenes en el rango seleccionado'); return; }
    printResumenTicket(generateTicketSummary(filtered, startDate, endDate), startDate, endDate);
  }, [regularOrders]);

  const handleExportTodayCSV  = useCallback(() => exportOrdersToCSV(getTodayOrders().filter(o => o.orderType !== 'fullday')), [getTodayOrders, exportOrdersToCSV]);
  const handleExportAllCSV    = useCallback(() => exportOrdersToCSV(regularOrders), [regularOrders, exportOrdersToCSV]);
  const handleExportTodayExcel= useCallback(() => exportOrdersToExcel(getTodayOrders().filter(o => o.orderType !== 'fullday'), 'today'), [getTodayOrders]);
  const handleExportAllExcel  = useCallback(() => exportOrdersToExcel(regularOrders, 'all'), [regularOrders]);

  const handleOpenCashRegister  = useCallback(() => { setCashModalType('open');  setShowCashModal(true); }, []);
  const handleCloseCashRegister = useCallback(() => { setCashModalType('close'); setShowCashModal(true); }, []);

  const handleCashConfirm = useCallback(async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const result = await openCashRegister(data.initialCash!);
      if (result.success) { alert('✅ Caja abierta correctamente'); setShowCashModal(false); }
      else alert('❌ Error al abrir caja: ' + result.error);
    } else {
      const result = await closeCashRegister(regularOrders, data.finalCash!, data.notes || '');
      if (result.success) {
        alert('✅ Caja cerrada correctamente');
        setShowCashModal(false);
        const t = document.createElement('div');
        t.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
        t.innerHTML = `<div>✅ Cierre #${result.closure?.closure_number} guardado</div>`;
        document.body.appendChild(t);
        setTimeout(() => { if (document.body.contains(t)) document.body.removeChild(t); }, 3000);
      } else {
        alert('❌ Error al cerrar caja: ' + result.error);
      }
    }
  }, [cashModalType, openCashRegister, closeCashRegister, regularOrders]);

  const handleToggleHistory = useCallback(() => setShowHistory(prev => !prev), []);
  const handleToggleShowOnlyToday = useCallback(() => setShowOnlyToday(prev => !prev), []);
  const handleDateChange = useCallback((date: Date) => setSelectedDate(date), []);

  const handleClearFilters = useCallback(() => {
    setAreaFilter('');
    setPaymentFilter('');
    setSearchTerm('');
  }, []);

  const desktopProps = isDesktopPagination(pagination) ? {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    startIndex: pagination.startIndex,
    endIndex: pagination.endIndex,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
  } : {};

  const mobileProps = isMobilePagination(pagination) ? {
    hasMoreItems: pagination.hasMoreItems,
    loadedItems: pagination.loadedItems,
    onLoadMore: pagination.loadMore,
  } : {};

  // Determinar si hay filtros activos
  const hasActiveFilters = areaFilter !== '' || paymentFilter !== '' || searchTerm !== '';

  return (
    <div className="space-y-4 sm:space-y-6">

      {deletedOrder && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full">
          <span>Orden {deletedOrder.number} eliminada</span>
        </div>
      )}

      {previewOrder && (
        <OrderPreview order={previewOrder} isVisible={true} position={previewPosition} />
      )}

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
        order={selectedOrder}
        onSave={handleSavePaymentMethod}
      />

      <DateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onConfirmExcel={handleExportExcel}
        onConfirmTicket={handlePrintTicket}
      />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedOrders.length} órdenes encontradas
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}</span>
          </div>
          {!cashRegister?.is_open ? (
            <button onClick={handleOpenCashRegister} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Abrir Caja</button>
          ) : (
            <button onClick={handleCloseCashRegister} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">Cerrar Caja</button>
          )}
          <button onClick={handleToggleHistory} className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
            {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
          </button>
        </div>
      </div>

      {/* SELECTOR DE FECHA ESTILO FULLDAY */}
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        showOnlyToday={showOnlyToday}
        onToggleShowOnlyToday={handleToggleShowOnlyToday}
      />

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleExportTodayCSV} disabled={exporting} className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>CSV Hoy</span>
        </button>
        <button onClick={handleExportAllCSV} disabled={exporting} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>CSV Todo</span>
        </button>
        <button onClick={handleExportTodayExcel} disabled={exporting} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>Excel Hoy</span>
        </button>
        <button onClick={handleExportAllExcel} disabled={exporting} className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>Excel Todo</span>
        </button>
        <button onClick={() => setShowDateRangeModal(true)} disabled={exporting} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>Reportes por Fechas</span>
          {exporting && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
        </button>
        <button onClick={() => { window.location.hash = '#reception'; }} className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-2 rounded-lg text-sm hover:from-red-600 hover:to-amber-600 flex items-center space-x-1" disabled={exporting}>
          <span>➕</span><span>Nueva Orden</span>
        </button>
      </div>

      <CashRegisterModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        type={cashModalType}
        cashRegister={cashRegister}
        todaySummary={undefined}
        onConfirm={handleCashConfirm}
        loading={salesLoading}
      />

      {showHistory && <SalesHistory />}

      {/* FILTROS - Buscar, Área, Método de Pago */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, teléfono..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              disabled={exporting}
            />
          </div>

          {/* Selector de Área */}
          <select 
            value={areaFilter} 
            onChange={(e) => setAreaFilter(e.target.value)} 
            className="px-3 py-2 border rounded-lg text-sm min-w-[140px]"
            disabled={exporting}
          >
            <option value="">📋 Todas las áreas</option>
            <option value="phone">🍳 Cocina</option>
            <option value="walk-in">👤 Local</option>
            <option value="delivery">🚚 Delivery</option>
          </select>

          {/* Selector de Método de Pago */}
          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)} 
            className="px-3 py-2 border rounded-lg text-sm min-w-[160px]"
            disabled={exporting}
          >
            <option value="">💰 Todos los pagos</option>
            <option value="EFECTIVO">💵 Efectivo</option>
            <option value="YAPE/PLIN">📱 Yape/Plin</option>
            <option value="TARJETA">💳 Tarjeta</option>
          </select>
        </div>

        {/* Indicadores de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {areaFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  📋 Área: {areaFilter === 'phone' ? 'Cocina' : areaFilter === 'walk-in' ? 'Local' : 'Delivery'}
                </span>
              )}
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

      <PaginationControls
        {...desktopProps}
        onPageChange={pagination.goToPage}
        {...mobileProps}
        isMobile={pagination.isMobile}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        onSortChange={setCurrentSort}
        currentSort={currentSort}
        sortOptions={sortOptions}
      />

      {/* TABLA */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading && !isInitialized ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando...</p>
          </div>
        ) : pagination.currentItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {showOnlyToday 
              ? 'No hay órdenes regulares para hoy' 
              : `No hay órdenes para el ${selectedDate.toLocaleDateString('es-PE')}`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente / Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área / Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagination.currentItems.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onMouseEnter={(e) => handleRowMouseEnter(order, e)}
                    onMouseLeave={handleRowMouseLeave}
                    onDelete={handleDeleteOrder}
                    onEditPayment={handleEditPayment}
                    user={user}
                    getDisplayNumber={getDisplayNumber}
                    getNumberType={getNumberType}
                    getSourceText={getSourceText}
                    getPaymentColor={getPaymentColor}
                    getPaymentText={getPaymentText}
                    getAreaIcon={getAreaIcon}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredAndSortedOrders.length > 0 && (
        <div className="bg-white rounded-lg p-4 border text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">Mostrando:</span>{' '}
              {isDesktopPagination(pagination) ? (
                <>{pagination.startIndex || 0}-{pagination.endIndex || 0} de {filteredAndSortedOrders.length} órdenes</>
              ) : (
                <>{pagination.loadedItems || 0} de {filteredAndSortedOrders.length} órdenes</>
              )}
            </div>
            <div>
              <span className="font-semibold">Total mostrado:</span> S/ {filteredAndSortedOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}
            </div>
          </div>
          {exporting && (
            <div className="mt-2 text-xs text-blue-600 flex items-center justify-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              Generando reporte, por favor espera...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
