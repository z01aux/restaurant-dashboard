// ============================================
// ARCHIVO: src/components/orders/PaymentMethodModal.tsx
// ACTUALIZADO: Soporte para pago MIXTO
// ============================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, Minus, Shuffle } from 'lucide-react';
import { Order } from '../../types';
import { MixedPaymentPanel, MixedPaymentValues, isMixedPaymentValid, emptyMixedPayment } from '../shared/MixedPaymentPanel';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (
    orderId: string,
    paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO' | undefined,
    mixedDetail?: MixedPaymentValues
  ) => Promise<void>;
}

const paymentOptions = [
  { value: 'EFECTIVO',  label: 'Efectivo',  icon: DollarSign, bgColor: 'bg-green-50',  borderColor: 'border-green-500',  textColor: 'text-green-700',  iconBg: 'bg-green-100'  },
  { value: 'YAPE/PLIN', label: 'Yape/Plin', icon: Smartphone, bgColor: 'bg-purple-50', borderColor: 'border-purple-500', textColor: 'text-purple-700', iconBg: 'bg-purple-100' },
  { value: 'TARJETA',   label: 'Tarjeta',   icon: CreditCard, bgColor: 'bg-blue-50',   borderColor: 'border-blue-500',   textColor: 'text-blue-700',   iconBg: 'bg-blue-100'   },
  { value: 'MIXTO',     label: 'Mixto',     icon: Shuffle,    bgColor: 'bg-amber-50',  borderColor: 'border-amber-500',  textColor: 'text-amber-700',  iconBg: 'bg-amber-100'  },
  { value: 'none',      label: 'No Aplica', icon: Minus,      bgColor: 'bg-gray-50',   borderColor: 'border-gray-400',   textColor: 'text-gray-600',   iconBg: 'bg-gray-200'   },
];

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave,
}) => {
  // ✅ CORREGIDO: tipo incluye 'MIXTO'
  const [selectedMethod, setSelectedMethod] = useState<'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO' | undefined>(undefined);
  const [mixedValues, setMixedValues] = useState<MixedPaymentValues>(emptyMixedPayment());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedMethod(order.paymentMethod);
      setMixedValues({
        efectivo:  order.mixedPaymentDetail?.efectivo  ?? 0,
        yape_plin: order.mixedPaymentDetail?.yape_plin ?? 0,
        tarjeta:   order.mixedPaymentDetail?.tarjeta   ?? 0,
      });
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const isMixtoValid = selectedMethod !== 'MIXTO' || isMixedPaymentValid(mixedValues, order.total);

  const handleSave = async () => {
    if (selectedMethod === order.paymentMethod && selectedMethod !== 'MIXTO') {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave(
        order.id,
        selectedMethod,
        selectedMethod === 'MIXTO' ? mixedValues : undefined
      );
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectMethod = (value: string) => {
    if (value === 'none') {
      setSelectedMethod(undefined);
    } else {
      setSelectedMethod(value as 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO');
      if (value !== 'MIXTO') setMixedValues(emptyMixedPayment());
    }
  };

  const isSelected = (value: string) =>
    value === 'none' ? selectedMethod === undefined : selectedMethod === value;

  const getOptionClasses = (opt: typeof paymentOptions[0]) => {
    const sel = isSelected(opt.value);
    return `
      p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2
      ${sel
        ? `${opt.bgColor} ${opt.borderColor} shadow-lg scale-105`
        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
      }
      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all duration-300 scale-100 opacity-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-amber-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CreditCard size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Cambiar Método de Pago</h2>
                <p className="text-xs text-red-100 mt-0.5">
                  Orden #{order.orderNumber || order.id.slice(-8)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Info orden */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="font-semibold text-gray-900">{order.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className="text-xl font-bold text-red-600">S/ {order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Método actual */}
          <div className="mb-5">
            <span className="text-sm font-medium text-gray-700 block mb-2">Método actual:</span>
            <div className="p-3 bg-gray-100 rounded-lg flex items-center space-x-3 border border-gray-200">
              {order.paymentMethod === 'EFECTIVO' && (
                <>
                  <div className="bg-green-100 p-2 rounded-full"><DollarSign size={18} className="text-green-600" /></div>
                  <span className="font-semibold text-green-700">EFECTIVO</span>
                </>
              )}
              {order.paymentMethod === 'YAPE/PLIN' && (
                <>
                  <div className="bg-purple-100 p-2 rounded-full"><Smartphone size={18} className="text-purple-600" /></div>
                  <span className="font-semibold text-purple-700">YAPE/PLIN</span>
                </>
              )}
              {order.paymentMethod === 'TARJETA' && (
                <>
                  <div className="bg-blue-100 p-2 rounded-full"><CreditCard size={18} className="text-blue-600" /></div>
                  <span className="font-semibold text-blue-700">TARJETA</span>
                </>
              )}
              {order.paymentMethod === 'MIXTO' && (
                <>
                  <div className="bg-amber-100 p-2 rounded-full"><Shuffle size={18} className="text-amber-600" /></div>
                  <span className="font-semibold text-amber-700">MIXTO</span>
                </>
              )}
              {!order.paymentMethod && (
                <>
                  <div className="bg-gray-200 p-2 rounded-full"><Minus size={18} className="text-gray-600" /></div>
                  <span className="font-semibold text-gray-600">NO APLICA</span>
                </>
              )}
            </div>
          </div>

          {/* Selección nuevo método */}
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
                    onClick={() => handleSelectMethod(opt.value)}
                    disabled={saving}
                    className={getOptionClasses(opt)}
                  >
                    <div className={`p-2 rounded-full ${sel ? opt.iconBg : 'bg-gray-100'}`}>
                      <Icon size={24} className={sel ? opt.textColor : 'text-gray-600'} />
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
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isMixtoValid}
              className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Actualizar Pago</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
