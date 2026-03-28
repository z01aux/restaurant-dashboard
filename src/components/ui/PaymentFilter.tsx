// ARCHIVO: src/components/ui/PaymentFilter.tsx
// ✅ VERSIÓN CORREGIDA - Porcentaje y texto cambian a blanco al seleccionar

import React from 'react';
import { CreditCard, Smartphone, Wallet, PieChart, X } from 'lucide-react';

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
  const totalTodos = totalGeneral !== undefined
    ? totalGeneral
    : totalEfectivo + totalYape + totalTarjeta;

  const paymentOptions = [
    {
      value: '',
      label: 'Todos',
      icon: PieChart,
      amount: totalTodos,
      gradient: 'from-red-500 to-amber-500',
      gradientLight: 'from-red-50 to-amber-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      barGradient: 'linear-gradient(90deg, #ef4444, #f97316)',
    },
    {
      value: 'EFECTIVO',
      label: 'Efectivo',
      icon: Wallet,
      amount: totalEfectivo,
      gradient: 'from-emerald-500 to-green-600',
      gradientLight: 'from-emerald-50 to-green-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      barGradient: 'linear-gradient(90deg, #10b981, #059669)',
    },
    {
      value: 'YAPE/PLIN',
      label: 'Yape / Plin',
      icon: Smartphone,
      amount: totalYape,
      gradient: 'from-violet-500 to-purple-600',
      gradientLight: 'from-violet-50 to-purple-50',
      borderColor: 'border-violet-200',
      textColor: 'text-violet-700',
      barGradient: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
    },
    {
      value: 'TARJETA',
      label: 'Tarjeta',
      icon: CreditCard,
      amount: totalTarjeta,
      gradient: 'from-blue-500 to-cyan-600',
      gradientLight: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      barGradient: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    },
  ];

  const formatAmount = (amount: number): string => `S/ ${amount.toFixed(2)}`;

  const getPercentage = (amount: number): number => {
    if (totalTodos === 0) return 0;
    return (amount / totalTodos) * 100;
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-amber-500 rounded-full" />
          Métodos de pago
        </h3>
        <div className="flex items-center gap-2">
          {paymentFilter && (
            <button
              onClick={() => setPaymentFilter('')}
              className="text-xs text-gray-400 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <X size={12} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {paymentOptions.map((option) => {
          const isActive = paymentFilter === option.value;
          const porcentaje = getPercentage(option.amount);
          const IconComponent = option.icon;
          
          return (
            <button
              key={option.value}
              onClick={() => setPaymentFilter(option.value)}
              className={`
                relative group rounded-xl p-3 transition-all duration-200 text-left
                ${isActive 
                  ? `bg-gradient-to-r ${option.gradient} text-white shadow-md` 
                  : `bg-white border ${option.borderColor} hover:shadow-sm`
                }
              `}
            >
              {/* Indicador de selección */}
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                {/* Icono */}
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                  ${isActive 
                    ? 'bg-white/20' 
                    : `bg-gray-100 ${option.textColor}`
                  }
                `}>
                  <IconComponent size={14} strokeWidth={1.5} />
                </div>
                {/* Label */}
                <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {option.label}
                </span>
              </div>
              
              {/* Monto */}
              {showAmounts && (
                <div className={`
                  text-base font-bold tracking-tight transition-colors
                  ${isActive ? 'text-white' : 'text-gray-900'}
                `}>
                  {formatAmount(option.amount)}
                </div>
              )}
              
              {/* Porcentaje - con color blanco cuando está activo */}
              {option.amount > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-medium ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {porcentaje.toFixed(0)}%
                    </span>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-white/60' : 'text-gray-500'}`}>
                      del total
                    </span>
                  </div>
                  
                  {/* Barra estática */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${porcentaje}%`,
                        background: option.barGradient
                      }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Resumen visual de distribución */}
      {totalTodos > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
            {paymentOptions.slice(1).map((option) => {
              const width = getPercentage(option.amount);
              if (width === 0) return null;
              return (
                <div
                  key={option.value}
                  className="h-full"
                  style={{ 
                    width: `${width}%`,
                    background: option.barGradient
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-center gap-3 mt-2">
            {paymentOptions.slice(1).map((option) => (
              <div key={option.value} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ background: option.barGradient }}
                />
                <span className="text-[9px] text-gray-400">
                  {option.label === 'YAPE/PLIN' ? 'Yape' : option.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFilter;