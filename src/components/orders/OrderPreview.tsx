// ============================================
// ARCHIVO: src/components/orders/OrderPreview.tsx
// ACTUALIZADO: Muestra quién generó el pedido
// ============================================

import React from 'react';
import { Order } from '../../types';
import { Clock, User, Phone, MapPin, Utensils, CreditCard, Receipt, ExternalLink } from 'lucide-react';
import type { ComprobanteEmitido } from '../../types/nubefact';

interface OrderPreviewProps {
  order: Order;
  isVisible: boolean;
  position?: { x: number; y: number };
  shouldIgnoreEvents?: boolean;
  onClose?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  comprobante?: ComprobanteEmitido | null;
}

export const OrderPreview: React.FC<OrderPreviewProps> = ({
  order,
  isVisible,
  onMouseEnter,
  onMouseLeave,
  comprobante,
}) => {
  if (!isVisible) return null;

  const getDisplayNumber = (o: Order) => {
    if (o.source.type === 'phone') return o.kitchenNumber || `COM-${o.id.slice(-8).toUpperCase()}`;
    return o.orderNumber || `ORD-${o.id.slice(-8).toUpperCase()}`;
  };

  const getTimeElapsed = (createdAt: Date) => {
    const diffMins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins === 1) return 'Hace 1 minuto';
    return `Hace ${diffMins} minutos`;
  };

  const getPaymentDisplay = (o: Order): string => {
    if (!o.paymentMethod) return 'NO APLICA';
    if (o.paymentMethod === 'MIXTO' && o.splitPayment) {
      const p: string[] = [];
      if (o.splitPayment.efectivo > 0) p.push(`EF S/${o.splitPayment.efectivo.toFixed(2)}`);
      if (o.splitPayment.yapePlin > 0) p.push(`YP S/${o.splitPayment.yapePlin.toFixed(2)}`);
      if (o.splitPayment.tarjeta > 0)  p.push(`TJ S/${o.splitPayment.tarjeta.toFixed(2)}`);
      return p.join(' + ');
    }
    const map: Record<string, string> = { 'EFECTIVO': 'EFECTIVO', 'YAPE/PLIN': 'YAPE/PLIN', 'TARJETA': 'TARJETA' };
    return map[o.paymentMethod] || 'NO APLICA';
  };

  const getPaymentColor = (o: Order): string => {
    if (!o.paymentMethod) return 'bg-gray-100 text-gray-700';
    if (o.paymentMethod === 'MIXTO') return 'bg-orange-100 text-orange-800';
    const c: Record<string, string> = {
      'EFECTIVO': 'bg-green-100 text-green-800',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800',
      'TARJETA': 'bg-blue-100 text-blue-800',
    };
    return c[o.paymentMethod] || 'bg-gray-100 text-gray-700';
  };

  const getSourceText = (t: Order['source']['type']) => {
    const m: Record<Order['source']['type'], string> = {
      'phone': '📞 Teléfono', 'walk-in': '👤 Presencial', 'delivery': '🚚 Delivery',
      'fullDay': '🎒 FullDay', 'oep': '📦 OEP', 'loncheritas': '🍱 Loncheritas',
    };
    return m[t] || t;
  };

  const getTipoComprobante = (tipo: number) => {
    if (tipo === 1) return { label: 'FACTURA', color: 'bg-red-100 text-red-800' };
    if (tipo === 2) return { label: 'BOLETA', color: 'bg-amber-100 text-amber-800' };
    return { label: 'NOTA', color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 max-h-[85vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150 ring-1 ring-gray-200 pointer-events-auto"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Utensils size={15} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">{getDisplayNumber(order)}</div>
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Clock size={11} />
                <span>{getTimeElapsed(order.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentColor(order)}`}>
              <CreditCard size={10} />
              <span>{getPaymentDisplay(order)}</span>
            </span>
            <div className="text-xs text-gray-400 mt-0.5">{getSourceText(order.source.type)}</div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">

          {/* Info cliente */}
          <div className="space-y-1.5 bg-gray-50 rounded-xl p-3">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User size={13} className="text-gray-400 flex-shrink-0" />
              <span className="font-medium">{order.customerName}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Phone size={13} className="text-gray-400 flex-shrink-0" />
              <span>{order.phone}</span>
            </div>
            {order.tableNumber && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                <span>Mesa {order.tableNumber}</span>
              </div>
            )}
            {order.address && (
              <div className="flex items-start space-x-2 text-sm text-gray-500">
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="break-words">{order.address}</span>
              </div>
            )}
            {order.source.type === 'fullDay' && order.studentInfo && (
              <div className="text-xs text-purple-700 pt-1 border-t border-gray-200">
                🎒 {order.studentInfo.grade} "{order.studentInfo.section}" — {order.studentInfo.guardianName}
              </div>
            )}
          </div>

          {/* Productos */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Productos ({order.items.length})
            </div>
            <div className="space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-700">{item.quantity}×</span>
                    <span className="text-gray-600 ml-1">{item.menuItem.name}</span>
                    {item.notes && <div className="text-xs text-gray-400 italic">↳ {item.notes}</div>}
                  </div>
                  <span className="font-semibold text-gray-800 ml-2 flex-shrink-0">
                    S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-600 text-sm">Total</span>
            <span className="text-xl font-black text-red-600">S/ {order.total.toFixed(2)}</span>
          </div>

          {/* Notas */}
          {order.notes && (
            <div className="text-xs text-gray-600 bg-amber-50 rounded-lg p-2.5 border border-amber-100">
              <span className="font-semibold">Nota: </span>{order.notes}
            </div>
          )}

          {/* Registrado por */}
          {order.createdByName && (
            <div className="flex items-center space-x-2 text-xs text-gray-400 pt-1 border-t border-gray-100">
              <User size={11} className="flex-shrink-0" />
              <span>
                Registrado por{' '}
                <span className="font-semibold text-gray-600">{order.createdByName}</span>
              </span>
            </div>
          )}

          {/* Comprobante */}
          {comprobante && !comprobante.anulado && (
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Receipt size={13} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-800">Comprobante electrónico</span>
                </div>
                {comprobante.enlace_pdf && (
                  <a
                    href={comprobante.enlace_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                    <span>Ver PDF</span>
                  </a>
                )}
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getTipoComprobante(comprobante.tipo_comprobante).color}`}>
                  {getTipoComprobante(comprobante.tipo_comprobante).label}
                </span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  {comprobante.serie}-{String(comprobante.numero).padStart(8, '0')}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  comprobante.aceptada_por_sunat ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {comprobante.aceptada_por_sunat ? '✓ SUNAT' : '⏳ Pendiente'}
                </span>
              </div>
              {comprobante.cliente_nombre && comprobante.cliente_nombre !== 'CLIENTES VARIOS' && (
                <div className="text-xs text-gray-500 mt-1">
                  {comprobante.cliente_nombre}
                  {comprobante.cliente_documento !== '-' && ` (${comprobante.cliente_documento})`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
