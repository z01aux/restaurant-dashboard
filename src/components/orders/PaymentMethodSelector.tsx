// ============================================
// ARCHIVO: src/components/orders/PaymentMethodSelector.tsx
// Selector de método de pago con soporte MIXTO
// Para usar en OrderReception (carrito)
// ============================================

import React from 'react';
import { DollarSign, Smartphone, CreditCard, Shuffle } from 'lucide-react';
import { MixedPaymentPanel, MixedPaymentValues, isMixedPaymentValid, emptyMixedPayment } from '../shared/MixedPaymentPanel';

export type PaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  total: number;
  mixedValues: MixedPaymentValues;
  onMixedChange: (values: MixedPaymentValues) => void;
  disabled?: boolean;
}

const METHODS = [
  {
    value: 'EFECTIVO' as PaymentMethod,
    label: 'EFECTIVO',
    Icon: DollarSign,
    base: 'bg-green-500 hover:bg-green-600',
    active: 'bg-green-700 ring-2 ring-green-300 ring-offset-2',
  },
  {
    value: 'YAPE/PLIN' as PaymentMethod,
    label: 'YAPE/PLIN',
    Icon: Smartphone,
    base: 'bg-purple-500 hover:bg-purple-600',
    active: 'bg-purple-700 ring-2 ring-purple-300 ring-offset-2',
  },
  {
    value: 'TARJETA' as PaymentMethod,
    label: 'TARJETA',
    Icon: CreditCard,
    base: 'bg-blue-500 hover:bg-blue-600',
    active: 'bg-blue-700 ring-2 ring-blue-300 ring-offset-2',
  },
  {
    value: 'MIXTO' as PaymentMethod,
    label: 'MIXTO',
    Icon: Shuffle,
    base: 'bg-amber-500 hover:bg-amber-600',
    active: 'bg-amber-600 ring-2 ring-amber-300 ring-offset-2',
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selected,
  onChange,
  total,
  mixedValues,
  onMixedChange,
  disabled = false,
}) => {
  const handleSelect = (method: PaymentMethod) => {
    onChange(method);
    // Al cambiar a mixto, resetear valores
    if (method === 'MIXTO') {
      onMixedChange(emptyMixedPayment());
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Método de Pago *
      </label>

      {/* Grid 2x2 de botones */}
      <div className="grid grid-cols-2 gap-2">
        {METHODS.map(({ value, label, Icon, base, active }) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(value)}
            className={`
              flex items-center justify-center gap-1.5
              px-2 py-3 rounded-lg text-xs font-bold text-white
              transition-all duration-150 disabled:opacity-50
              ${selected === value ? active : base}
            `}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Panel de desglose cuando es MIXTO */}
      {selected === 'MIXTO' && (
        <MixedPaymentPanel
          total={total}
          values={mixedValues}
          onChange={onMixedChange}
          disabled={disabled}
        />
      )}
    </div>
  );
};

// Re-exportar helpers útiles para OrderReception
export { isMixedPaymentValid, emptyMixedPayment };
export type { MixedPaymentValues };
