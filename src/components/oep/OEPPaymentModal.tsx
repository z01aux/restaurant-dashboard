// ============================================================
// ARCHIVO: src/components/oep/OEPPaymentModal.tsx
// Modal para editar método de pago en OEP
// Equivalente exacto de: src/components/fullday/FullDayPaymentModal.tsx
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { OEPOrder, OEPPaymentMethod } from '../../types/oep';

interface OEPPaymentModalProps {
  isOpen:  boolean;
  onClose: () => void;
  order:   OEPOrder | null;
  onSave:  (orderId: string, paymentMethod: OEPPaymentMethod) => Promise<void>;
}

export const OEPPaymentModal: React.FC<OEPPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<OEPPaymentMethod | null>(
    order?.payment_method || null
  );
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (order) setSelectedMethod(order.payment_method);
  }, [order]);

  if (!isOpen || !order) return null;

  const paymentMethods: { value: OEPPaymentMethod; label: string; color: string; bg: string }[] = [
    { value: 'EFECTIVO',  label: '💵 Efectivo',   color: 'border-green-500 text-green-700',  bg: 'bg-green-50'  },
    { value: 'YAPE/PLIN', label: '📱 Yape/Plin',  color: 'border-purple-500 text-purple-700', bg: 'bg-purple-50' },
    { value: 'TARJETA',   label: '💳 Tarjeta',    color: 'border-blue-500 text-blue-700',    bg: 'bg-blue-50'   },
  ];

  const handleSave = async () => {
    if (!selectedMethod) return;
    setLoading(true);
    try { await onSave(order.id, selectedMethod); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Método de Pago</h2>
            <p className="text-sm text-gray-500 mt-1">Pedido #{order.order_number} — {order.student_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-6">
            {paymentMethods.map(method => (
              <button
                key={method.value}
                onClick={() => setSelectedMethod(method.value)}
                className={`w-full p-4 rounded-xl border-2 text-left font-semibold transition-all ${
                  selectedMethod === method.value
                    ? `${method.color} ${method.bg} border-current`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          <div className="flex space-x-3">
            <button onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!selectedMethod || loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-md disabled:opacity-50 font-semibold">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
