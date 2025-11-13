import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Order } from '../../types';
import OrderTicket from './OrderTicket';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';

const OrdersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { 
    orders, 
    loading, 
    updateOrderStatus, 
    deleteOrder
  } = useOrders();

  const filteredOrders = orders.filter(order =>
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone?.includes(searchTerm)
  );

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

  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': 'Teléfono',
      'walk-in': 'Presencial',
      'delivery': 'Delivery',
    };
    return sourceMap[sourceType] || sourceType;
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

  // Función para formatear el ID de la orden
  const formatOrderId = (orderId: string) => {
    return `ORD-${orderId.slice(-8).toUpperCase()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
          <p className="text-gray-600">
            {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'} en total
          </p>
        </div>
        <button 
          onClick={() => window.location.hash = 'reception'}
          className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nueva Orden</span>
        </button>
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
              placeholder="Buscar órdenes por cliente o ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <select 
            onChange={(e) => {
              if (e.target.value) {
                setSearchTerm(e.target.value);
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="preparing">Preparando</option>
            <option value="ready">Listo</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-sm border border-white/20 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando órdenes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No se encontraron órdenes' : 'No hay órdenes registradas'}
            </div>
            <div className="text-gray-400 text-sm">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Las órdenes aparecerán aquí cuando las crees en Recepción'
              }
            </div>
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
                    Estado
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatOrderId(order.id)}</div>
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
                          onClick={() => handleDeleteOrder(order.id, formatOrderId(order.id))}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar orden"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManager;
