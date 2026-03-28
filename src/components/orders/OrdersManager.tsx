// ARCHIVO: src/components/orders/OrdersManager.tsx
// ACTUALIZADO: Eliminado selector de ordenamiento duplicado en móvil
// Solo se mantiene el dropdown minimalista entre filtro de pago y buscador
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Pencil, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Receipt, ChevronDown } from 'lucide-react';
import { Order, PaymentMethod, SplitPaymentDetails } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { useComprobantes } from '../../hooks/useComprobantes';
import { OrderPreview } from './OrderPreview';
import { PreviewBottomSheet } from '../ui/PreviewBottomSheet';
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
import { EmitirComprobanteModal } from '../billing/EmitirComprobanteModal';
import { ConfirmModal } from '../ui/ConfirmModal';

// ============================================
// COMPONENTE MEMOIZADO PARA CADA FILA DE ORDEN
// ============================================
const OrderRow = React.memo(({
  order,
  onMouseEnter,
  onMouseLeave,
  onActionsMouseEnter,
  onDelete,
  onEditPayment,
  onEmitirComprobante,
  tieneComprobante,
  user,
  getDisplayNumber,
  getNumberType,
  getPaymentColor,
  getPaymentText,
  getAreaIcon
}: {
  order: Order;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onActionsMouseEnter: () => void;
  onDelete: (orderId: string, displayNumber: string) => void;
  onEditPayment: (order: Order) => void;
  onEmitirComprobante: (order: Order) => void;
  tieneComprobante: boolean;
  user: any;
  getDisplayNumber: (order: Order) => string;
  getNumberType: (order: Order) => string;
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

  const handleComprobanteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEmitirComprobante(order);
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer group relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <td className="px-3 py-3">
        <div className="flex items-center space-x-1.5 mb-0.5">
          <span className={`text-xs font-semibold ${
            numberType === 'kitchen' ? 'text-green-600' : 'text-blue-600'
          }`}>
            {displayNumber}
          </span>
          <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
            numberType === 'kitchen'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {numberType === 'kitchen' ? 'COC' : 'NOR'}
          </span>
        </div>
        <div className="font-medium text-gray-900 text-sm leading-tight">{order.customerName}</div>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs font-bold text-red-600">S/ {order.total.toFixed(2)}</span>
          <span className="text-xs text-gray-400">{getAreaIcon(order.source.type)}</span>
          <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full border ${getPaymentColor(order.paymentMethod)}`}>
            {getPaymentText(order.paymentMethod)}
          </span>
        </div>
       </td>

      <td className="px-3 py-3">
        <div className="text-xs text-gray-900 font-medium">
          {new Date(order.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(order.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </td>

      <td className="px-3 py-3">
        <div className="text-xs text-gray-900 font-medium">{order.items.length} ítem(s)</div>
        <div className="text-xs text-gray-500 truncate max-w-[180px]">
          {order.items.map((item: any) => item.menuItem.name).join(', ')}
        </div>
      </td>

      <td className="px-3 py-3" onMouseEnter={onActionsMouseEnter}>
        <div className="flex items-center space-x-1">
          <OrderTicket order={order} />

          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee') && (
            <button
              onClick={handleEditClick}
              title="Cambiar método de pago"
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Pencil size={13} />
            </button>
          )}

          <button
            onClick={handleComprobanteClick}
            title={tieneComprobante ? 'Comprobante ya emitido' : 'Emitir comprobante electrónico'}
            className={`p-1.5 rounded-lg border transition-colors ${
              tieneComprobante
                ? 'bg-green-50 text-green-600 border-green-200 cursor-default'
                : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'
            }`}
          >
            {tieneComprobante
              ? <span className="text-xs font-bold">✓</span>
              : <Receipt size={13} />
            }
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => onDelete(order.id, displayNumber)}
              title="Eliminar orden"
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
            >
              <span className="text-sm">🗑️</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ─── TARJETA MÓVIL ÓRDENES ─────────────────────────────────────────────
const OrderCard = React.memo(({
  order, onEditPayment, onDelete, onTapPreview, onEmitirComprobante,
  tieneComprobante,
  getDisplayNumber, getNumberType, getSourceText,
  getPaymentColor, getPaymentText, getAreaIcon, user,
}: {
  order: Order;
  onEditPayment: (order: Order) => void;
  onDelete: (orderId: string, displayNumber: string) => void;
  onTapPreview: (order: Order) => void;
  onEmitirComprobante: (order: Order) => void;
  tieneComprobante: boolean;
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

          <button
            onClick={(e) => { e.stopPropagation(); onEmitirComprobante(order); }}
            title={tieneComprobante ? 'Ya tiene comprobante' : 'Emitir comprobante'}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              tieneComprobante
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-300'
            }`}
          >
            <Receipt size={13} />
            <span>{tieneComprobante ? '✓' : 'CPE'}</span>
          </button>

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
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentSort, setCurrentSort] = useState('created-desc');
  const [deletedOrder, setDeletedOrder] = useState<{id: string, number: string} | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [orderParaComprobante, setOrderParaComprobante] = useState<Order | null>(null);

  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info' | 'success';
    confirmText?: string;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger',
  });

  const { user } = useAuth();
  const {
    orders,
    loading,
    deleteOrder,
    updateOrderPayment,
    updateOrderSplitPayment,
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

  const {
    comprobantes,
    orderIdsConComprobante,
    proximoNumeroBoleta,
    proximoNumeroFactura,
    guardarComprobante,
  } = useComprobantes();

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
    const handleOrderDeleted = (event: CustomEvent) => {
      const { orderId } = event.detail;
      setLocalOrders(prev => prev.filter(o => o.id !== orderId));
    };
    window.addEventListener('orderDeleted', handleOrderDeleted as EventListener);
    return () => window.removeEventListener('orderDeleted', handleOrderDeleted as EventListener);
  }, []);

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

  // Filtrado por búsqueda unificada
  const filteredOrders = useMemo(() => {
    let f = dateFilteredOrders;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      f = f.filter(o =>
        o.customerName?.toLowerCase().includes(term) ||
        o.orderNumber?.toLowerCase().includes(term) ||
        o.kitchenNumber?.toLowerCase().includes(term) ||
        o.phone?.includes(term)
      );
    }
    
    return f;
  }, [dateFilteredOrders, searchTerm]);

  // Ordenamiento
  const sortedOrders = useMemo(() => {
    let f = [...filteredOrders];
    
    switch(currentSort) {
      case 'created-desc':
        return f.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'created-asc':
        return f.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'total-desc':
        return f.sort((a,b) => b.total - a.total);
      case 'total-asc':
        return f.sort((a,b) => a.total - b.total);
      default:
        return f.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [filteredOrders, currentSort]);

  // Aplicar filtro de pago después del ordenamiento
  const filteredAndSortedOrders = useMemo(() => {
    let f = sortedOrders;
    if (paymentFilter) {
      f = f.filter(o => paymentFilter === 'NO_APLICA' ? !o.paymentMethod : o.paymentMethod === paymentFilter);
    }
    return f;
  }, [sortedOrders, paymentFilter]);

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
  }, [searchTerm, paymentFilter, selectedDate, currentSort]);

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

  const handleRowMouseEnter = useCallback((order: Order) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setPreviewOrder(order);
  }, []);

  const handleRowMouseLeave = useCallback(() => {}, []);

  const handleTableMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    closeTimerRef.current = setTimeout(() => {
      setPreviewOrder(null);
    }, 300);
  }, []);

  const handlePreviewMouseEnter = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  }, []);

  const handlePreviewMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setPreviewOrder(null);
    }, 100);
  }, []);

  const handleActionsMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
  }, []);

  const handleTapPreview = useCallback((order: Order) => {
    setPreviewOrder(order);
  }, []);

  const handleDeleteClick = useCallback((orderId: string, orderNumber: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Orden',
      message: `¿Estás seguro de eliminar la orden "${orderNumber}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        setLocalOrders(prev => prev.filter(o => o.id !== orderId));
        const result = await deleteOrder(orderId);
        if (result.success) {
          setDeletedOrder({ id: orderId, number: orderNumber });
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
        } else {
          alert('❌ Error al eliminar: ' + result.error);
          setLocalOrders(orders);
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  }, [deleteOrder, orders]);

  const handleEditPayment = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleEmitirComprobante = useCallback((order: Order) => {
    setOrderParaComprobante(order);
    setShowComprobanteModal(true);
  }, []);

  const handleComprobanteEmitido = useCallback(async (
    respuesta: any,
    _tipo: 'boleta' | 'factura',
  ) => {
    if (orderParaComprobante) {
      await guardarComprobante(orderParaComprobante, respuesta);
    }
    setShowComprobanteModal(false);
    setOrderParaComprobante(null);
  }, [orderParaComprobante, guardarComprobante]);

  const handleSavePaymentMethod = useCallback(async (
    orderId: string,
    newPaymentMethod: PaymentMethod | undefined,
    splitDetails?: SplitPaymentDetails
  ) => {
    try {
      const previousMethod = localOrders.find(o => o.id === orderId)?.paymentMethod;
      const previousSplit  = localOrders.find(o => o.id === orderId)?.splitPayment;

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
      ok.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
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

  const handleExportTodayExcel = useCallback(() => exportOrdersToExcel(getTodayOrders().filter(o => o.orderType !== 'fullday'), 'today'), [getTodayOrders]);
  const handleExportAllExcel = useCallback(() => exportOrdersToExcel(regularOrders, 'all'), [regularOrders]);

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
  // handleClearFilters removed (unused)

  const isAnyExporting   = exporting || exportingPDF;


  return (
    <div className="space-y-4 sm:space-y-6">

      {deletedOrder && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full">
          Orden {deletedOrder.number} eliminada
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
      />

      {previewOrder && !pagination.isMobile && (
        <OrderPreview
          order={previewOrder}
          isVisible={true}
          onClose={() => setPreviewOrder(null)}
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
          comprobante={comprobantes.find(c => c.order_id === previewOrder.id) ?? null}
        />
      )}

      {previewOrder && pagination.isMobile && (() => {
        const comp = comprobantes.find(c => c.order_id === previewOrder.id);
        return (
          <PreviewBottomSheet
            isOpen={true}
            onClose={() => setPreviewOrder(null)}
            orderNumber={getDisplayNumber(previewOrder)}
            badge={getNumberType(previewOrder) === 'kitchen'
              ? { label: 'COCINA', color: 'bg-green-100 text-green-700' }
              : { label: 'NORMAL', color: 'bg-blue-100 text-blue-700' }
            }
            total={previewOrder.total}
            totalColor="text-red-600"
            minutesAgo={Math.floor((Date.now() - new Date(previewOrder.createdAt).getTime()) / 60000)}
            fields={[
              { icon: '👤', value: previewOrder.customerName },
              { icon: '📞', value: previewOrder.phone || '—' },
              { icon: '💳', value: getPaymentText(previewOrder.paymentMethod) },
              { icon: '📋', value: getSourceText(previewOrder.source.type) },
              ...(previewOrder.address ? [{ icon: '🏠', value: previewOrder.address }] : []),
              ...(previewOrder.tableNumber ? [{ icon: '🪑', value: `Mesa ${previewOrder.tableNumber}` }] : []),
            ]}
            items={previewOrder.items.map(i => ({
              name: i.menuItem.name,
              quantity: i.quantity,
              price: i.menuItem.price,
            }))}
            notes={previewOrder.notes}
            comprobante={comp ? {
              tipo: comp.tipo_comprobante === 1 ? 'FACTURA' : 'BOLETA',
              serie: comp.serie,
              numero: comp.numero,
              aceptada_por_sunat: comp.aceptada_por_sunat,
              enlace_pdf: comp.enlace_pdf,
              anulado: comp.anulado,
            } : null}
            createdByName={previewOrder.createdByName}
          />
        );
      })()}

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
        order={selectedOrder}
        onSave={handleSavePaymentMethod}
      />

      <EmitirComprobanteModal
        isOpen={showComprobanteModal}
        onClose={() => { setShowComprobanteModal(false); setOrderParaComprobante(null); }}
        order={orderParaComprobante}
        proximoNumeroBoleta={proximoNumeroBoleta}
        proximoNumeroFactura={proximoNumeroFactura}
        onEmitido={handleComprobanteEmitido}
        yaEmitido={orderParaComprobante ? orderIdsConComprobante.has(orderParaComprobante.id) : false}
      />

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

      {/* Botones exportación */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleExportTodayExcel} disabled={isAnyExporting}
          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center space-x-1 disabled:opacity-50">
          <FileSpreadsheet size={15} /><span>Excel Hoy</span>
        </button>
        <button onClick={handleExportAllExcel} disabled={isAnyExporting}
          className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center space-x-1 disabled:opacity-50">
          <FileSpreadsheet size={15} /><span>Excel Todo</span>
        </button>
        <button onClick={() => setShowDateRangeModal(true)} disabled={isAnyExporting}
          className="bg-gradient-to-r from-red-600 to-amber-500 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 disabled:opacity-50 shadow-sm font-medium">
          <FileText size={15} />
          <span>Reportes por Fechas</span>
          {isAnyExporting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
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

      {/* ─── FILTRO DE PAGO CON MONTOS ─── */}
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

      {/* ─── SORTING CONTROLS (DROPDOWN MINIMALISTA) ─── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Ordenar por:</span>
          <select
            value={currentSort}
            onChange={(e) => setCurrentSort(e.target.value)}
            className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer"
          >
            <option value="created-desc">🕐 Más recientes</option>
            <option value="created-asc">🕐 Más antiguos</option>
            <option value="total-desc">💰 Mayor monto</option>
            <option value="total-asc">💰 Menor monto</option>
          </select>
        </div>
        
        {/* Contador de resultados */}
        <div className="text-xs text-gray-400">
          {filteredAndSortedOrders.length} orden{filteredAndSortedOrders.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {/* ─── BUSCADOR UNIFICADO (entre sorting controls y pedidos) ─── */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16}/>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, teléfono, número de orden..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white"
          />
        </div>
        {searchTerm && filteredAndSortedOrders.length === 0 && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            No se encontraron órdenes para "{searchTerm}"
          </p>
        )}
      </div>

      {/* ─── CONTROLES DESKTOP ─── */}
      {!pagination.isMobile && filteredAndSortedOrders.length > 0 && (
        <div className="bg-white/80 rounded-lg p-4 border mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.currentPage - 1) * itemsPerPage) + 1}–{Math.min(pagination.currentPage * itemsPerPage, filteredAndSortedOrders.length)} de{' '}
              <span className="font-semibold">{filteredAndSortedOrders.length}</span> órdenes
            </div>
            <div className="flex items-center space-x-4">
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 text-sm">
                {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
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

      {/* ─── ORDENAMIENTO MÓVIL ELIMINADO ─── */}
      {/* Ya no hay selector duplicado aquí */}

      {/* ─── TABLA / TARJETAS ─── */}
      {loading && !isInitialized ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando...</p>
        </div>
      ) : pagination.currentItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
          {searchTerm ? `No se encontraron órdenes para "${searchTerm}"` : `No hay órdenes para el ${selectedDate.toLocaleDateString('es-PE')}`}
        </div>
      ) : pagination.isMobile ? (
        <div className="space-y-3">
          {pagination.currentItems.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onEditPayment={handleEditPayment}
              onDelete={handleDeleteClick}
              onTapPreview={handleTapPreview}
              onEmitirComprobante={handleEmitirComprobante}
              tieneComprobante={orderIdsConComprobante.has(order.id)}
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
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden" onMouseLeave={handleTableMouseLeave}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente / Pago</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-20">Fecha</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Productos</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagination.currentItems.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onMouseEnter={() => handleRowMouseEnter(order)}
                    onMouseLeave={handleRowMouseLeave}
                    onActionsMouseEnter={handleActionsMouseEnter}
                    onDelete={handleDeleteClick}
                    onEditPayment={handleEditPayment}
                    onEmitirComprobante={handleEmitirComprobante}
                    tieneComprobante={orderIdsConComprobante.has(order.id)}
                    user={user}
                    getDisplayNumber={getDisplayNumber}
                    getNumberType={getNumberType}
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