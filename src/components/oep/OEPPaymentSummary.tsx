// ============================================================
// ARCHIVO: src/components/oep/OEPPaymentSummary.tsx
// Resumen de pagos para OEP
// Equivalente exacto de: src/components/fullday/FullDayPaymentSummary.tsx
// ============================================================

import React, { useMemo } from 'react';
import { OEPOrder } from '../../types/oep';

interface OEPPaymentSummaryProps {
  orders: OEPOrder[];
}

export const OEPPaymentSummary: React.FC<OEPPaymentSummaryProps> = ({ orders }) => {
  const summary = useMemo(() => {
    const total    = orders.reduce((s, o) => s + o.total, 0);
    const efectivo = orders.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
    const yape     = orders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
    const tarjeta  = orders.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
    const noAplica = orders.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);
    return { total, efectivo, yape, tarjeta, noAplica };
  }, [orders]);

  if (orders.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">💰 Resumen del día</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',      value: summary.total,    color: 'text-gray-900',   bg: 'bg-gray-50'   },
          { label: 'Efectivo',   value: summary.efectivo, color: 'text-green-700',  bg: 'bg-green-50'  },
          { label: 'Yape/Plin',  value: summary.yape,     color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Tarjeta',    value: summary.tarjeta,  color: 'text-blue-700',   bg: 'bg-blue-50'   },
          { label: 'No Aplica',  value: summary.noAplica, color: 'text-gray-600',   bg: 'bg-gray-50'   },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-lg p-3 text-center`}>
            <div className={`text-lg font-bold ${color}`}>S/ {value.toFixed(2)}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ============================================================
// ARCHIVO: src/components/sales_oep/OEPSalesHistory.tsx
// Historial de cierres para OEP
// Equivalente exacto de: src/components/sales_fullday/FullDaySalesHistory.tsx
// ============================================================

interface OEPSalesHistoryProps {
  closures: any[];
}

export const OEPSalesHistory: React.FC<OEPSalesHistoryProps> = ({ closures }) => {
  if (closures.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 text-center">
        <p className="text-gray-500 text-sm">No hay cierres de caja registrados para OEP</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Historial de Cierres OEP</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {closures.map((closure) => (
          <div key={closure.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
            <div>
              <span className="font-medium text-gray-900">{closure.closure_number}</span>
              <span className="text-gray-500 ml-2">
                {new Date(closure.closed_at).toLocaleDateString('es-PE')}
              </span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">S/ {closure.final_cash?.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-gray-500">{closure.total_orders || 0} pedidos</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
