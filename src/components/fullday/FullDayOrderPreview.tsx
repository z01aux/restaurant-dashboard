// ARCHIVO: src/components/fullday/FullDayOrderPreview.tsx
// ✅ CORREGIDO: Soporte táctil en móvil (tap para abrir, tap fuera para cerrar)

import React from 'react';
import { FullDayOrder } from '../../types/fullday';
import { Clock, User, Phone, GraduationCap, Users, Utensils, CreditCard, X } from 'lucide-react';

interface FullDayOrderPreviewProps {
  order: FullDayOrder;
  isVisible: boolean;
  position: { x: number; y: number };
  shouldIgnoreEvents?: boolean;
  // ✅ NUEVO: callback para cerrar desde fuera (usado en móvil con tap)
  onClose?: () => void;
}

export const FullDayOrderPreview: React.FC<FullDayOrderPreviewProps> = ({
  order,
  isVisible,
  position,
  shouldIgnoreEvents = false,
  onClose,
}) => {
  if (!isVisible) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const getDisplayNumber = (order: FullDayOrder) =>
    order.order_number || `FD-${order.id.slice(-8).toUpperCase()}`;

  const getTimeElapsed = (createdAt: Date) => {
    const diffMins = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 60000);
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins === 1) return 'Hace 1 minuto';
    return `Hace ${diffMins} minutos`;
  };

  const getPaymentDisplay = (order: FullDayOrder): string => {
    if (!order.payment_method) return 'NO APLICA';
    if (order.payment_method === 'MIXTO' && order.split_payment) {
      const partes: string[] = [];
      if (order.split_payment.efectivo > 0) partes.push(`EFEC S/ ${order.split_payment.efectivo.toFixed(2)}`);
      if (order.split_payment.yapePlin > 0) partes.push(`YAPE S/ ${order.split_payment.yapePlin.toFixed(2)}`);
      if (order.split_payment.tarjeta > 0) partes.push(`TARJ S/ ${order.split_payment.tarjeta.toFixed(2)}`);
      return partes.join(' + ');
    }
    const map: Record<string, string> = {
      'EFECTIVO': '💵 Efectivo',
      'YAPE/PLIN': '📱 Yape/Plin',
      'TARJETA': '💳 Tarjeta',
      'MIXTO': '🔄 Pago Mixto',
    };
    return map[order.payment_method] || 'NO APLICA';
  };

  const getPaymentBadgeColor = (order: FullDayOrder): string => {
    if (!order.payment_method) return 'bg-gray-100 text-gray-800 border-gray-200';
    const colors: Record<string, string> = {
      'EFECTIVO': 'bg-green-100 text-green-800 border-green-200',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'TARJETA': 'bg-blue-100 text-blue-800 border-blue-200',
      'MIXTO': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[order.payment_method] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // ── POSICIONAMIENTO (solo desktop, en móvil es modal centrado) ──
  const viewportWidth  = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const previewWidth   = 384;
  const margin         = 20;

  let adjustedX = position.x + 10;
  let adjustedY = position.y;
  if (adjustedX + previewWidth > viewportWidth - margin) adjustedX = position.x - previewWidth - 10;
  if (adjustedY < margin) adjustedY = margin;
  const maxHeight = viewportHeight - adjustedY - margin;

  // ── CONTENIDO DEL PREVIEW (compartido entre móvil y desktop) ──
  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Utensils size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{getDisplayNumber(order)}</h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock size={12} />
              <span>{getTimeElapsed(new Date(order.created_at))}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentBadgeColor(order)}`}>
              <CreditCard size={11} className="mr-1" />
              <span>{getPaymentDisplay(order)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">🎒 FullDay</div>
          </div>
          {/* Botón cerrar — solo en móvil */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Info alumno */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User size={14} className="flex-shrink-0" />
          <span className="font-medium">{order.student_name}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <GraduationCap size={14} className="flex-shrink-0" />
          <span>{order.grade} - Sección {order.section}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users size={14} className="flex-shrink-0" />
          <span>Apoderado: {order.guardian_name}</span>
        </div>
        {order.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone size={14} className="flex-shrink-0" />
            <span>{order.phone}</span>
          </div>
        )}
      </div>

      {/* Detalle pago mixto */}
      {order.payment_method === 'MIXTO' && order.split_payment && (
        <div className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-orange-800 mb-2">🔄 Detalle Pago Mixto:</p>
          <div className="space-y-1">
            {order.split_payment.efectivo > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-green-700">💵 Efectivo</span>
                <span className="font-semibold text-green-700">S/ {order.split_payment.efectivo.toFixed(2)}</span>
              </div>
            )}
            {order.split_payment.yapePlin > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">📱 Yape/Plin</span>
                <span className="font-semibold text-purple-700">S/ {order.split_payment.yapePlin.toFixed(2)}</span>
              </div>
            )}
            {order.split_payment.tarjeta > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">💳 Tarjeta</span>
                <span className="font-semibold text-blue-700">S/ {order.split_payment.tarjeta.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Productos */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Productos del pedido:</h4>
        <div className="space-y-1">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.quantity}x {item.name}</div>
                {item.notes && <div className="text-xs text-gray-500 italic">Nota: {item.notes}</div>}
              </div>
              <div className="text-gray-900 font-semibold ml-2">S/ {(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-gray-100 pt-2">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-purple-600">S/ {order.total.toFixed(2)}</span>
        </div>
        {order.notes && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
            <span className="font-medium">Notas:</span> {order.notes}
          </div>
        )}
      </div>
    </>
  );

  // ── MÓVIL: modal bottom-sheet centrado con overlay oscuro ──
  if (isMobile) {
    return (
      <>
        {/* Overlay para cerrar al tocar fuera */}
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
        {/* Panel deslizante desde abajo */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4">
          {/* Indicador de arrastre */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          {content}
        </div>
      </>
    );
  }

  // ── DESKTOP: tooltip flotante posicionado junto al cursor ──
  return (
    <div
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-96 p-4 animate-in fade-in-0 zoom-in-95 ${
        shouldIgnoreEvents ? 'pointer-events-none' : ''
      }`}
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        maxHeight: `${maxHeight}px`,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {content}
      {/* Flechita decorativa */}
      {adjustedX < position.x ? (
        <div className="absolute w-4 h-4 bg-white border-r border-t border-gray-200 transform rotate-45 -right-2 top-6" />
      ) : (
        <div className="absolute w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45 -left-2 top-6" />
      )}
    </div>
  );
};
