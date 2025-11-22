import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Download, CheckCircle } from 'lucide-react';
import { Order } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination, isDesktopPagination, isMobilePagination } from '../../hooks/usePagination';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { PaginationControls } from '../ui/PaginationControls';
import { OrderPreview } from './OrderPreview';
import OrderTicket from './OrderTicket';

const OrdersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentSort, setCurrentSort] = useState('status-time');
  const [deletedOrder, setDeletedOrder] = useState<{id: string, number: string} | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  
  const { user } = useAuth();
  const { 
    orders, 
    loading, 
    deleteOrder,
    exportOrdersToCSV,
    getTodayOrders
  } = useOrders();

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
    // Navegación de páginas
    '1': () => pagination.goToPage(1),
    '2': () => pagination.goToPage(2),
    '3': () => pagination.goToPage(3),
    '4': () => pagination.goToPage(4),
    '5': () => pagination.goToPage(5),
    '6': () => pagination.goToPage(6),
    '7': () => pagination.goToPage(7),
    '8': () => pagination.goToPage(8),
    '9': () => pagination.goToPage(9),

    // Acciones rápidas con Ctrl/Cmd
    'ctrl+f': (e) => {
      e.preventDefault();
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput?.focus();
    },
    'ctrl+n': () => handleNewOrder(),
    'ctrl+e': () => handleExportAllOrders(),
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

  // Funciones para manejar el hover de previsualización
  const handleRowMouseEnter = (order: Order, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({
      x: rect.right,
      y: rect.top
    });
  };

  const handleRowMouseLeave = () => {
    setPreviewOrder(null);
  };

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

  const handlePaymentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentFilter(e.target.value);
  };

  const handleExportTodayOrders = () => {
    const todayOrders = getTodayOrders();
    exportOrdersToCSV(todayOrders);
  };

  const handleExportAllOrders = () => {
    exportOrdersToCSV(orders);
  };

  const handleNewOrder = () => {
    window.location.hash = '#reception';
    if (window.location.hash === '#reception') {
      window.location.reload();
    }
  };

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
      <OrderPreview 
        order={previewOrder!}
        isVisible={!!previewOrder}
        position={previewPosition}
      />

      {/* Indicador de Shortcuts */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">🎹</span>
            <span className="text-sm text-blue-800 font-medium">Shortcuts disponibles:</span>
          </div>
          <div className="flex space-x-3 text-xs text-blue-700">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs">Ctrl/Cmd + F</kbd> Buscar</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs">Ctrl/Cmd + N</kbd> Nueva orden</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs">Ctrl/Cmd + E</kbd> Exportar</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs">1-9</kbd> Ir a página</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={handleExportTodayOrders}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Exportar Hoy</span>
          </button>
          <button 
            onClick={handleExportAllOrders}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Exportar Todo</span>
          </button>
          <button 
            onClick={handleNewOrder}
            className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nueva Orden</span>
          </button>
        </div>
      </div>

      {/* Resto del JSX existente (Resumen de Pagos, Búsqueda, Paginación, Tabla) */}
      {/* ... */}

      {/* En la tabla, modifica las filas para agregar los event handlers */}
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
              {/* Celdas existentes */}
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
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
                <div className="text-sm text-gray-500">
                  {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
                </div>
              </td>
              {/* ... resto de celdas */}
            </tr>
          );
        })}
      </tbody>
    </div>
  );
};

export default OrdersManager;
