// ============================================
// ARCHIVO COMPLETO: src/components/orders/OrdersManager.tsx
// ============================================

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, CheckCircle, FileSpreadsheet, FileText, Unlock, Lock, History } from 'lucide-react';
import { Order } from '../../types';
import { DailySummary } from '../../types/sales';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination, isDesktopPagination, isMobilePagination } from '../../hooks/usePagination';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { PaginationControls } from '../ui/PaginationControls';
import { OrderPreview } from './OrderPreview';
import OrderTicket from './OrderTicket';
import { exportOrdersToExcel, exportOrdersWithSummary } from '../../utils/exportUtils';
import { useSalesClosure } from '../../hooks/useSalesClosure';
import { CashRegisterModal } from '../sales/CashRegisterModal';
import { SalesHistory } from '../sales/SalesHistory';

const OrdersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentSort, setCurrentSort] = useState('status-time');
  const [deletedOrder, setDeletedOrder] = useState<{id: string, number: string} | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isMouseOverActions, setIsMouseOverActions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  
  const { user } = useAuth();
  const { 
    orders, 
    loading, 
    deleteOrder,
    exportOrdersToCSV,
    getTodayOrders
  } = useOrders();

  const { 
    cashRegister, 
    loading: salesLoading, 
    openCashRegister, 
    closeCashRegister,
    getTodaySummary 
  } = useSalesClosure();

  // Cargar resumen del día cuando cambien las órdenes
  useEffect(() => {
    const loadSummary = async () => {
      if (orders.length > 0) {
        const summary = await getTodaySummary(orders);
        setTodaySummary(summary);
      }
    };
    loadSummary();
  }, [orders, getTodaySummary]);

  // Opciones de ordenamiento
  const sortOptions = [
    { value: 'status-time', label: '🔄 Estado + Tiempo' },
    { value: 'waiting-time', label: '⏱️ Tiempo Espera' },
    { value: 'delivery-priority', label: '🚚 Delivery Priority' },
    { value: 'total-desc', label: '💰 Mayor Monto' },
    { value: 'created-desc', label: '📅 Más Recientes' },
    { value: 'created-asc', label: '📅 Más Antiguas' }
  ];

  // Filtrar y ordenar órdenes
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = 
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.kitchenNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone?.includes(searchTerm);
      
      const matchesPayment = paymentFilter === '' || order.paymentMethod === paymentFilter;
      
      return matchesSearch && matchesPayment;
    });

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
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

    return filtered;
  }, [orders, searchTerm, paymentFilter, currentSort]);

  // Usar el hook de paginación híbrida
  const pagination = usePagination({
    items: filteredAndSortedOrders,
    itemsPerPage: itemsPerPage,
    mobileBreakpoint: 768
  });

  // Shortcuts de teclado
  useKeyboardShortcuts({
    '1': () => pagination.goToPage(1),
    '2': () => pagination.goToPage(2),
    '3': () => pagination.goToPage(3),
    '4': () => pagination.goToPage(4),
    '5': () => pagination.goToPage(5),
    '6': () => pagination.goToPage(6),
    '7': () => pagination.goToPage(7),
    '8': () => pagination.goToPage(8),
    '9': () => pagination.goToPage(9),
    'ctrl+f': (e: KeyboardEvent) => {
      e.preventDefault();
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput?.focus();
    },
    'ctrl+n': () => handleNewOrder(),
    'ctrl+e': () => handleExportAllCSV(),
    'ctrl+arrowleft': () => {
      if (isDesktopPagination(pagination) && pagination.hasPrevPage) {
        pagination.prevPage();
      }
    },
    'ctrl+arrowright': () => {
      if (isDesktopPagination(pagination) && pagination.hasNextPage) {
        pagination.nextPage();
      }
    },
  });

  // Extraer propiedades condicionalmente
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

  // Funciones de exportación
  const handleExportTodayCSV = () => {
    const todayOrders = getTodayOrders();
    exportOrdersToCSV(todayOrders);
  };

  const handleExportAllCSV = () => {
    exportOrdersToCSV(orders);
  };

  const handleExportTodayExcel = () => {
    const todayOrders = getTodayOrders();
    exportOrdersToExcel(todayOrders, 'today');
  };

  const handleExportAllExcel = () => {
    exportOrdersToExcel(orders, 'all');
  };

  const handleExportWithSummary = () => {
    exportOrdersWithSummary(orders);
  };

  // Funciones de caja
  const handleOpenCashRegister = () => {
    setCashModalType('open');
    setShowCashModal(true);
  };

  const handleCloseCashRegister = () => {
    if (!todaySummary) return;
    setCashModalType('close');
    setShowCashModal(true);
  };

  const handleCashConfirm = async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const result = await openCashRegister(data.initialCash!);
      if (result.success) {
        alert('✅ Caja abierta correctamente');
        setShowCashModal(false);
      } else {
        alert('❌ Error: ' + result.error);
      }
    } else {
      const result = await closeCashRegister(orders, data.finalCash!, data.notes || '');
      if (result.success) {
        alert('✅ Caja cerrada correctamente');
        setShowCashModal(false);
        const shouldExport = window.confirm('¿Deseas exportar el resumen del cierre?');
        if (shouldExport) {
          handleExportWithSummary();
        }
      } else {
        alert('❌ Error: ' + result.error);
      }
    }
  };

  // Funciones de manejo de órdenes
  const handleRowMouseEnter = (order: Order, event: React.MouseEvent) => {
    if (isMouseOverActions) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({
      x: rect.left + (rect.width / 2),
      y: rect.top
    });
  };

  const handleRowMouseLeave = () => {
    setPreviewOrder(null);
  };

  const handleActionsMouseEnter = () => {
    setIsMouseOverActions(true);
    setPreviewOrder(null);
  };

  const handleActionsMouseLeave = () => {
    setIsMouseOverActions(false);
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la orden ${orderNumber}? Esta acción no se puede deshacer.`)) {
      const result = await deleteOrder(orderId);
      if (result.success) {
        setDeletedOrder({ id: orderId, number: orderNumber });
        setTimeout(() => {
          setDeletedOrder(null);
        }, 3000);
      } else {
        alert('❌ Error al eliminar orden: ' + result.error);
      }
    }
  };

  const handleNewOrder = () => {
    window.location.hash = '#reception';
    if (window.location.hash === '#reception') {
      window.location.reload();
    }
  };

  // Componente de acciones de orden
  const OrderActions: React.FC<{ order: Order; displayNumber: string }> = ({ order, displayNumber }) => {
    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleDeleteOrder(order.id, displayNumber);
    };

    return (
      <div 
        className="flex space-x-2"
        onMouseEnter={handleActionsMouseEnter}
        onMouseLeave={handleActionsMouseLeave}
      >
        <div>
          <OrderTicket order={order} />
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={handleDeleteClick}
            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors group relative"
            title="Eliminar orden"
          >
            🗑️
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Eliminar orden
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </button>
        )}
      </div>
    );
  };

  // Funciones auxiliares de estilos
  const getPaymentColor = (paymentMethod?: string) => {
    const colors = {
      'EFECTIVO': 'bg-green-100 text-green-800 border-green-200',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'TARJETA': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[paymentMethod as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentText = (paymentMethod?: string) => {
    const paymentMap = {
      'EFECTIVO': 'EFECTIVO',
      'YAPE/PLIN': 'YAPE/PLIN', 
      'TARJETA': 'TARJETA',
    };
    return paymentMethod ? paymentMap[paymentMethod as keyof typeof paymentMap] : 'NO APLICA';
  };

  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': 'Teléfono',
      'walk-in': 'Presencial',
      'delivery': 'Delivery',
    };
    return sourceMap[sourceType] || sourceType;
  };

  const getDisplayNumber = (order: Order) => {
    if (order.source.type === 'phone') {
      return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
    }
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  };

  const getNumberType = (order: Order) => {
    return order.source.type === 'phone' ? 'kitchen' : 'order';
  };

  // Renderizado principal
  return (
    <div className="space-y-6">
      {/* Notificación de eliminación */}
      {deletedOrder && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full">
          <div className="flex items-center space-x-2">
            <CheckCircle size={20} />
            <div>
              <div className="font-medium">✅ Orden eliminada</div>
              <div className="text-sm opacity-90">Orden {deletedOrder.number} eliminada correctamente</div>
            </div>
          </div>
        </div>
      )}

      {/* Previsualización de órdenes */}
      {!isMouseOverActions && (
        <OrderPreview 
          order={previewOrder!}
          isVisible={!!previewOrder}
          position={previewPosition}
        />
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
          <p className="text-gray-600 text-sm mt-1">Administra y exporta todas las ventas</p>
        </div>
        
        {/* ESTADO DE CAJA */}
        <div className="flex items-center space-x-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
          <div className={`w-3 h-3 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
          </span>
          {cashRegister?.is_open && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              S/ {cashRegister.current_cash?.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap gap-2">
        
        {/* BOTONES DE CAJA */}
        {!cashRegister?.is_open ? (
          <button
            onClick={handleOpenCashRegister}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          >
            <Unlock size={16} />
            <span className="hidden sm:inline">Abrir Caja</span>
            <span className="sm:hidden">🔓</span>
          </button>
        ) : (
          <button
            onClick={handleCloseCashRegister}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
            disabled={!todaySummary || todaySummary.total_orders === 0}
            title={!todaySummary?.total_orders ? 'No hay ventas para cerrar' : 'Cerrar caja'}
          >
            <Lock size={16} />
            <span className="hidden sm:inline">Cerrar Caja</span>
            <span className="sm:hidden">🔒</span>
            {todaySummary && todaySummary.total_orders > 0 && (
              <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {todaySummary.total_orders}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
        >
          <History size={16} />
          <span className="hidden sm:inline">Historial</span>
          <span className="sm:hidden">📜</span>
        </button>

        {/* BOTONES CSV */}
        <button 
          onClick={handleExportTodayCSV}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          title="Exportar ventas del día a CSV"
        >
          <Download size={16} />
          <span className="hidden sm:inline">CSV Hoy</span>
          <span className="sm:hidden">📥 Hoy</span>
        </button>
        
        <button 
          onClick={handleExportAllCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          title="Exportar todas las ventas a CSV"
        >
          <Download size={16} />
          <span className="hidden sm:inline">CSV Todo</span>
          <span className="sm:hidden">📥 Todo</span>
        </button>

        {/* BOTONES EXCEL */}
        <button 
          onClick={handleExportTodayExcel}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          title="Exportar ventas del día a Excel"
        >
          <FileSpreadsheet size={16} />
          <span className="hidden sm:inline">Excel Hoy</span>
          <span className="sm:hidden">📊 Hoy</span>
        </button>

        <button 
          onClick={handleExportAllExcel}
          className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          title="Exportar todas las ventas a Excel"
        >
          <FileSpreadsheet size={16} />
          <span className="hidden sm:inline">Excel Todo</span>
          <span className="sm:hidden">📊 Todo</span>
        </button>

        <button 
          onClick={handleExportWithSummary}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          title="Exportar con resumen incluido (Recomendado)"
        >
          <FileText size={16} />
          <span className="hidden sm:inline">Excel + Resumen</span>
          <span className="sm:hidden">📈 Completo</span>
        </button>

        <button 
          onClick={handleNewOrder}
          className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nueva Orden</span>
          <span className="sm:hidden">➕</span>
        </button>
      </div>

      {/* MODAL DE APERTURA/CIERRE DE CAJA */}
      <CashRegisterModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        type={cashModalType}
        cashRegister={cashRegister}
        todaySummary={todaySummary || undefined}
        onConfirm={handleCashConfirm}
        loading={salesLoading}
      />

      {/* HISTORIAL DE CIERRES */}
      {showHistory && (
        <div className="mt-6">
          <SalesHistory />
        </div>
      )}

      {/* RESUMEN DE PAGOS */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Pagos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { method: 'EFECTIVO', label: 'Efectivo', color: 'bg-green-100 text-green-800' },
            { method: 'YAPE/PLIN', label: 'Yape/Plin', color: 'bg-purple-100 text-purple-800' },
            { method: 'TARJETA', label: 'Tarjeta', color: 'bg-blue-100 text-blue-800' },
            { method: undefined, label: 'No Aplica', color: 'bg-gray-100 text-gray-800' }
          ].map(({ method, label, color }) => {
            const count = orders.filter(order => order.paymentMethod === method).length;
            const total = orders
              .filter(order => order.paymentMethod === method)
              .reduce((sum, order) => sum + order.total, 0);
            
            return (
              <div 
                key={label}
                className={`text-center p-3 rounded-lg cursor-pointer transition-all ${
                  paymentFilter === method 
                    ? 'ring-2 ring-red-500 bg-white shadow-md' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setPaymentFilter(paymentFilter === method ? '' : method || '')}
              >
                <div className={`text-2xl font-bold ${color.split(' ')[1]}`}>
                  {count}
                </div>
                <div className="text-sm text-gray-600">{label}</div>
                <div className="text-xs text-gray-500 font-semibold">
                  S/ {total.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, teléfono o número de orden..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Todos los pagos</option>
            <option value="EFECTIVO">💵 Efectivo</option>
            <option value="YAPE/PLIN">📱 Yape/Plin</option>
            <option value="TARJETA">💳 Tarjeta</option>
          </select>
        </div>
        
        {paymentFilter && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filtro activo:</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(paymentFilter)}`}>
              {getPaymentText(paymentFilter)}
            </span>
            <button
              onClick={() => setPaymentFilter('')}
              className="text-xs text-red-500 hover:text-red-700"
            >
              ✕ Limpiar
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
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          pagination.resetPagination();
        }}
        onSortChange={setCurrentSort}
        currentSort={currentSort}
        sortOptions={sortOptions}
      />

      {/* LISTA DE ÓRDENES */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-sm border border-white/20 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando órdenes...</p>
          </div>
        ) : pagination.currentItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {searchTerm || paymentFilter ? 'No se encontraron órdenes' : 'No hay órdenes registradas'}
            </div>
            <div className="text-gray-400 text-sm">
              {searchTerm && paymentFilter 
                ? 'Intenta con otros términos de búsqueda o cambia el filtro de pago' 
                : searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : paymentFilter
                ? `No hay órdenes con pago "${getPaymentText(paymentFilter)}"`
                : 'Las órdenes aparecerán aquí cuando las crees en Recepción'
              }
            </div>
            {(searchTerm || paymentFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPaymentFilter('');
                }}
                className="mt-4 text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente / Monto
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo / Pago
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha / Hora
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagination.currentItems.map((order) => {
                  const displayNumber = getDisplayNumber(order);
                  const numberType = getNumberType(order);
                  
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onMouseEnter={(e) => handleRowMouseEnter(order, e)}
                      onMouseLeave={handleRowMouseLeave}
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
                          {order.createdAt.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.createdAt.toLocaleTimeString()}
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
                        <OrderActions order={order} displayNumber={displayNumber} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PIE DE PÁGINA CON ESTADÍSTICAS */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-sm text-gray-600">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <span className="font-semibold">Total de órdenes:</span> {orders.length}
          </div>
          <div>
            <span className="font-semibold">Ventas totales:</span> S/ {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
          </div>
          <div>
            <span className="font-semibold">Hoy:</span> {getTodayOrders().length} órdenes
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersManager;