// ============================================
// ARCHIVO: src/components/fullday/FullDayOrderPreview.tsx
// VERSIÓN CORREGIDA - Con pointer-events-none
// ============================================

import React from 'react';
import { FullDayOrder } from '../../types/fullday';
import { Clock, User, Phone, GraduationCap, Users, Utensils, CreditCard } from 'lucide-react';

interface FullDayOrderPreviewProps {
  order: FullDayOrder;
  isVisible: boolean;
  position: { x: number; y: number };
  shouldIgnoreEvents?: boolean;
}

export const FullDayOrderPreview: React.FC<FullDayOrderPreviewProps> = ({ 
  order, 
  isVisible, 
  position,
  shouldIgnoreEvents = false
}) => {
  if (!isVisible) return null;

  const getDisplayNumber = (order: FullDayOrder) => {
    return order.order_number || `FD-${order.id.slice(-8).toUpperCase()}`;
  };

  const getTimeElapsed = (createdAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins === 1) return 'Hace 1 minuto';
    return `Hace ${diffMins} minutos`;
  };

  const getPaymentText = (paymentMethod?: string | null) => {
    const paymentMap: Record<string, string> = {
      'EFECTIVO': '💵 Efectivo',
      'YAPE/PLIN': '📱 Yape/Plin',
      'TARJETA': '💳 Tarjeta',
    };
    return paymentMethod ? paymentMap[paymentMethod] : 'NO APLICA';
  };

  const getSourceText = () => {
    return '🎒 FullDay';
  };

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const previewWidth = 384;
  const previewHeight = 450;

  let adjustedX = position.x + 10;
  let adjustedY = position.y;

  if (adjustedX + previewWidth > viewportWidth - 20) {
    adjustedX = position.x - previewWidth - 10;
  }

  if (adjustedY + previewHeight > viewportHeight - 20) {
    adjustedY = viewportHeight - previewHeight - 20;
  }

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
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Utensils size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {getDisplayNumber(order)}
            </h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock size={12} />
              <span>{getTimeElapsed(new Date(order.created_at))}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <CreditCard size={12} />
            <span className="font-semibold">{getPaymentText(order.payment_method)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {getSourceText()}
          </div>
        </div>
      </div>

      {/* Información del alumno */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User size={14} />
          <span className="font-medium">{order.student_name}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <GraduationCap size={14} />
          <span>{order.grade} - Sección {order.section}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users size={14} />
          <span>Apoderado: {order.guardian_name}</span>
        </div>

        {order.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone size={14} />
            <span>{order.phone}</span>
          </div>
        )}
      </div>

      {/* Items del pedido */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Productos del pedido:</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {item.quantity}x {item.name}
                </div>
                {item.notes && (
                  <div className="text-xs text-gray-500 italic">Nota: {item.notes}</div>
                )}
              </div>
              <div className="text-gray-900 font-semibold ml-2">
                S/ {(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total y notas */}
      <div className="border-t border-gray-100 pt-2">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-purple-600">S/ {order.total.toFixed(2)}</span>
        </div>
        {order.notes && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
            <span className="font-medium">Notas generales:</span> {order.notes}
          </div>
        )}
      </div>

      {/* Flecha indicadora */}
      {adjustedX < position.x && (
        <div 
          className="absolute w-4 h-4 bg-white border-r border-t border-gray-200 transform rotate-45 -right-2 top-1/2 -translate-y-1/2"
        />
      )}
      {adjustedX >= position.x && (
        <div 
          className="absolute w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45 -left-2 top-1/2 -translate-y-1/2"
        />
      )}
    </div>
  );
};
