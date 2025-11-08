import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ChefHat } from 'lucide-react';
import { Order } from '../../types';

// Componente Toast igual al de Recepción
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
    }, 4000); // 4 segundos para notificaciones de cocina

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      isVisible 
        ? 'animate-in slide-in-from-right-full opacity-100' 
        : 'animate-out slide-out-to-right-full opacity-0'
    }`}>
      <div className="font-medium">{message}</div>
    </div>
  );
};

const KitchenManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('pending');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processedOrders, setProcessedOrders] = useState<Set<string>>(new Set());

  // Cargar órdenes desde localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('restaurant-orders');
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders).map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt)
      }));
      setOrders(parsedOrders);
      
      // Marcar todas las órdenes existentes como procesadas
      const existingOrderIds = new Set(parsedOrders.map((order: Order) => order.id));
      setProcessedOrders(existingOrderIds);
    }

    // Configurar polling para nuevas órdenes (cada 5 segundos)
    const interval = setInterval(checkForNewOrders, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Verificar nuevas órdenes - SOLO para pedidos NUEVOS
  const checkForNewOrders = () => {
    const savedOrders = localStorage.getItem('restaurant-orders');
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders);
      const currentOrders = parsedOrders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt)
      }));

      // Encontrar órdenes realmente NUEVAS (que no hemos procesado)
      const newOrders = currentOrders.filter((order: Order) => 
        !processedOrders.has(order.id) && order.status === 'pending'
      );

      // Mostrar notificación solo para órdenes nuevas pendientes
      newOrders.forEach((order: Order) => {
        showNewOrderNotification(order);
        // Marcar como procesada inmediatamente
        setProcessedOrders(prev => new Set([...prev, order.id]));
      });

      // Actualizar estado de órdenes
      setOrders(currentOrders);
    }
  };

  // Mostrar notificación de nueva orden - SOLO UNA por pedido
  const showNewOrderNotification = (order: Order) => {
    const message = `📱 Nuevo pedido #${formatOrderId(order.id)} - ${order.customerName} (${getSourceText(order.source.type)})`;
    setToast({ message, type: 'success' });
    
    // Reproducir sonido simple
    playNotificationSound();
  };

  // Sonido de notificación simple
  const playNotificationSound = () => {
    try {
      // Beep simple usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio no disponible');
    }
  };

  // Actualizar estado de la orden
  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('restaurant-orders', JSON.stringify(updatedOrders));

    // Mostrar confirmación cuando se marca como listo
    if (newStatus === 'ready') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setToast({ 
          message: `✅ Pedido #${formatOrderId(orderId)} marcado como LISTO`, 
          type: 'success' 
        });
      }
    }
  };

  // Filtrar órdenes por estado
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') {
      return order.status === 'pending';
    } else if (activeTab === 'preparing') {
      return order.status === 'preparing';
    } else {
      return order.status === 'ready';
    }
  });

  // Obtener icono según el estado
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing':
        return <ChefHat className="h-5 w-5 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
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
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins === 1) return 'Hace 1 minuto';
    return `Hace ${diffMins} minutos`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      {/* Notificación Toast simple */}
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
              <h1 className="text-2xl font-bold text-gray-900">👨‍🍳 Gestión de Cocina</h1>
              <p className="text-gray-600 mt-1">Control y seguimiento de pedidos en tiempo real</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-orange-500 text-white p-3 rounded-xl">
                <ChefHat size={24} />
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Órdenes activas</div>
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
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white text-orange-500' : 'bg-gray-300 text-gray-700'
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
                <div className="text-4xl text-gray-300 mb-4">
                  {activeTab === 'pending' ? '🕒' : activeTab === 'preparing' ? '👨‍🍳' : '✅'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab === 'pending' ? 'No hay pedidos pendientes' : 
                   activeTab === 'preparing' ? 'No hay pedidos en cocina' : 
                   'No hay pedidos listos'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {activeTab === 'pending' ? 'Los nuevos pedidos aparecerán aquí' : 
                   activeTab === 'preparing' ? 'Mueve los pedidos pendientes a cocina' : 
                   'Los pedidos listos para servir aparecerán aquí'}
                </p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  id={`order-${order.id}`}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                >
                  {/* Header de la orden */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Orden #{formatOrderId(order.id)}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Mesa: {order.tableNumber || 'N/A'}</span>
                            <span>•</span>
                            <span>{getTimeElapsed(order.createdAt)}</span>
                            <span>•</span>
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
                            <span className="font-semibold">Tipo:</span> {getSourceText(order.source.type)}
                          </div>
                        </div>
                        {order.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-semibold">Notas:</span> {order.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items del pedido */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Items del Pedido:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-semibold">
                              {item.quantity}x
                            </span>
                            <div>
                              <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                              {item.notes && (
                                <div className="text-xs text-gray-500">Nota: {item.notes}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total y acciones */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold text-gray-900">
                        Total: S/ {order.total.toFixed(2)}
                      </div>
                      
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                          >
                            <ChefHat size={16} />
                            <span>Tomar a Cocina</span>
                          </button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle size={16} />
                            <span>Marcar Listo</span>
                          </button>
                        )}
                        
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle size={16} />
                            <span>Entregado</span>
                          </button>
                        )}
                        
                        {order.status !== 'pending' && (
                          <button
                            onClick={() => {
                              const prevStatus = order.status === 'preparing' ? 'pending' : 'preparing';
                              updateOrderStatus(order.id, prevStatus);
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Retroceder
                          </button>
                        )}
                      </div>
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
              <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}
                </div>
                <div className="text-sm text-gray-600">Total Activas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares
const formatOrderId = (orderId: string) => {
  const numericId = parseInt(orderId.replace(/\D/g, ''));
  if (!isNaN(numericId)) {
    return String(numericId).padStart(8, '0');
  }
  return orderId;
};

const getSourceText = (sourceType: 'phone' | 'walk-in' | 'delivery') => {
  const sourceMap = {
    'phone': 'Teléfono',
    'walk-in': 'Presencial',
    'delivery': 'Delivery',
  };
  return sourceMap[sourceType] || sourceType;
};

export default KitchenManager;
