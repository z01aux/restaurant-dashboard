import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Order } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination, isDesktopPagination, isMobilePagination } from '../../hooks/usePagination';
import { PaginationControls } from '../ui/PaginationControls';
import { OrderPreview } from './OrderPreview';
import OrderTicket from './OrderTicket';
import { exportOrdersToExcel, exportOrdersWithSummary } from '../../utils/exportUtils';
import { useSalesClosure } from '../../hooks/useSalesClosure';
import { CashRegisterModal } from '../sales/CashRegisterModal';
import { SalesHistory } from '../sales/SalesHistory';

// ============================================
// COMPONENTE MEMOIZADO PARA CADA FILA DE ORDEN
// ============================================
const OrderRow = React.memo(({ 
  order, 
  onMouseEnter, 
  onMouseLeave,
  onDelete,
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
  user: any;
  getDisplayNumber: (order: Order) => string;
  getNumberType: (order: Order) => string;
  getSourceText: (type: string) => string;
  getPaymentColor: (method?: string) => string;
  getPaymentText: (method?: string) => string;
}) => {
  const displayNumber = getDisplayNumber(order);
  const numberType = getNumberType(order);

  return (
    <tr 
      className="hover:bg-gray-50 cursor-pointer"
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
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.paymentMethod)}`}>
          {getPaymentText(order.paymentMethod)}
        </span>
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
  
  // Estado LOCAL para órdenes (para actualización inmediata)
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const { 
    orders, 
    loading, 
    deleteOrder,
    exportOrdersToCSV,
    getTodayOrders,
    fetchOrders
  } = useOrders();

  const { 
    cashRegister, 
    loading: salesLoading, 
    openCashRegister, 
    closeCashRegister
  } = useSalesClosure();

  // Inicializar órdenes locales cuando se cargan las de la BD
  useEffect(() => {
    if (orders.length > 0 && !isInitialized) {
      setLocalOrders(orders);
      setIsInitialized(true);
    }
  }, [orders, isInitialized]);

  // ESCUCHAR EVENTOS DE NUEVAS ÓRDENES
  useEffect(() => {
    const handleNewOrder = (event: CustomEvent) => {
      const newOrder = event.detail;
      console.log('📦 Nueva orden recibida en OrdersManager:', newOrder);
      
      // Agregar la nueva orden al estado local INMEDIATAMENTE
      setLocalOrders(prev => {
        if (prev.some(o => o.id === newOrder.id)) {
          return prev;
        }
        return [newOrder, ...prev];
      });

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
    if (orders.length > 0) {
      setLocalOrders(prev => {
        const merged = [...orders];
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
  }, [orders]);

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
            const typeOrder = { delivery: 1, phone: 2, 'walk-in': 3 };
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

  const handleExportTodayCSV = useCallback(() => {
    const todayOrders = getTodayOrders();
    exportOrdersToCSV(todayOrders);
  }, [getTodayOrders, exportOrdersToCSV]);

  const handleExportAllCSV = useCallback(() => {
    exportOrdersToCSV(orders);
  }, [orders, exportOrdersToCSV]);

  const handleExportTodayExcel = useCallback(() => {
    const todayOrders = getTodayOrders();
    exportOrdersToExcel(todayOrders, 'today');
  }, [getTodayOrders]);

  const handleExportAllExcel = useCallback(() => {
    exportOrdersToExcel(orders, 'all');
  }, [orders]);

  const handleExportSummary = useCallback(() => {
    exportOrdersWithSummary(orders);
  }, [orders]);

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
      }
    } else {
      const result = await closeCashRegister(orders, data.finalCash!, data.notes || '');
      if (result.success) {
        alert('✅ Caja cerrada correctamente');
        setShowCashModal(false);
      }
    }
  }, [cashModalType, openCashRegister, closeCashRegister, orders]);

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

  // ============================================
  // RENDERIZADO
  // ============================================

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

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedOrders.length} órdenes encontradas
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
        <button onClick={handleExportTodayCSV} className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600">
          CSV Hoy
        </button>
        <button onClick={handleExportAllCSV} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600">
          CSV Todo
        </button>
        <button onClick={handleExportTodayExcel} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700">
          Excel Hoy
        </button>
        <button onClick={handleExportAllExcel} className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800">
          Excel Todo
        </button>
        <button onClick={handleExportSummary} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700">
          Resumen
        </button>
        <button onClick={handleNewOrder} className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-2 rounded-lg text-sm hover:from-red-600 hover:to-amber-600">
          Nueva Orden
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
            />
          </div>
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
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
              ? 'No hay órdenes para hoy' 
              : 'No hay órdenes para mostrar'}
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
        </div>
      )}
    </div>
  );
};

export default OrdersManager;