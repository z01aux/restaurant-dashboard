// ============================================
// ARCHIVO: src/components/ui/PreviewBottomSheet.tsx
// ACTUALIZADO: Muestra quién generó el pedido (móvil)
// ============================================

import React, { useEffect, useRef } from 'react';
import { X, Receipt, ExternalLink } from 'lucide-react';

export interface PreviewField {
  icon?: string;
  label?: string;
  value: string;
  className?: string;
}

export interface PreviewItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PreviewComprobante {
  tipo: 'BOLETA' | 'FACTURA' | string;
  serie: string;
  numero: number;
  aceptada_por_sunat: boolean;
  enlace_pdf?: string;
  anulado?: boolean;
}

interface PreviewBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  badge?: { label: string; color: string };
  total: number;
  totalColor?: string;
  minutesAgo: number;
  fields: PreviewField[];
  items: PreviewItem[];
  notes?: string | null;
  comprobante?: PreviewComprobante | null;
  // Quién generó el pedido
  createdByName?: string | null;
}

export const PreviewBottomSheet: React.FC<PreviewBottomSheetProps> = ({
  isOpen,
  onClose,
  orderNumber,
  badge,
  total,
  totalColor = 'text-red-600',
  minutesAgo,
  fields,
  items,
  notes,
  comprobante,
  createdByName,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Cerrar con swipe down
  useEffect(() => {
    if (!isOpen) return;
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0].clientY - startY;
      if (diff > 80) onClose();
    };
    const el = sheetRef.current;
    el?.addEventListener('touchstart', handleTouchStart, { passive: true });
    el?.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el?.removeEventListener('touchstart', handleTouchStart);
      el?.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const minutesText = minutesAgo < 1 ? 'Ahora mismo'
    : minutesAgo === 1 ? 'Hace 1 minuto'
    : `Hace ${minutesAgo} minutos`;

  const getTipoLabel = (tipo: string) => tipo === 'BOLETA' || tipo === '2' ? 'BOLETA' : 'FACTURA';
  const getTipoColor = (tipo: string) => tipo === 'BOLETA' || tipo === '2'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-red-100 text-red-800';
  const formatNumero = (serie: string, numero: number) =>
    `${serie}-${String(numero).padStart(8, '0')}`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col"
        style={{ animation: 'slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {/* Handle y header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div>
                <div className="font-bold text-gray-900 text-base leading-tight">{orderNumber}</div>
                <div className="text-xs text-gray-400 mt-0.5">{minutesText}</div>
              </div>
              {badge && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badge.color}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-100 mx-4" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-safe">

          {/* Info del cliente */}
          <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2">
            {fields.map((field, i) => (
              <div key={i} className="flex items-start space-x-2">
                {field.icon && <span className="text-sm flex-shrink-0 mt-0.5">{field.icon}</span>}
                <div className="min-w-0">
                  {field.label && <div className="text-xs text-gray-400 mb-0.5">{field.label}</div>}
                  <div className={`text-sm font-medium text-gray-800 break-words ${field.className || ''}`}>
                    {field.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Productos */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Productos ({items.length})
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-600">{item.quantity}</span>
                    </div>
                    <span className="text-sm text-gray-800 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0">
                    S/ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className={`flex justify-between items-center py-3 px-4 rounded-2xl bg-gray-50 border border-gray-100`}>
            <span className="font-semibold text-gray-700">Total</span>
            <span className={`text-2xl font-black ${totalColor}`}>S/ {total.toFixed(2)}</span>
          </div>

          {/* Notas */}
          {notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
              <div className="text-xs font-semibold text-amber-700 mb-1">📝 Nota</div>
              <div className="text-sm text-gray-700">{notes}</div>
            </div>
          )}

          {/* Registrado por */}
          {createdByName && (
            <div className="flex items-center space-x-2 text-xs text-gray-400 pt-1 border-t border-gray-100">
              <span>👤</span>
              <span>
                Registrado por{' '}
                <span className="font-semibold text-gray-600">{createdByName}</span>
              </span>
            </div>
          )}

          {/* Comprobante */}
          {comprobante && !comprobante.anulado && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Receipt size={15} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Comprobante Electrónico</span>
                </div>
                {comprobante.enlace_pdf && (
                  <a
                    href={comprobante.enlace_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                    <span>Ver PDF</span>
                  </a>
                )}
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getTipoColor(String(comprobante.tipo))}`}>
                  {getTipoLabel(String(comprobante.tipo))}
                </span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  {formatNumero(comprobante.serie, comprobante.numero)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  comprobante.aceptada_por_sunat
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {comprobante.aceptada_por_sunat ? '✓ SUNAT' : '⏳ Pendiente'}
                </span>
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
    </>
  );
};
