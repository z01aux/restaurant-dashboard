// ARCHIVO: src/components/orders/OrderPreview.tsx
// ✅ CON DETALLE DE PAGO MIXTO EN EL PREVIEW

import React from 'react';
import { Order } from '../../types';
import { Clock, User, Phone, MapPin, Utensils, CreditCard, X } from 'lucide-react';

interface OrderPreviewProps {
  order: Order;
  isVisible: boolean;
  position: { x: number; y: number };
  shouldIgnoreEvents?: boolean;
  onClose?: () => void;
}

export const OrderPreview: React.FC<OrderPreviewProps> = ({
  order,
  isVisible,
  position,
  shouldIgnoreEvents = false,
  onClose,
}) => {
  if (!isVisible) return null;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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

  // Función mejorada para mostrar el método de pago con detalle
  const getPaymentDisplay = (order: Order): string => {
    if (!order.paymentMethod) return 'NO APLICA';
    
    if (order.paymentMethod === 'MIXTO' && order.splitPayment) {
      // Construir el detalle del pago mixto
      const partes: string[] = [];
      if (order.splitPayment.efectivo > 0) {
        partes.push(`EFECTIVO S/ ${order.splitPayment.efectivo.toFixed(2)}`);
      }
      if (order.splitPayment.yapePlin > 0) {
        partes.push(`YAPE S/ ${order.splitPayment.yapePlin.toFixed(2)}`);
      }
      if (order.splitPayment.tarjeta > 0) {
        partes.push(`TARJETA S/ ${order.splitPayment.tarjeta.toFixed(2)}`);
      }
      return partes.join(' + ');
    }
    
    // Para pagos normales
    const paymentMap: Record<string, string> = {
      'EFECTIVO': 'EFECTIVO',
      'YAPE/PLIN': 'YAPE/PLIN',
      'TARJETA': 'TARJETA',
    };
    return paymentMap[order.paymentMethod] || 'NO APLICA';
  };

  // Función para obtener el color del badge según el método de pago
  const getPaymentBadgeColor = (order: Order): string => {
    if (!order.paymentMethod) return 'bg-gray-100 text-gray-800';
    
    if (order.paymentMethod === 'MIXTO') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    
    const colors: Record<string, string> = {
      'EFECTIVO': 'bg-green-100 text-green-800 border-green-200',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'TARJETA': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[order.paymentMethod] || 'bg-gray-100 text-gray-800';
  };

  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap: Record<Order['source']['type'], string> = {
      'phone': '📞 Teléfono',
      'walk-in': '👤 Presencial',
      'delivery': '🚚 Delivery',
      'fullDay': '🎒 FullDay',
      'oep': '📦 OEP',
      'loncheritas': '🍱 Loncheritas',
    };
    return sourceMap[sourceType] || sourceType;
  };

  const viewportWidth  = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const previewWidth   = 384;
  const margin         = 20;

  let adjustedX = position.x + 10;
  let adjustedY = position.y;

  if (adjustedX + previewWidth > viewportWidth - margin) {
    adjustedX = position.x - previewWidth - 10;
  }
  if (adjustedY < margin) adjustedY = margin;

  const maxHeight = viewportHeight - adjustedY - margin;

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Utensils size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{getDisplayNumber(order)}</h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock size={12} />
              <span>{getTimeElapsed(order.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentBadgeColor(order)}`}>
            <CreditCard size={12} className="mr-1" />
            <span>{getPaymentDisplay(order)}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">{getSourceText(order.source.type)}</div>
        </div>
      </div>

      {/* Info cliente */}
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
        {order.source.type === 'fullDay' && order.studentInfo && (
          <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-xs font-semibold text-purple-800 mb-1">🎒 Datos del Alumno:</div>
            <div className="text-xs text-gray-700">
              <div>Grado: {order.studentInfo.grade} "{order.studentInfo.section}"</div>
              <div>Apoderado: {order.studentInfo.guardianName}</div>
            </div>
          </div>
        )}
      </div>

      {/* Productos */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Items del pedido:</h4>
        <div className="space-y-1">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.quantity}x {item.menuItem.name}</div>
                {item.notes && <div className="text-xs text-gray-500 italic">Nota: {item.notes}</div>}
              </div>
              <div className="text-gray-900 font-semibold ml-2">S/ {(item.menuItem.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
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
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
          {content}
        </div>
      </>
    );
  }

  return (
    <div
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-96 p-4 animate-in fade-in-0 zoom-in-95 ${
        shouldIgnoreEvents ? 'pointer-events-none' : ''
      }`}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px`, maxHeight: `${maxHeight}px`, overflowY: 'auto', overflowX: 'hidden' }}
    >
      {content}
      {adjustedX < position.x ? (
        <div className="absolute w-4 h-4 bg-white border-r border-t border-gray-200 transform rotate-45 -right-2 top-6" />
      ) : (
        <div className="absolute w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45 -left-2 top-6" />
      )}
    </div>
  );
};