// ============================================
// ARCHIVO: src/components/orders/PaymentSummarySimple.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { Order } from '../../types';

interface PaymentSummarySimpleProps {
  orders: Order[];
}

export const PaymentSummarySimple = React.memo(({ orders }: PaymentSummarySimpleProps) => {
  // Estado LOCAL para el resumen (no afecta al padre)
  const [summary, setSummary] = useState({
    EFECTIVO: { count: 0, total: 0 },
    'YAPE/PLIN': { count: 0, total: 0 },
    TARJETA: { count: 0, total: 0 },
    undefined: { count: 0, total: 0 }
  });
  const [todayTotal, setTodayTotal] = useState(0);

  // Calcular SOLO cuando cambian las órdenes (no en cada render)
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    const newSummary = {
      EFECTIVO: { count: 0, total: 0 },
      'YAPE/PLIN': { count: 0, total: 0 },
      TARJETA: { count: 0, total: 0 },
      undefined: { count: 0, total: 0 }
    };

    let total = 0;

    todayOrders.forEach(order => {
      const method = order.paymentMethod || 'undefined';
      newSummary[method as keyof typeof newSummary].count++;
      newSummary[method as keyof typeof newSummary].total += order.total;
      total += order.total;
    });

    setSummary(newSummary);
    setTodayTotal(total);
  }, [orders]); // Solo se recalcula cuando cambian las órdenes

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">💰</span> Resumen de Pagos - Hoy
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Efectivo */}
        <div className="text-center p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
          <div className="text-3xl font-bold text-green-600">
            {summary.EFECTIVO.count}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-1">Efectivo</div>
          <div className="text-xs font-semibold text-green-600 mt-1">
            S/ {summary.EFECTIVO.total.toFixed(2)}
          </div>
        </div>

        {/* Yape/Plin */}
        <div className="text-center p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
          <div className="text-3xl font-bold text-purple-600">
            {summary['YAPE/PLIN'].count}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-1">Yape/Plin</div>
          <div className="text-xs font-semibold text-purple-600 mt-1">
            S/ {summary['YAPE/PLIN'].total.toFixed(2)}
          </div>
        </div>

        {/* Tarjeta */}
        <div className="text-center p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
          <div className="text-3xl font-bold text-blue-600">
            {summary.TARJETA.count}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-1">Tarjeta</div>
          <div className="text-xs font-semibold text-blue-600 mt-1">
            S/ {summary.TARJETA.total.toFixed(2)}
          </div>
        </div>

        {/* No Aplica */}
        <div className="text-center p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
          <div className="text-3xl font-bold text-gray-600">
            {summary.undefined.count}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-1">No Aplica</div>
          <div className="text-xs font-semibold text-gray-600 mt-1">
            S/ {summary.undefined.total.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="font-semibold text-gray-700">Total del día:</span>
        <span className="text-xl font-bold text-red-600">
          S/ {todayTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
});