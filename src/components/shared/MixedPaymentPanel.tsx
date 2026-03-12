// ============================================
// ARCHIVO: src/components/shared/MixedPaymentPanel.tsx
// Panel reutilizable de desglose para pago MIXTO
// ============================================

import React from 'react';
import { DollarSign, Smartphone, CreditCard } from 'lucide-react';

export interface MixedPaymentValues {
  efectivo: number;
  yape_plin: number;
  tarjeta: number;
}

interface MixedPaymentPanelProps {
  total: number;
  values: MixedPaymentValues;
  onChange: (values: MixedPaymentValues) => void;
  disabled?: boolean;
}

export const MixedPaymentPanel: React.FC<MixedPaymentPanelProps> = ({
  total,
  values,
  onChange,
  disabled = false,
}) => {
  const sum = Math.round((values.efectivo + values.yape_plin + values.tarjeta) * 100) / 100;
  const diff = Math.round((sum - total) * 100) / 100;
  const isShort = diff < 0;
  const isExact = diff === 0;

  const handleChange = (field: keyof MixedPaymentValues, raw: string) => {
    const val = parseFloat(raw);
    onChange({ ...values, [field]: isNaN(val) || val < 0 ? 0 : val });
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3 space-y-3">

      {/* Efectivo */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="bg-green-100 p-1.5 rounded-full">
            <DollarSign size={13} className="text-green-700" />
          </div>
          <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            Efectivo
          </span>
        </div>
        <div className="flex items-center gap-2 border-2 border-gray-200 focus-within:border-amber-400 rounded-xl px-3 py-2 bg-white transition-colors">
          <span className="text-sm font-semibold text-gray-400">S/</span>
          <input
            type="number"
            min="0"
            step="0.50"
            value={values.efectivo || ''}
            onChange={e => handleChange('efectivo', e.target.value)}
            disabled={disabled}
            placeholder="0.00"
            className="flex-1 outline-none text-base font-bold text-gray-900 bg-transparent disabled:opacity-50"
          />
        </div>
      </div>

      {/* Yape / Plin */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="bg-purple-100 p-1.5 rounded-full">
            <Smartphone size={13} className="text-purple-700" />
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
            Yape / Plin
          </span>
        </div>
        <div className="flex items-center gap-2 border-2 border-gray-200 focus-within:border-amber-400 rounded-xl px-3 py-2 bg-white transition-colors">
          <span className="text-sm font-semibold text-gray-400">S/</span>
          <input
            type="number"
            min="0"
            step="0.50"
            value={values.yape_plin || ''}
            onChange={e => handleChange('yape_plin', e.target.value)}
            disabled={disabled}
            placeholder="0.00"
            className="flex-1 outline-none text-base font-bold text-gray-900 bg-transparent disabled:opacity-50"
          />
        </div>
      </div>

      {/* Tarjeta */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="bg-blue-100 p-1.5 rounded-full">
            <CreditCard size={13} className="text-blue-700" />
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
            Tarjeta
          </span>
        </div>
        <div className="flex items-center gap-2 border-2 border-gray-200 focus-within:border-amber-400 rounded-xl px-3 py-2 bg-white transition-colors">
          <span className="text-sm font-semibold text-gray-400">S/</span>
          <input
            type="number"
            min="0"
            step="0.50"
            value={values.tarjeta || ''}
            onChange={e => handleChange('tarjeta', e.target.value)}
            disabled={disabled}
            placeholder="0.00"
            className="flex-1 outline-none text-base font-bold text-gray-900 bg-transparent disabled:opacity-50"
          />
        </div>
      </div>

      {/* Resumen */}
      <div className="border-t border-amber-200 pt-3 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Total ingresado:</span>
          <span className={`text-sm font-bold ${isShort ? 'text-red-600' : 'text-green-700'}`}>
            S/ {sum.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{isShort ? 'Falta:' : 'Vuelto:'}</span>
          <span className={`text-xs font-semibold ${isShort ? 'text-red-600' : isExact ? 'text-gray-500' : 'text-green-600'}`}>
            S/ {Math.abs(diff).toFixed(2)}
          </span>
        </div>

        {isShort && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-1">
            <p className="text-xs text-red-600">
              El monto ingresado es menor al total del pedido.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper para validar si el pago mixto cubre el total
export const isMixedPaymentValid = (values: MixedPaymentValues, total: number): boolean => {
  const sum = Math.round((values.efectivo + values.yape_plin + values.tarjeta) * 100) / 100;
  return sum >= total;
};

// Helper para estado inicial vacío
export const emptyMixedPayment = (): MixedPaymentValues => ({
  efectivo: 0,
  yape_plin: 0,
  tarjeta: 0,
});
