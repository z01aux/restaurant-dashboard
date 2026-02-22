// ============================================
// ARCHIVO OPTIMIZADO: src/components/kitchen/KitchenManager.tsx
// MEJORA: Polling más rápido (2 segundos)
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, Clock, AlertCircle, ChefHat } from 'lucide-react';
import { Order } from '../../types';
import { useOrders } from '../../hooks/useOrders';

// Componente Toast
const ToastNotification: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 ${type === 'success' ? 'bg-blue-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      isVisible ? 'animate-in slide-in-from-right-full opacity-100' : 'animate-out slide-out-to-right-full opacity-0'
    }`}>
      <div className="font-medium">{message}</div>
    </div>
  );
};

const KitchenManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('pending');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastOrderIds, setLastOrderIds] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  const { orders, updateOrderStatus, fetchOrders } = useOrders();

  // Inicializar AudioContext
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.log('Audio no disponible');
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Configurar polling rápido (2 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 2000); // Reducido de 5s a 2s
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchOrders]);

  // Detectar nuevas órdenes
  useEffect(() => {
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const currentIds = new Set(pendingOrders.map(o => o.id));
    
    // Encontrar nuevas órdenes
    const newOrders = pendingOrders.filter(order => !lastOrderIds.has(order.id));
    
    if (newOrders.length > 0) {
      newOrders.forEach(order => {
        showNewOrderNotification(order);
      });
    }
    
    setLastOrderIds(currentIds);
  }, [orders]);

  // Mostrar notificación de nueva orden
  const showNewOrderNotification = (order: Order) => {
    const message = `📱 Nuevo pedido ${order.kitchenNumber || `COM-${order.id.slice(-8)}`} - ${order.customerName}`;
    setToast({ message, type: 'success' });
    playNotificationSound();
  };

  // Sonido de notificación mejorado
  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) return;
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
      console.log('Audio no disponible');
    }
  };

  // Actualizar estado de la orden
  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success && newStatus === 'ready') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setToast({ 
          message: `✅ Pedido #${order.kitchenNumber || `COM-${orderId.slice(-8)}`} listo`, 
          type: 'success' 
        });
      }
    }
  };

  // Filtrar órdenes por estado
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'preparing') return order.status === 'preparing';
    return order.status === 'ready';
  });

  // Obtener icono según el estado
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing': return <ChefHat className="h-5 w-5 text-blue-500" />;
      case 'ready': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      pending: 'Pendiente',
      preparing: 'En Cocina',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return statusMap[status];
  };

  // Obtener color del estado
  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      preparing: 'bg-blue-100 text-blue-800 border-blue-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      delivered: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status];
  };

  // Calcular tiempo transcurrido
  const getTimeElapsed = (createdAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins === 1) return '1 min';
    return `${diffMins} min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 p-6">
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👨‍🍳 Cocina</h1>
              <p className="text-gray-600 mt-1">Actualización cada 2 segundos</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-red-500 text-white p-3 rounded-xl">
                <ChefHat size={24} />
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Activas</div>
                <div className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs de estado */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'pending' as const, name: '🕒 Pendientes', count: orders.filter(o => o.status === 'pending').length },
              { id: 'preparing' as const, name: '👨‍🍳 En Cocina', count: orders.filter(o => o.status === 'preparing').length },
              { id: 'ready' as const, name: '✅ Listos', count: orders.filter(o => o.status === 'ready').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white text-red-500' : 'bg-gray-300 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Lista de órdenes */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl text-gray-300 mb-4">✅</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay pedidos
                </h3>
                <p className="text-gray-500 text-sm">
                  Los nuevos pedidos aparecerán aquí automáticamente
                </p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200"
                >
                  {/* Header de la orden */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Comanda #{order.kitchenNumber || `COM-${order.id.slice(-8)}`}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{getTimeElapsed(order.createdAt)}</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Información del cliente */}
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-semibold">Cliente:</span> {order.customerName}
                          </div>
                          <div>
                            <span className="font-semibold">Tipo:</span> {
                              order.source.type === 'phone' ? '📞 Teléfono' :
                              order.source.type === 'walk-in' ? '👤 Local' : '🚚 Delivery'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items del pedido */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                              {item.quantity}x
                            </span>
                            <div>
                              <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                              {item.notes && (
                                <div className="text-xs text-gray-500">Nota: {item.notes}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-end space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                        >
                          <ChefHat size={16} />
                          <span>Tomar a Cocina</span>
                        </button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle size={16} />
                          <span>Marcar Listo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Estadísticas rápidas */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.status === 'preparing').length}
                </div>
                <div className="text-sm text-gray-600">En Cocina</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'ready').length}
                </div>
                <div className="text-sm text-gray-600">Listos</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}
                </div>
                <div className="text-sm text-gray-600">Activas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenManager;