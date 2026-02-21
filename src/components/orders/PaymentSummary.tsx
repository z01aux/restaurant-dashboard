// ============================================
// ARCHIVO: src/components/orders/PaymentSummary.tsx
// ============================================

import React from 'react';

interface PaymentSummaryProps {
  paymentSummary: {
    EFECTIVO: { count: number; total: number };
    'YAPE/PLIN': { count: number; total: number };
    TARJETA: { count: number; total: number };
    undefined: { count: number; total: number };
  };
  todayTotal: number;
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
}

export const PaymentSummary = React.memo(({
  paymentSummary,
  todayTotal,
  paymentFilter,
  setPaymentFilter
}: PaymentSummaryProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">💰</span> Resumen de Pagos - Hoy
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Efectivo */}
        <div 
          className={`text-center p-4 rounded-lg cursor-pointer transition-all border-2 ${
            paymentFilter === 'EFECTIVO' 
              ? 'border-green-500 bg-green-50 shadow-md' 
              : 'border-gray-200 bg-gray-50 hover:border-green-300'
          }`}
          onClick={() => setPaymentFilter(paymentFilter === 'EFECTIVO' ? '' : 'EFECTIVO')}
        >
          <div className="text-3xl font-bold text-green-600">
            {paymentSummary.EFECTIVO.count}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-1">Efectivo</div>
          <div className="text-xs font-semibold text-green-600 mt-1">
            S/ {paymentSummary.EFECTIVO.total.toFixed(2)}
          </div>
        </div>

        {/* Yape/Plin */}
        <div 
          className={`text-center p-4 rounded-lg cursor-pointer transition-all border-2 ${
            paymentFilter === 'YAPE/PLIN' 
              ? 'border-purple-500 bg-purple-50 shadow-md' 
              : 'border-gray-200 bg-gray-50 hover:border-purple-300'
          }`}
          onClick={() => setPaymentFilter(paymentFilter === 'YAPE/PLIN' ? '' : 'YAPE/PLIN')}
        >
          <div className="text-3xl font-bold text-purple-600">
            {paymentSummary['YAPE/PLIN'].count}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-1">Yape/Plin</div>
          <div className="text-xs font-semibold text-purple-600 mt-1">
            S/ {paymentSummary['YAPE/PLIN'].total.toFixed(2)}
          </div>
        </div>

        {/* Tarjeta */}
        <div 
          className={`text-center p-4 rounded-lg cursor-pointer transition-all border-2 ${
            paymentFilter === 'TARJETA' 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-200 bg-gray-50 hover:border-blue-300'
          }`}
          onClick={() => setPaymentFilter(paymentFilter === 'TARJETA' ? '' : 'TARJETA')}
        >
          <div className="text-3xl font-bold text-blue-600">
            {paymentSummary.TARJETA.count}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-1">Tarjeta</div>
          <div className="text-xs font-semibold text-blue-600 mt-1">
            S/ {paymentSummary.TARJETA.total.toFixed(2)}
          </div>
        </div>

        {/* No Aplica */}
        <div 
          className={`text-center p-4 rounded-lg cursor-pointer transition-all border-2 ${
            paymentFilter === '' 
              ? 'border-gray-500 bg-gray-100 shadow-md' 
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
          onClick={() => setPaymentFilter('')}
        >
          <div className="text-3xl font-bold text-gray-600">
            {paymentSummary.undefined.count}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-1">No Aplica</div>
          <div className="text-xs font-semibold text-gray-600 mt-1">
            S/ {paymentSummary.undefined.total.toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Total general */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="font-semibold text-gray-700">Total del día:</span>
        <span className="text-xl font-bold text-red-600">
          S/ {todayTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
});