import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Pencil, Download } from 'lucide-react';
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
  getPaymentText
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
}) => {
  const displayNumber = getDisplayNumber(order);
  const numberType = getNumberType(order);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('📝 Editando pago para orden:', order.id, order.orderNumber);
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
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {getSourceText(order.source.type)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.paymentMethod)}`}>
            {getPaymentText(order.paymentMethod)}
          </span>
          
          {(user?.role === 'admin' || user?.role === 'manager') && (
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
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
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
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [exporting, setExporting] = useState(false); // Nuevo estado para controlar exportación
  
  // Hooks
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

  // Obtener solo pedidos regulares (excluir FullDay)
  const regularOrders = useMemo(() => {
    return getRegularOrders();
  }, [getRegularOrders, orders]);

  // Inicializar órdenes locales cuando se cargan las de la BD
  useEffect(() => {
    if (regularOrders.length > 0 && !isInitialized) {
      setLocalOrders(regularOrders);
      setIsInitialized(true);
    }
  }, [regularOrders, isInitialized]);

  // ESCUCHAR EVENTOS DE NUEVAS ÓRDENES
  useEffect(() => {
    const handleNewOrder = (event: CustomEvent) => {
      const newOrder = event.detail;
      console.log('📦 Nueva orden recibida en OrdersManager:', newOrder);
      
      if (newOrder.orderType !== 'fullday') {
        setLocalOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) {
            return prev;
          }
          return [newOrder, ...prev];
        });
      }

      setTimeout(() => {
        fetchOrders(500);
      }, 100);
    };

    window.addEventListener('newOrderCreated', handleNewOrder as EventListener);

    return () => {
      window.removeEventListener('newOrderCreated', handleNewOrder as EventListener);
    };
  }, [fetchOrders]);

  // Actualizar cuando cambian las órdenes de la BD
  useEffect(() => {
    if (regularOrders.length > 0) {
      setLocalOrders(prev => {
        const merged = [...regularOrders];
        const existingIds = new Set(merged.map(o => o.id));
        
        prev.forEach(order => {
          if (order.id.startsWith('temp-') && !existingIds.has(order.id)) {
            merged.push(order);
          }
        });
        
        return merged.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
  }, [regularOrders]);

  // ============================================
  // MEMOIZACIONES
  // ============================================
  
  const sortOptions = useMemo(() => [
    { value: 'status-time', label: '🔄 Estado + Tiempo' },
    { value: 'waiting-time', label: '⏱️ Tiempo Espera' },
    { value: 'delivery-priority', label: '🚚 Delivery Priority' },
    { value: 'total-desc', label: '💰 Mayor Monto' },
    { value: 'created-desc', label: '📅 Más Recientes' },
    { value: 'created-asc', label: '📅 Más Antiguas' }
  ], []);

  // Filtrar órdenes del día
  const todayOrders = useMemo(() => {
    if (!showOnlyToday) return localOrders;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return localOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  }, [localOrders, showOnlyToday]);

  // Filtrar y ordenar
  const filteredAndSortedOrders = useMemo(() => {
    if (!todayOrders.length) return [];
    
    let filtered = todayOrders;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName?.toLowerCase().includes(term) ||
        order.orderNumber?.toLowerCase().includes(term) ||
        order.kitchenNumber?.toLowerCase().includes(term) ||
        order.phone?.includes(term)
      );
    }
    
    if (paymentFilter) {
      filtered = filtered.filter(order => order.paymentMethod === paymentFilter);
    }

    if (filtered.length > 1) {
      filtered = [...filtered].sort((a, b) => {
        switch (currentSort) {
          case 'status-time':
            const statusOrder = { pending: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 5 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
              return statusOrder[a.status] - statusOrder[b.status];
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'waiting-time':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'delivery-priority':
            const typeOrder: Record<string, number> = { 
              delivery: 1, 
              phone: 2, 
              'walk-in': 3 
            };
            return typeOrder[a.source.type] - typeOrder[b.source.type];
          case 'total-desc':
            return b.total - a.total;
          case 'created-desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'created-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [todayOrders, searchTerm, paymentFilter, currentSort]);

  // Paginación
  const pagination = usePagination({
    items: filteredAndSortedOrders,
    itemsPerPage: itemsPerPage,
    mobileBreakpoint: 768
  });

  // ============================================
  // FUNCIONES MEMOIZADAS
  // ============================================
  
  const getDisplayNumber = useCallback((order: Order) => {
    if (order.source.type === 'phone') {
      return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
    }
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  }, []);

  const getNumberType = useCallback((order: Order) => {
    return order.source.type === 'phone' ? 'kitchen' : 'order';
  }, []);

  const getSourceText = useCallback((sourceType: string) => {
    const sourceMap: Record<string, string> = {
      'phone': 'Teléfono',
      'walk-in': 'Presencial',
      'delivery': 'Delivery',
    };
    return sourceMap[sourceType] || sourceType;
  }, []);

  const getPaymentColor = useCallback((paymentMethod?: string) => {
    const colors: Record<string, string> = {
      'EFECTIVO': 'bg-green-100 text-green-800 border-green-200',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'TARJETA': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[paymentMethod || ''] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const getPaymentText = useCallback((paymentMethod?: string) => {
    const paymentMap: Record<string, string> = {
      'EFECTIVO': 'EFECTIVO',
      'YAPE/PLIN': 'YAPE/PLIN', 
      'TARJETA': 'TARJETA',
    };
    return paymentMethod ? paymentMap[paymentMethod] : 'NO APLICA';
  }, []);

  // ============================================
  // MANEJADORES DE EVENTOS
  // ============================================
  
  const handleRowMouseEnter = useCallback((order: Order, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({
      x: rect.left + (rect.width / 2),
      y: rect.top
    });
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setPreviewOrder(null);
  }, []);

  const handleDeleteOrder = useCallback(async (orderId: string, orderNumber: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la orden ${orderNumber}?`)) {
      setLocalOrders(prev => prev.filter(order => order.id !== orderId));
      
      const result = await deleteOrder(orderId);
      if (result.success) {
        setDeletedOrder({ id: orderId, number: orderNumber });
        setTimeout(() => setDeletedOrder(null), 3000);
      }
    }
  }, [deleteOrder]);

  const handleEditPayment = useCallback((order: Order) => {
    console.log('📝 Abriendo modal de edición de pago para orden:', order.id, order.orderNumber);
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleSavePaymentMethod = useCallback(async (orderId: string, newPaymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | undefined) => {
    console.log('💾 Guardando nuevo método de pago:', { orderId, newPaymentMethod });
    
    try {
      const previousMethod = localOrders.find(o => o.id === orderId)?.paymentMethod;
      
      setLocalOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, paymentMethod: newPaymentMethod } : order
      ));

      const result = await updateOrderPayment(orderId, newPaymentMethod);
      
      if (!result.success) {
        setLocalOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, paymentMethod: previousMethod } : order
        ));
        alert('❌ Error al actualizar el método de pago: ' + result.error);
      } else {
        alert('✅ Método de pago actualizado correctamente');
      }
      
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ Error inesperado: ' + error.message);
    }
  }, [updateOrderPayment, localOrders]);

  // ============================================
  // MANEJADOR DE EXPORTACIÓN POR FECHAS (ACTUALIZADO)
  // ============================================
  const handleExportExcel = useCallback(async (startDate: Date, endDate: Date) => {
    // Prevenir múltiples exportaciones simultáneas
    if (exporting) return;
    
    setExporting(true);
    
    // Crear toast de carga
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
    loadingToast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generando reporte...</span></div>';
    document.body.appendChild(loadingToast);
    
    try {
      // Obtener el resumen del día para mostrarlo en consola (debug)
      const todaySummary = await getTodaySummary(regularOrders);
      console.log('📊 Resumen del día para exportación:', todaySummary);
      
      // Llamar a la función asíncrona que ahora busca cierres guardados
      await exportOrdersByDateRange(regularOrders, startDate, endDate);
      
    } catch (error: any) {
      console.error('Error en exportación:', error);
      
      // Mostrar error
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
      errorToast.innerHTML = `<div>❌ Error: ${error.message}</div>`;
      document.body.appendChild(errorToast);
      
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 3000);
      
    } finally {
      // Eliminar el toast de carga
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
      }
      setExporting(false);
    }
  }, [regularOrders, getTodaySummary, exporting]);

  const handlePrintTicket = useCallback((startDate: Date, endDate: Date) => {
    const filteredOrders = regularOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    });

    if (filteredOrders.length === 0) {
      alert('No hay órdenes en el rango seleccionado');
      return;
    }

    const summary = generateTicketSummary(filteredOrders, startDate, endDate);
    printResumenTicket(summary, startDate, endDate);
  }, [regularOrders]);

  const handleExportTodayCSV = useCallback(() => {
    const todayOrders = getTodayOrders().filter(order => order.orderType !== 'fullday');
    exportOrdersToCSV(todayOrders);
  }, [getTodayOrders, exportOrdersToCSV]);

  const handleExportAllCSV = useCallback(() => {
    exportOrdersToCSV(regularOrders);
  }, [regularOrders, exportOrdersToCSV]);

  const handleExportTodayExcel = useCallback(() => {
    const todayOrders = getTodayOrders().filter(order => order.orderType !== 'fullday');
    exportOrdersToExcel(todayOrders, 'today');
  }, [getTodayOrders]);

  const handleExportAllExcel = useCallback(() => {
    exportOrdersToExcel(regularOrders, 'all');
  }, [regularOrders]);

  const handleNewOrder = useCallback(() => {
    window.location.hash = '#reception';
    if (window.location.hash === '#reception') {
      window.location.reload();
    }
  }, []);

  const handleOpenCashRegister = useCallback(() => {
    setCashModalType('open');
    setShowCashModal(true);
  }, []);

  const handleCloseCashRegister = useCallback(() => {
    setCashModalType('close');
    setShowCashModal(true);
  }, []);

  const handleCashConfirm = useCallback(async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const result = await openCashRegister(data.initialCash!);
      if (result.success) {
        alert('✅ Caja abierta correctamente');
        setShowCashModal(false);
      } else {
        alert('❌ Error al abrir caja: ' + result.error);
      }
    } else {
      const result = await closeCashRegister(regularOrders, data.finalCash!, data.notes || '');
      if (result.success) {
        alert('✅ Caja cerrada correctamente');
        setShowCashModal(false);
        
        // Mostrar resumen del cierre
        console.log('📊 Cierre exitoso:', result.closure);
        
        // Opcional: Mostrar toast con número de cierre
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
        successToast.innerHTML = `<div>✅ Cierre #${result.closure?.closure_number} guardado</div>`;
        document.body.appendChild(successToast);
        
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 3000);
        
      } else {
        alert('❌ Error al cerrar caja: ' + result.error);
      }
    }
  }, [cashModalType, openCashRegister, closeCashRegister, regularOrders]);

  const handleToggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  // Props para paginación
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

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Notificación de eliminación */}
      {deletedOrder && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full">
          <span>Orden {deletedOrder.number} eliminada</span>
        </div>
      )}

      {/* Preview flotante */}
      {previewOrder && (
        <OrderPreview 
          order={previewOrder}
          isVisible={true}
          position={previewPosition}
        />
      )}

      {/* MODAL DE EDICIÓN DE PAGO */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => {
          console.log('🔒 Cerrando modal de pago');
          setShowPaymentModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSave={handleSavePaymentMethod}
      />

      {/* MODAL DE RANGO DE FECHAS */}
      <DateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onConfirmExcel={handleExportExcel}
        onConfirmTicket={handlePrintTicket}
      />

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedOrders.length} órdenes encontradas (excluye FullDay)
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Toggle para mostrar solo hoy */}
          <button
            onClick={() => setShowOnlyToday(!showOnlyToday)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showOnlyToday 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {showOnlyToday ? '📅 Solo Hoy' : '📅 Todas las fechas'}
          </button>

          {/* Estado de caja */}
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
            </span>
          </div>

          {/* Botones de caja */}
          {!cashRegister?.is_open ? (
            <button 
              onClick={handleOpenCashRegister} 
              className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              Abrir Caja
            </button>
          ) : (
            <button 
              onClick={handleCloseCashRegister} 
              className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Cerrar Caja
            </button>
          )}

          <button 
            onClick={handleToggleHistory} 
            className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
          </button>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={handleExportTodayCSV} 
          className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 flex items-center space-x-1"
          disabled={exporting}
        >
          <Download size={16} />
          <span>CSV Hoy</span>
        </button>
        
        <button 
          onClick={handleExportAllCSV} 
          className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center space-x-1"
          disabled={exporting}
        >
          <Download size={16} />
          <span>CSV Todo</span>
        </button>

        <button 
          onClick={handleExportTodayExcel} 
          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center space-x-1"
          disabled={exporting}
        >
          <Download size={16} />
          <span>Excel Hoy</span>
        </button>

        <button 
          onClick={handleExportAllExcel} 
          className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center space-x-1"
          disabled={exporting}
        >
          <Download size={16} />
          <span>Excel Todo</span>
        </button>

        <button 
          onClick={() => setShowDateRangeModal(true)} 
          className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center space-x-1"
          disabled={exporting}
        >
          <Download size={16} />
          <span>Reportes por Fechas</span>
          {exporting && (
            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          )}
        </button>

        <button 
          onClick={handleNewOrder} 
          className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-2 rounded-lg text-sm hover:from-red-600 hover:to-amber-600 flex items-center space-x-1"
          disabled={exporting}
        >
          <span>➕</span>
          <span>Nueva Orden</span>
        </button>
      </div>

      {/* MODAL DE CAJA */}
      <CashRegisterModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        type={cashModalType}
        cashRegister={cashRegister}
        todaySummary={undefined}
        onConfirm={handleCashConfirm}
        loading={salesLoading}
      />

      {/* HISTORIAL */}
      {showHistory && <SalesHistory />}

      {/* FILTROS */}
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
              disabled={exporting}
            />
          </div>
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            disabled={exporting}
          >
            <option value="">Todos los pagos</option>
            <option value="EFECTIVO">💵 Efectivo</option>
            <option value="YAPE/PLIN">📱 Yape/Plin</option>
            <option value="TARJETA">💳 Tarjeta</option>
          </select>
        </div>
        {paymentFilter && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs text-gray-500">Filtro activo:</span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getPaymentColor(paymentFilter)}`}>
              {getPaymentText(paymentFilter)}
            </span>
            <button
              onClick={() => setPaymentFilter('')}
              className="text-xs text-red-500 hover:text-red-700"
              disabled={exporting}
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
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

      {/* TABLA DE ÓRDENES */}
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
              : 'No hay órdenes regulares para mostrar'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente / Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo / Pago</th>
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
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ESTADÍSTICAS RÁPIDAS */}
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
              <span className="font-semibold">Total mostrado:</span> S/ {filteredAndSortedOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
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