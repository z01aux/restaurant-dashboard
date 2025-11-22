import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { Order } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination, isDesktopPagination, isMobilePagination } from '../../hooks/usePagination';
import { PaginationControls } from '../ui/PaginationControls';
import OrderTicket from './OrderTicket';

const OrdersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentSort, setCurrentSort] = useState('status-time');
  
  const { user } = useAuth();
  const { 
    orders, 
    loading, 
    updateOrderStatus, 
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
          // Pendientes → En Cocina → Listos → Entregados → Cancelados
          const statusOrder = { pending: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 5 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          // Mismo estado: más antiguos primero
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          
        case 'waiting-time':
          // Más tiempo esperando primero
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          
        case 'delivery-priority':
          // Delivery → Teléfono → Local
          const typeOrder = { delivery: 1, phone: 2, 'walk-in': 3 };
          return typeOrder[a.source.type] - typeOrder[b.source.type];
          
        case 'total-desc':
          // Mayor monto primero
          return b.total - a.total;
          
        case 'created-desc':
          // Más recientes primero
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          
        case 'created-asc':
          // Más antiguos primero
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

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-indigo-100 text-indigo-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
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

  // Función para obtener el número de orden a mostrar según el tipo
  const getDisplayNumber = (order: Order) => {
    // Para pedidos por teléfono, mostrar número de cocina
    if (order.source.type === 'phone') {
      return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
    }
    // Para walk-in y delivery, mostrar número de orden normal
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener el tipo de número (para estilos)
  const getNumberType = (order: Order) => {
    return order.source.type === 'phone' ? 'kitchen' : 'order';
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      alert('Error al actualizar estado: ' + result.error);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la orden ${orderNumber}? Esta acción no se puede deshacer.`)) {
      const result = await deleteOrder(orderId);
      if (result.success) {
        alert('✅ Orden eliminada correctamente');
      } else {
        alert('❌ Error al eliminar orden: ' + result.error);
      }
    }
  };

  // Función para manejar cambio en el filtro de método de pago
  const handlePaymentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentFilter(e.target.value);
  };

  // Función para exportar órdenes del día
  const handleExportTodayOrders = () => {
    const todayOrders = getTodayOrders();
    exportOrdersToCSV(todayOrders);
  };

  // Función para exportar todas las órdenes
  const handleExportAllOrders = () => {
    exportOrdersToCSV(orders);
  };

  // Función para redirigir a Recepción
  const handleNewOrder = () => {
    window.location.hash = '#reception';
    // Forzar recarga si ya está en reception
    if (window.location.hash === '#reception') {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
          <p className="text-gray-600">
            {filteredAndSortedOrders.length} de {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'}
          </p>
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

      {/* Resumen de Pagos - MOVIDO ARRIBA */}
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

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar órdenes por cliente, número de orden..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <select 
            value={paymentFilter}
            onChange={handlePaymentFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Todos los pagos</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="YAPE/PLIN">Yape/Plin</option>
            <option value="TARJETA">Tarjeta</option>
          </select>
        </div>
        
        {/* Mostrar filtro activo */}
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

      {/* CONTROLES DE PAGINACIÓN HÍBRIDA */}
      <PaginationControls
        // Desktop props
        {...desktopProps}
        onPageChange={pagination.goToPage}
        
        // Mobile props
        {...mobileProps}
        
        // Common props
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

      {/* Lista de órdenes */}
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
                    Orden
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pago
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
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
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {/* MOSTRAR SOLO EL NÚMERO PRINCIPAL SEGÚN EL TIPO DE PEDIDO */}
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
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.phone}</div>
                        {order.tableNumber && (
                          <div className="text-sm text-gray-500">Mesa {order.tableNumber}</div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {getSourceText(order.source.type)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          S/ {order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.paymentMethod)}`}>
                          {getPaymentText(order.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="preparing">Preparando</option>
                          <option value="ready">Listo</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <OrderTicket order={order} />
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteOrder(order.id, displayNumber)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar orden"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManager;
