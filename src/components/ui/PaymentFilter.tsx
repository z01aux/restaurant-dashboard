// ARCHIVO: src/components/ui/PaymentFilter.tsx
// ✅ CORREGIDO: El botón "Todos" muestra el total real de todos los pedidos
//    (incluyendo la distribución de pagos MIXTOS en cada método)

import React from 'react';

interface PaymentFilterProps {
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
  totalEfectivo?: number;
  totalYape?: number;
  totalTarjeta?: number;
  // ✅ NUEVO: total real de todos los pedidos del día
  // Si no se pasa, se calcula como efectivo + yape + tarjeta (comportamiento anterior)
  totalGeneral?: number;
  showAmounts?: boolean;
}

export const PaymentFilter: React.FC<PaymentFilterProps> = ({
  paymentFilter,
  setPaymentFilter,
  totalEfectivo = 0,
  totalYape     = 0,
  totalTarjeta  = 0,
  totalGeneral,
  showAmounts   = true,
}) => {
  // Si se pasa totalGeneral úsalo; si no, suma los tres métodos (retrocompatible)
  const totalTodos = totalGeneral !== undefined
    ? totalGeneral
    : totalEfectivo + totalYape + totalTarjeta;

  const paymentOptions = [
    {
      value:  '',
      label:  'Todos',
      icon:   '📋',
      color:  'gray',
      amount: totalTodos,
    },
    {
      value:  'EFECTIVO',
      label:  'Efectivo',
      icon:   '💵',
      color:  'green',
      amount: totalEfectivo,
    },
    {
      value:  'YAPE/PLIN',
      label:  'Yape/Plin',
      icon:   '📱',
      color:  'purple',
      amount: totalYape,
    },
    {
      value:  'TARJETA',
      label:  'Tarjeta',
      icon:   '💳',
      color:  'blue',
      amount: totalTarjeta,
    },
  ];

  const formatAmount = (amount: number): string => `S/ ${amount.toFixed(2)}`;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
          <span className="mr-2">💰</span> Filtrar por método de pago:
        </h3>
        {paymentFilter && (
          <button
            onClick={() => setPaymentFilter('')}
            className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
          >
            <span>✕</span> Limpiar filtro
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {paymentOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setPaymentFilter(option.value)}
            className={`
              p-3 rounded-lg text-sm font-medium transition-all
              flex flex-col items-center justify-center border-2
              ${paymentFilter === option.value
                ? option.value === ''
                  ? 'border-gray-500 bg-gray-100 text-gray-800'
                  : `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-800`
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center space-x-1 mb-1">
              <span className="text-base">{option.icon}</span>
              <span className="font-semibold">{option.label}</span>
            </div>
            <div className={`
              text-xs font-bold
              ${paymentFilter === option.value
                ? option.value === ''
                  ? 'text-gray-700'
                  : `text-${option.color}-700`
                : 'text-gray-500'
              }
            `}>
              {showAmounts ? formatAmount(option.amount) : option.amount}
            </div>
            {option.value === '' && (
              <div className="text-[10px] text-gray-400 mt-0.5">
                total general
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" />
          <span>Efectivo</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1" />
          <span>Yape/Plin</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1" />
          <span>Tarjeta</span>
        </div>
      </div>
    </div>
  );
};
