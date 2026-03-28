// ARCHIVO: src/components/ui/PaymentFilter.tsx
// ✅ OPCIÓN 3 - Layout tipo dashboard con cards resaltadas
// Diseño moderno con cards independientes, porcentajes y mini barras de progreso

import React from 'react';

interface PaymentFilterProps {
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
  totalEfectivo?: number;
  totalYape?: number;
  totalTarjeta?: number;
  totalGeneral?: number;
  showAmounts?: boolean;
}

export const PaymentFilter: React.FC<PaymentFilterProps> = ({
  paymentFilter,
  setPaymentFilter,
  totalEfectivo = 0,
  totalYape = 0,
  totalTarjeta = 0,
  totalGeneral,
  showAmounts = true,
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
      amount: totalTodos,
      color:  'gray',
      barColor: 'linear-gradient(90deg, #ef4444, #f97316)',
    },
    {
      value:  'EFECTIVO',
      label:  'Efectivo',
      icon:   '💵',
      amount: totalEfectivo,
      color:  'green',
      barColor: '#10b981',
    },
    {
      value:  'YAPE/PLIN',
      label:  'Yape/Plin',
      icon:   '📱',
      amount: totalYape,
      color:  'purple',
      barColor: '#8b5cf6',
    },
    {
      value:  'TARJETA',
      label:  'Tarjeta',
      icon:   '💳',
      amount: totalTarjeta,
      color:  'blue',
      barColor: '#3b82f6',
    },
  ];

  const formatAmount = (amount: number): string => `S/ ${amount.toFixed(2)}`;

  // Calcular porcentaje para cada opción
  const getPercentage = (amount: number): number => {
    if (totalTodos === 0) return 0;
    return (amount / totalTodos) * 100;
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      {/* Header con total */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-base">💰</span> Filtro por pago
        </h3>
        <div className="flex items-center gap-2">
          {paymentFilter && (
            <button
              onClick={() => setPaymentFilter('')}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <span>✕</span> Limpiar
            </button>
          )}
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Total: {formatAmount(totalTodos)}
          </span>
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {paymentOptions.map((option) => {
          const isActive = paymentFilter === option.value;
          const porcentaje = getPercentage(option.amount);
          
          return (
            <button
              key={option.value}
              onClick={() => setPaymentFilter(option.value)}
              className={`
                rounded-xl p-3 transition-all duration-200 text-left
                ${isActive 
                  ? 'ring-2 ring-red-400 shadow-md' 
                  : 'hover:shadow-md hover:border-gray-300'
                }
                ${option.value === '' ? 'border-2 border-gray-200' : 'border border-gray-200'}
              `}
            >
              {/* Icono y porcentaje */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{option.icon}</span>
                <span className={`text-xs font-bold ${isActive ? 'text-red-500' : 'text-gray-400'}`}>
                  {porcentaje.toFixed(0)}%
                </span>
              </div>
              
              {/* Label */}
              <div className="text-sm font-semibold text-gray-800">{option.label}</div>
              
              {/* Monto */}
              {showAmounts && (
                <div className={`text-xs font-medium mt-1 ${isActive ? 'text-red-600' : 'text-gray-500'}`}>
                  {formatAmount(option.amount)}
                </div>
              )}
              
              {/* Mini barra de progreso */}
              {option.amount > 0 && (
                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${porcentaje}%`,
                      background: option.barColor
                    }}
                  />
                </div>
              )}
              
              {/* Indicador visual de selección */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-[10px] text-white">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda de colores */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Efectivo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Yape/Plin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Tarjeta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-amber-500" />
          <span>Todos</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentFilter;