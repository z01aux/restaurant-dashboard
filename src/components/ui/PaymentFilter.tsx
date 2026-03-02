// ============================================
// ARCHIVO: src/components/ui/PaymentFilter.tsx
// Componente reutilizable para filtrar por método de pago
// ============================================

import React from 'react';

interface PaymentFilterProps {
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
  totalEfectivo?: number;
  totalYape?: number;
  totalTarjeta?: number;
  showCounts?: boolean;
}

export const PaymentFilter: React.FC<PaymentFilterProps> = ({
  paymentFilter,
  setPaymentFilter,
  totalEfectivo = 0,
  totalYape = 0,
  totalTarjeta = 0,
  showCounts = false
}) => {
  const paymentOptions = [
    { 
      value: '', 
      label: 'Todos', 
      icon: '📋', 
      color: 'gray',
      count: totalEfectivo + totalYape + totalTarjeta 
    },
    { 
      value: 'EFECTIVO', 
      label: 'Efectivo', 
      icon: '💵', 
      color: 'green',
      count: totalEfectivo 
    },
    { 
      value: 'YAPE/PLIN', 
      label: 'Yape/Plin', 
      icon: '📱', 
      color: 'purple',
      count: totalYape 
    },
    { 
      value: 'TARJETA', 
      label: 'Tarjeta', 
      icon: '💳', 
      color: 'blue',
      count: totalTarjeta 
    },
  ];

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
          <span className="mr-2">💰</span> Filtrar por método de pago:
        </h3>
        {paymentFilter && (
          <button
            onClick={() => setPaymentFilter('')}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Limpiar filtro
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {paymentOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setPaymentFilter(option.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              flex items-center space-x-2 border-2
              ${paymentFilter === option.value
                ? option.value === ''
                  ? 'border-gray-500 bg-gray-100 text-gray-800'
                  : `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-800`
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-base">{option.icon}</span>
            <span>{option.label}</span>
            {showCounts && option.count > 0 && (
              <span className={`
                ml-1 px-2 py-0.5 rounded-full text-xs
                ${paymentFilter === option.value
                  ? option.value === ''
                    ? 'bg-gray-200 text-gray-700'
                    : `bg-${option.color}-200 text-${option.color}-800`
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Leyenda informativa */}
      <div className="mt-2 text-xs text-gray-500 flex items-center">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
        <span className="mr-3">Efectivo</span>
        <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
        <span className="mr-3">Yape/Plin</span>
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
        <span>Tarjeta</span>
      </div>
    </div>
  );
};