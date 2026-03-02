// ============================================
// ARCHIVO: src/components/ui/PaymentFilter.tsx
// Componente reutilizable para filtrar por método de pago
// MUESTRA MONTOS TOTALES EN SOLES (S/)
// ============================================

import React from 'react';

interface PaymentFilterProps {
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
  totalEfectivo?: number;      // Monto total en soles
  totalYape?: number;          // Monto total en soles
  totalTarjeta?: number;       // Monto total en soles
  showAmounts?: boolean;        // Mostrar montos en lugar de contadores
}

export const PaymentFilter: React.FC<PaymentFilterProps> = ({
  paymentFilter,
  setPaymentFilter,
  totalEfectivo = 0,
  totalYape = 0,
  totalTarjeta = 0,
  showAmounts = true
}) => {
  const totalGeneral = totalEfectivo + totalYape + totalTarjeta;

  const paymentOptions = [
    { 
      value: '', 
      label: 'Todos', 
      icon: '📋', 
      color: 'gray',
      amount: totalGeneral
    },
    { 
      value: 'EFECTIVO', 
      label: 'Efectivo', 
      icon: '💵', 
      color: 'green',
      amount: totalEfectivo
    },
    { 
      value: 'YAPE/PLIN', 
      label: 'Yape/Plin', 
      icon: '📱', 
      color: 'purple',
      amount: totalYape
    },
    { 
      value: 'TARJETA', 
      label: 'Tarjeta', 
      icon: '💳', 
      color: 'blue',
      amount: totalTarjeta
    },
  ];

  // Formatear monto en soles
  const formatAmount = (amount: number): string => {
    return `S/ ${amount.toFixed(2)}`;
  };

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
            {option.amount > 0 && option.value === '' && (
              <div className="text-[10px] text-gray-400 mt-0.5">
                total general
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Leyenda de colores */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
          <span>Efectivo</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1"></span>
          <span>Yape/Plin</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
          <span>Tarjeta</span>
        </div>
      </div>
    </div>
  );
};