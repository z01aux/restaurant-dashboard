// ============================================
// ARCHIVO: src/components/fullday/FullDayPaymentModal.tsx
// ACTUALIZADO: Soporte para pago MIXTO
// ============================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, Minus, Shuffle } from 'lucide-react';
import { FullDayOrder, FullDayPaymentMethod } from '../../types/fullday';
import { MixedPaymentPanel, MixedPaymentValues, isMixedPaymentValid, emptyMixedPayment } from '../shared/MixedPaymentPanel';

interface FullDayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: FullDayOrder | null;
  onSave: (
    orderId: string,
    paymentMethod: FullDayPaymentMethod,
    mixedDetail?: MixedPaymentValues
  ) => Promise<void>;
  onPaymentUpdated?: (orderId: string, newMethod: FullDayPaymentMethod) => void;
}

const paymentOptions = [
  { value: 'EFECTIVO',  label: 'Efectivo', icon: DollarSign, bgColor: 'bg-green-50',  borderColor: 'border-green-500',  textColor: 'text-green-700',  iconBg: 'bg-green-100'  },
  { value: 'YAPE/PLIN', label: 'Yape/Plin', icon: Smartphone, bgColor: 'bg-purple-50', borderColor: 'border-purple-500', textColor: 'text-purple-700', iconBg: 'bg-purple-100' },
  { value: 'TARJETA',   label: 'Tarjeta',   icon: CreditCard, bgColor: 'bg-blue-50',   borderColor: 'border-blue-500',   textColor: 'text-blue-700',   iconBg: 'bg-blue-100'   },
  { value: 'MIXTO',     label: 'Mixto',     icon: Shuffle,    bgColor: 'bg-amber-50',  borderColor: 'border-amber-500',  textColor: 'text-amber-700',  iconBg: 'bg-amber-100'  },
  { value: 'none',      label: 'No Aplica', icon: Minus,      bgColor: 'bg-gray-50',   borderColor: 'border-gray-400',   textColor: 'text-gray-600',   iconBg: 'bg-gray-200'   },
];

export const FullDayPaymentModal: React.FC<FullDayPaymentModalProps> = ({
  isOpen, onClose, order, onSave, onPaymentUpdated,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<FullDayPaymentMethod>(null);
  const [mixedValues, setMixedValues] = useState<MixedPaymentValues>(emptyMixedPayment());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedMethod(order.payment_method);
      setMixedValues({
        efectivo:  order.mixed_efectivo  ?? 0,
        yape_plin: order.mixed_yape_plin ?? 0,
        tarjeta:   order.mixed_tarjeta   ?? 0,
      });
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const isMixtoValid = selectedMethod !== 'MIXTO' || isMixedPaymentValid(mixedValues, order.total);
  const hasChanged   = selectedMethod !== order.payment_method;

  const handleSave = async () => {
    if (!hasChanged && selectedMethod !== 'MIXTO') { onClose(); return; }
    setSaving(true);
    try {
      await onSave(
        order.id,
        selectedMethod,
        selectedMethod === 'MIXTO' ? mixedValues : undefined
      );
      onPaymentUpdated?.(order.id, selectedMethod);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (value: string) => {
    if (value === 'none') {
      setSelectedMethod(null);
    } else {
      setSelectedMethod(value as FullDayPaymentMethod);
      if (value !== 'MIXTO') setMixedValues(emptyMixedPayment());
    }
  };

  const isSelected = (value: string) =>
    value === 'none' ? selectedMethod === null : selectedMethod === value;

  const getOptionClasses = (opt: typeof paymentOptions[0]) => {
    const sel = isSelected(opt.value);
    return `p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2
      ${sel ? `${opt.bgColor} ${opt.borderColor} shadow-lg scale-105` : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'}
      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg"><CreditCard size={22} /></div>
              <div>
                <h2 className="text-lg font-bold">Cambiar Método de Pago</h2>
                <p className="text-xs text-purple-100 mt-0.5">Pedido #{order.order_number}</p>
              </div>
            </div>
            <button onClick={onClose} disabled={saving} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex justify-between mb-3">
              <span className="text-sm text-gray-600">Alumno:</span>
              <span className="font-semibold text-gray-900">{order.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className="text-xl font-bold text-purple-600">S/ {order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Método actual */}
          <div className="mb-5">
            <span className="text-sm font-medium text-gray-700 block mb-2">Método actual:</span>
            <div className="p-3 bg-gray-100 rounded-lg flex items-center space-x-3 border border-gray-200">
              <span className="font-semibold text-gray-700">{order.payment_method ?? 'NO APLICA'}</span>
            </div>
          </div>

          {/* Selección */}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700 block mb-3">Seleccionar nuevo método:</span>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map(opt => {
                const Icon = opt.icon;
                const sel  = isSelected(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    disabled={saving}
                    className={getOptionClasses(opt)}
                  >
                    <div className={`p-2 rounded-full ${sel ? opt.iconBg : 'bg-gray-100'}`}>
                      <Icon size={22} className={sel ? opt.textColor : 'text-gray-600'} />
                    </div>
                    <span className={`text-sm font-medium ${sel ? opt.textColor : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Panel MIXTO */}
            {selectedMethod === 'MIXTO' && (
              <MixedPaymentPanel
                total={order.total}
                values={mixedValues}
                onChange={setMixedValues}
                disabled={saving}
              />
            )}
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isMixtoValid}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
            >
              {saving ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /><span>Guardando...</span></>
              ) : (
                <><CreditCard size={18} /><span>Actualizar Pago</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
