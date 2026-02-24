import React from 'react';
import { Order } from '../../types';
import { Clock, User, Phone, MapPin, Utensils, CreditCard } from 'lucide-react';

interface OrderPreviewProps {
  order: Order;
  isVisible: boolean;
  position: { x: number; y: number };
  shouldIgnoreEvents?: boolean; // Nueva propiedad para ignorar eventos
}

export const OrderPreview: React.FC<OrderPreviewProps> = ({ 
  order, 
  isVisible, 
  position,
  shouldIgnoreEvents = false // Valor por defecto false
}) => {
  if (!isVisible) return null;

  const getDisplayNumber = (order: Order) => {
    if (order.source.type === 'phone') {
      return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
    }
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  };

  const getTimeElapsed = (createdAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins === 1) return 'Hace 1 minuto';
    return `Hace ${diffMins} minutos`;
  };

  const getPaymentText = (paymentMethod?: string) => {
    const paymentMap = {
      'EFECTIVO': '💵 Efectivo',
      'YAPE/PLIN': '📱 Yape/Plin',
      'TARJETA': '💳 Tarjeta',
    };
    return paymentMethod ? paymentMap[paymentMethod as keyof typeof paymentMap] : 'NO APLICA';
  };

  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': '📞 Teléfono',
      'walk-in': '👤 Presencial',
      'delivery': '🚚 Delivery',
      'fullDay': '🎒 FullDay',
    };
    return sourceMap[sourceType] || sourceType;
  };

  // Calcular posición mejorada para evitar que se salga de la pantalla
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const previewWidth = 384; // max-w-sm = 384px
  const previewHeight = 400; // altura estimada

  let adjustedX = position.x + 10;
  let adjustedY = position.y;

  // Si se sale por la derecha, mostrar a la izquierda
  if (adjustedX + previewWidth > viewportWidth - 20) {
    adjustedX = position.x - previewWidth - 10;
  }

  // Si se sale por abajo, ajustar hacia arriba
  if (adjustedY + previewHeight > viewportHeight - 20) {
    adjustedY = viewportHeight - previewHeight - 20;
  }

  // Si se sale por arriba, ajustar hacia abajo
  if (adjustedY < 20) {
    adjustedY = 20;
  }

  return (
    <div 
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl max-w-sm w-full p-4 animate-in fade-in-0 zoom-in-95 ${
        shouldIgnoreEvents ? 'pointer-events-none' : ''
      }`}
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Utensils size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {getDisplayNumber(order)}
            </h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock size={12} />
              <span>{getTimeElapsed(order.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <CreditCard size={12} />
            <span className="font-semibold">{getPaymentText(order.paymentMethod)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {getSourceText(order.source.type)}
          </div>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User size={14} />
          <span className="font-medium">{order.customerName}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Phone size={14} />
          <span>{order.phone}</span>
        </div>
        {order.tableNumber && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span>Mesa {order.tableNumber}</span>
          </div>
        )}
        {order.address && (
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
            <span className="break-words">{order.address}</span>
          </div>
        )}
      </div>

      {/* Items del pedido */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Items del pedido:</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {item.quantity}x {item.menuItem.name}
                </div>
                {item.notes && (
                  <div className="text-xs text-gray-500 italic">Nota: {item.notes}</div>
                )}
              </div>
              <div className="text-gray-900 font-semibold ml-2">
                S/ {(item.menuItem.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total y notas */}
      <div className="border-t border-gray-100 pt-2">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-red-600">S/ {order.total.toFixed(2)}</span>
        </div>
        {order.notes && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
            <span className="font-medium">Notas generales:</span> {order.notes}
          </div>
        )}
      </div>

      {/* Flecha indicadora - Solo mostrar si está a la izquierda */}
      {adjustedX < position.x && (
        <div 
          className="absolute w-4 h-4 bg-white border-r border-t border-gray-200 transform rotate-45 -right-2 top-1/2 -translate-y-1/2"
        />
      )}
      {/* Flecha indicadora - Mostrar si está a la derecha */}
      {adjustedX >= position.x && (
        <div 
          className="absolute w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45 -left-2 top-1/2 -translate-y-1/2"
        />
      )}
    </div>
  );

};
