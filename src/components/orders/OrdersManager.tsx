// ARCHIVO: src/components/orders/OrdersManager.tsx
// ACTUALIZADO: Botón "Reporte PDF" agregado al modal de fechas
// ================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Pencil, Download, ChevronLeft, ChevronRight, FileText, ChevronDown } from 'lucide-react';
import { Order, PaymentMethod, SplitPaymentDetails } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { OrderPreview } from './OrderPreview';
import OrderTicket from './OrderTicket';
import { exportOrdersToExcel, exportOrdersByDateRange } from '../../utils/exportUtils';
import { generateTicketSummary, printResumenTicket } from '../../utils/ticketUtils';
import { generateSalesReportPDF } from './SalesReportPDF';
import { useSalesClosure } from '../../hooks/useSalesClosure';
import { CashRegisterModal } from '../sales/CashRegisterModal';
import { SalesHistory } from '../sales/SalesHistory';
import { PaymentMethodModal } from './PaymentMethodModal';
import { PaymentFilter } from '../ui/PaymentFilter';
import { OrdersDateFilter } from './OrdersDateFilter';
import { DateRangeModal } from './DateRangeModal';


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

      {/* onMouseEnter={onMouseLeave} oculta el preview al entrar a la celda de Acciones */}
      <td className="px-4 sm:px-6 py-4 text-sm font-medium" onMouseEnter={onMouseLeave}>
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


// ── TARJETA MÓVIL ÓRDENES ─────────────────────────────────────────────
const OrderCard = React.memo(({
  order, onEditPayment, onDelete, onTapPreview,
  getDisplayNumber, getNumberType, getSourceText,
  getPaymentColor, getPaymentText, getAreaIcon, user,
}: {
  order: Order;
  onEditPayment: (order: Order) => void;
  onDelete: (orderId: string, displayNumber: string) => void;
  onTapPreview: (order: Order) => void;
  getDisplayNumber: (order: Order) => string;
  getNumberType: (order: Order) => string;
  getSourceText: (type: string) => string;
  getPaymentColor: (method?: string) => string;
  getPaymentText: (method?: string) => string;
  getAreaIcon: (type: string) => string;
  user: any;
}) => {
  const displayNumber = getDisplayNumber(order);
  const numberType    = getNumberType(order);
  const areaIcon      = getAreaIcon(order.source.type);
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 active:bg-gray-50 transition-colors"
      onClick={() => onTapPreview(order)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium mb-0.5 ${numberType === 'kitchen' ? 'text-emerald-600' : 'text-blue-600'}`}>
            {displayNumber}
          </div>
          <div className="font-semibold text-gray-900 truncate">{order.customerName || 'Sin nombre'}</div>
          <div className="text-sm text-gray-500">{areaIcon} {getSourceText(order.source.type)}</div>
        </div>
        <div className="text-right ml-3 flex-shrink-0">
          <div className="text-lg font-bold text-red-600">S/ {order.total.toFixed(2)}</div>
          <div className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
        <span className="font-medium">{order.items.length} producto(s): </span>
        <span className="text-gray-500">{order.items.map(item => item.menuItem.name).join(', ')}</span>
      </div>
      <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.paymentMethod)}`}>
            {getPaymentText(order.paymentMethod)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEditPayment(order); }}
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-colors border border-blue-300"
            title="Cambiar método de pago"
          >
            <Pencil size={14} />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <OrderTicket order={order} />
          {user?.role === 'admin' && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(order.id, displayNumber); }}
              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar orden"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const OrdersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentSort, setCurrentSort] = useState('status-time');
  const [deletedOrder, setDeletedOrder] = useState<{id: string, number: string} | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const { user } = useAuth();
  const {
    orders,
    loading,
    deleteOrder,
    updateOrderPayment,
    updateOrderSplitPayment,
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

  const dateFilteredOrders = useMemo(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    return localOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });
  }, [localOrders, selectedDate]);

  const filteredAndSortedOrders = useMemo(() => {
    if (!dateFilteredOrders.length) return [];
    let filtered = dateFilteredOrders;

    if (areaFilter) {
      filtered = filtered.filter(o => o.source.type === areaFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.customerName?.toLowerCase().includes(term) ||
        o.orderNumber?.toLowerCase().includes(term) ||
        o.kitchenNumber?.toLowerCase().includes(term) ||
        o.phone?.includes(term)
      );
    }

    if (paymentFilter) {
      filtered = filtered.filter(o => o.paymentMethod === paymentFilter);
    }

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
          case 'total-desc':   return b.total - a.total;
          case 'created-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'created-asc':  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          default: return 0;
        }
      });
    }

    return filtered;
  }, [dateFilteredOrders, searchTerm, areaFilter, paymentFilter, currentSort]);

  const paymentTotals = useMemo(() => {
    let efectivo = 0, yape = 0, tarjeta = 0;
    dateFilteredOrders.forEach(o => {
      if (o.paymentMethod === 'MIXTO' && o.splitPayment) {
        efectivo += o.splitPayment.efectivo  || 0;
        yape     += o.splitPayment.yapePlin  || 0;
        tarjeta  += o.splitPayment.tarjeta   || 0;
      } else if (o.paymentMethod === 'EFECTIVO')  { efectivo += o.total; }
      else if (o.paymentMethod === 'YAPE/PLIN')   { yape     += o.total; }
      else if (o.paymentMethod === 'TARJETA')     { tarjeta  += o.total; }
    });
    const totalGeneral = dateFilteredOrders.reduce((sum, o) => sum + o.total, 0);
    return { efectivo, yape, tarjeta, totalGeneral };
  }, [dateFilteredOrders]);

  const pagination = usePagination({
    items: filteredAndSortedOrders,
    itemsPerPage,
    mobileBreakpoint: 768
  });

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  useEffect(() => {
    pagination.resetPagination();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, areaFilter, paymentFilter, selectedDate, currentSort]);

  const getDisplayNumber = useCallback((order: Order) => {
    if (order.source.type === 'phone') return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  }, []);

  const getNumberType   = useCallback((order: Order) => order.source.type === 'phone' ? 'kitchen' : 'order', []);
  const getSourceText   = useCallback((t: string) => ({ phone: 'Teléfono', 'walk-in': 'Presencial', delivery: 'Delivery' }[t] || t), []);
  const getAreaIcon     = useCallback((t: string) => ({ phone: '🍳', 'walk-in': '👤', delivery: '🚚' }[t] || '📋'), []);

  const getPaymentColor = useCallback((m?: string) => {
    const colors: Record<string, string> = {
      'EFECTIVO':  'bg-green-100 text-green-800 border-green-200',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'TARJETA':   'bg-blue-100 text-blue-800 border-blue-200',
      'MIXTO':     'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[m || ''] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const getPaymentText = useCallback((m?: string) => {
    const texts: Record<string, string> = {
      'EFECTIVO':  'EFECTIVO',
      'YAPE/PLIN': 'YAPE/PLIN',
      'TARJETA':   'TARJETA',
      'MIXTO':     'MIXTO'
    };
    return texts[m || ''] || 'NO APLICA';
  }, []);

  const handleRowMouseEnter = useCallback((order: Order, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleRowMouseLeave = useCallback(() => setPreviewOrder(null), []);

  const handleTapPreview = useCallback((order: Order) => {
    setPreviewOrder(order);
    setPreviewPosition({ x: 0, y: 0 });
  }, []);


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

  const handleSavePaymentMethod = useCallback(async (
    orderId: string,
    newPaymentMethod: PaymentMethod | undefined,
    splitDetails?: SplitPaymentDetails
  ) => {
    try {
      const previousMethod = localOrders.find(o => o.id === orderId)?.paymentMethod;
      const previousSplit  = localOrders.find(o => o.id === orderId)?.splitPayment;

      // Optimistic update
      setLocalOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          const updatedOrder = { ...o, paymentMethod: newPaymentMethod };
          if (newPaymentMethod === 'MIXTO' && splitDetails) {
            updatedOrder.splitPayment = splitDetails;
          } else {
            delete updatedOrder.splitPayment;
          }
          return updatedOrder;
        }
        return o;
      }));

      let result;
      if (newPaymentMethod === 'MIXTO' && splitDetails) {
        const paymentResult = await updateOrderPayment(orderId, 'MIXTO');
        if (paymentResult.success) {
          result = await updateOrderSplitPayment(orderId, splitDetails);
        } else {
          result = paymentResult;
        }
      } else {
        result = await updateOrderPayment(orderId, newPaymentMethod);
      }

      if (!result.success) {
        setLocalOrders(prev => prev.map(o => {
          if (o.id === orderId) {
            const revertedOrder = { ...o, paymentMethod: previousMethod };
            if (previousMethod === 'MIXTO' && previousSplit) {
              revertedOrder.splitPayment = previousSplit;
            } else {
              delete revertedOrder.splitPayment;
            }
            return revertedOrder;
          }
          return o;
        }));
        alert('❌ Error al actualizar el método de pago: ' + result.error);
      } else {
        await fetchOrders(500);
      }
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      alert('❌ Error inesperado: ' + error.message);
      await fetchOrders(500);
    }
  }, [updateOrderPayment, updateOrderSplitPayment, localOrders, fetchOrders]);

  // ── HANDLER EXCEL ──
  const handleExportExcel = useCallback(async (startDate: Date, endDate: Date) => {
    if (exporting) return;
    setExporting(true);
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
    toast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generando Excel...</span></div>';
    document.body.appendChild(toast);
    try {
      await exportOrdersByDateRange(regularOrders, startDate, endDate);
      const ok = document.createElement('div');
      ok.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
      ok.innerHTML = '<div>✅ Excel generado correctamente</div>';
      document.body.appendChild(ok);
      setTimeout(() => { if (document.body.contains(ok)) document.body.removeChild(ok); }, 3000);
    } catch (error: any) {
      const errToast = document.createElement('div');
      errToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errToast.innerHTML = `<div>❌ Error: ${error.message}</div>`;
      document.body.appendChild(errToast);
      setTimeout(() => { if (document.body.contains(errToast)) document.body.removeChild(errToast); }, 3000);
    } finally {
      if (document.body.contains(toast)) document.body.removeChild(toast);
      setExporting(false);
    }
  }, [regularOrders, exporting]);

  // ── HANDLER PDF (NUEVO) ──
  const handleExportPDF = useCallback(async (startDate: Date, endDate: Date) => {
    if (exportingPDF) return;
    setExportingPDF(true);
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
    toast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generando PDF...</span></div>';
    document.body.appendChild(toast);
    try {
      await generateSalesReportPDF(regularOrders, startDate, endDate);
      const ok = document.createElement('div');
      ok.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
      ok.innerHTML = '<div>✅ PDF generado correctamente</div>';
      document.body.appendChild(ok);
      setTimeout(() => { if (document.body.contains(ok)) document.body.removeChild(ok); }, 3000);
    } catch (error: any) {
      const errToast = document.createElement('div');
      errToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errToast.innerHTML = `<div>❌ Error al generar PDF: ${error.message}</div>`;
      document.body.appendChild(errToast);
      setTimeout(() => { if (document.body.contains(errToast)) document.body.removeChild(errToast); }, 3000);
    } finally {
      if (document.body.contains(toast)) document.body.removeChild(toast);
      setExportingPDF(false);
    }
  }, [regularOrders, exportingPDF]);

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

  const handleExportTodayCSV   = useCallback(() => exportOrdersToCSV(getTodayOrders().filter(o => o.orderType !== 'fullday')), [getTodayOrders, exportOrdersToCSV]);
  const handleExportAllCSV     = useCallback(() => exportOrdersToCSV(regularOrders), [regularOrders, exportOrdersToCSV]);
  const handleExportTodayExcel = useCallback(() => exportOrdersToExcel(getTodayOrders().filter(o => o.orderType !== 'fullday'), 'today'), [getTodayOrders]);
  const handleExportAllExcel   = useCallback(() => exportOrdersToExcel(regularOrders, 'all'), [regularOrders]);

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

  const handleToggleHistory       = useCallback(() => setShowHistory(prev => !prev), []);
  const handleClearFilters = useCallback(() => {
    setAreaFilter('');
    setPaymentFilter('');
    setSearchTerm('');
  }, []);

  const hasActiveFilters = areaFilter !== '' || paymentFilter !== '' || searchTerm !== '';
  const isAnyExporting   = exporting || exportingPDF;

  return (
    <div className="space-y-4 sm:space-y-6">

      {deletedOrder && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full">
          <span>Orden {deletedOrder.number} eliminada</span>
        </div>
      )}

      {previewOrder && (
        <OrderPreview order={previewOrder} isVisible={true} position={previewPosition}
          onClose={() => setPreviewOrder(null)}
        />
      )}

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
        order={selectedOrder}
        onSave={handleSavePaymentMethod}
      />

      {/* ── MODAL DE FECHAS: ahora recibe onConfirmPDF ── */}
      <DateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onConfirmExcel={handleExportExcel}
        onConfirmTicket={handlePrintTicket}
        onConfirmPDF={handleExportPDF}
      />

      {/* ── HEADER ── */}
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

      {/* ── SELECTOR DE FECHA ── */}
      <OrdersDateFilter
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        totalOrders={filteredAndSortedOrders.length}
      />

      {/* ── BOTONES DE ACCIÓN ── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportTodayCSV}
          disabled={isAnyExporting}
          className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 flex items-center space-x-1 disabled:opacity-50"
        >
          <Download size={16} /><span>CSV Hoy</span>
        </button>
        <button
          onClick={handleExportAllCSV}
          disabled={isAnyExporting}
          className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center space-x-1 disabled:opacity-50"
        >
          <Download size={16} /><span>CSV Todo</span>
        </button>
        <button
          onClick={handleExportTodayExcel}
          disabled={isAnyExporting}
          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center space-x-1 disabled:opacity-50"
        >
          <Download size={16} /><span>Excel Hoy</span>
        </button>
        <button
          onClick={handleExportAllExcel}
          disabled={isAnyExporting}
          className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center space-x-1 disabled:opacity-50"
        >
          <Download size={16} /><span>Excel Todo</span>
        </button>

        {/* ── BOTÓN REPORTES POR FECHAS (abre el modal con Ticket + Excel + PDF) ── */}
        <button
          onClick={() => setShowDateRangeModal(true)}
          disabled={isAnyExporting}
          className="bg-gradient-to-r from-red-600 to-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:from-red-700 hover:to-amber-600 flex items-center space-x-2 disabled:opacity-50 shadow-sm font-medium"
        >
          <FileText size={16} />
          <span>Reportes por Fechas</span>
          {isAnyExporting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          )}
        </button>

        <button
          onClick={() => { window.location.hash = '#reception'; }}
          className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-2 rounded-lg text-sm hover:from-red-600 hover:to-amber-600 flex items-center space-x-1"
          disabled={isAnyExporting}
        >
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

      {/* ── FILTROS ── */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, teléfono..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              disabled={isAnyExporting}
            />
          </div>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm min-w-[140px]"
            disabled={isAnyExporting}
          >
            <option value="">📋 Todas las áreas</option>
            <option value="phone">🍳 Cocina</option>
            <option value="walk-in">👤 Local</option>
            <option value="delivery">🚚 Delivery</option>
          </select>
        </div>

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

      {/* ── FILTRO DE PAGO CON MONTOS ── */}
      <div className="mb-4">
        <PaymentFilter
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          totalEfectivo={paymentTotals.efectivo}
          totalYape={paymentTotals.yape}
          totalTarjeta={paymentTotals.tarjeta}
          totalGeneral={paymentTotals.totalGeneral}
          showAmounts={true}
        />
      </div>

      {/* ── CONTROLES DESKTOP ── */}
      {!pagination.isMobile && (
        <div className="bg-white/80 backdrop-blur-lg rounded-lg p-4 border border-gray-200 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.currentPage - 1) * itemsPerPage) + 1}–{Math.min(pagination.currentPage * itemsPerPage, filteredAndSortedOrders.length)} de{' '}
              <span className="font-semibold">{filteredAndSortedOrders.length}</span> órdenes
            </div>
            <div className="flex items-center space-x-4">
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 text-sm">
                {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={currentSort} onChange={(e) => setCurrentSort(e.target.value)} className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 text-sm">
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex items-center space-x-1">
                <button onClick={pagination.prevPage} disabled={pagination.currentPage === 1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
                <span className="px-3 py-1 text-sm">{pagination.currentPage} / {totalPages || 1}</span>
                <button onClick={pagination.nextPage} disabled={pagination.currentPage >= (totalPages || 1)} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── ORDENAMIENTO MÓVIL ── */}
      {pagination.isMobile && (
        <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border shadow-sm mb-3">
          <span className="text-xs text-gray-500 font-medium">{filteredAndSortedOrders.length} órdenes</span>
          <select value={currentSort} onChange={(e) => setCurrentSort(e.target.value)} className="text-xs border-0 bg-transparent text-gray-700 font-medium focus:ring-0">
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {/* ── TABLA / TARJETAS ── */}
      {loading && !isInitialized ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando...</p>
        </div>
      ) : pagination.currentItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
          {hasActiveFilters
            ? 'No se encontraron órdenes con los filtros aplicados'
            : `No hay órdenes para el ${selectedDate.toLocaleDateString('es-PE')}`}
        </div>
      ) : pagination.isMobile ? (
        <div className="space-y-3">
          {pagination.currentItems.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onEditPayment={handleEditPayment}
              onDelete={handleDeleteOrder}
              onTapPreview={handleTapPreview}
              user={user}
              getDisplayNumber={getDisplayNumber}
              getNumberType={getNumberType}
              getSourceText={getSourceText}
              getPaymentColor={getPaymentColor}
              getPaymentText={getPaymentText}
              getAreaIcon={getAreaIcon}
            />
          ))}
          {(pagination as any).hasMoreItems && (
            <button onClick={(pagination as any).loadMore}
              className="w-full py-3 bg-white border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center space-x-2">
              <ChevronDown size={18} />
              <span>Cargar más ({(pagination as any).loadedItems} de {filteredAndSortedOrders.length})</span>
            </button>
          )}
        </div>
      ) : (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
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
        </div>
      )}

      {filteredAndSortedOrders.length > 0 && (
        <div className="bg-white rounded-lg p-4 border text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div><span className="font-semibold">Total mostrado:</span> S/ {filteredAndSortedOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}</div>
            {isAnyExporting && (
              <div className="text-xs text-red-600 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                <span>Generando reporte...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
