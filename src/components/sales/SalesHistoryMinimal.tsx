// ============================================
// ARCHIVO: src/components/sales/SalesHistoryMinimal.tsx (CORREGIDO)
// Historial de cierres minimalista para FullDay y Órdenes
// ============================================

import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SalesHistoryMinimalProps {
  closures: any[];
  type: 'orders' | 'fullday';
  onExport?: (closure: any) => void;
}

export const SalesHistoryMinimal: React.FC<SalesHistoryMinimalProps> = ({ 
  closures, 
  type,
  onExport 
}) => {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Mostrar solo los últimos 5 si no está expandido
  const displayedClosures = showAll ? closures : closures.slice(0, 5);

  if (closures.length === 0) return null;

  // Calcular total del período
  const totalPeriodo = closures.reduce((sum, c) => sum + c.total_amount, 0);

  const handleExport = (closure: any) => {
    if (onExport) {
      onExport(closure);
      return;
    }

    // Exportación por defecto
    const wb = XLSX.utils.book_new();
    const data = [
      [`${type === 'fullday' ? 'FULLDAY' : 'CAJA'} - ${closure.closure_number}`],
      ['Fecha', new Date(closure.closed_at).toLocaleString('es-PE')],
      ['Total', `S/ ${closure.total_amount.toFixed(2)}`],
      ['Pedidos', closure.total_orders],
      ['Efectivo', `S/ ${closure.total_efectivo.toFixed(2)}`],
      ['Yape/Plin', `S/ ${closure.total_yape_plin.toFixed(2)}`],
      ['Tarjeta', `S/ ${closure.total_tarjeta.toFixed(2)}`]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    XLSX.writeFile(wb, `${closure.closure_number}.xlsx`);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar size={14} className="text-gray-500" />
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {type === 'fullday' ? 'CIERRES FULLDAY' : 'CIERRES DE CAJA'}
          </h3>
        </div>
        <div className="text-xs text-gray-600">
          <span className="font-medium">{closures.length}</span> cierres · 
          <span className="ml-1 font-medium text-green-600">S/ {totalPeriodo.toFixed(2)}</span>
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-100">
        {displayedClosures.map((closure) => (
          <div key={closure.id} className="text-xs">
            {/* Fila principal */}
            <div 
              className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleExpand(closure.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-gray-500 w-16">
                  {new Date(closure.closed_at).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </span>
                <span className="font-semibold text-gray-900">
                  S/ {closure.total_amount.toFixed(2)}
                </span>
                <span className="text-gray-500">
                  {closure.total_orders} ped
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(closure);
                  }}
                  className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Exportar"
                >
                  <Download size={12} />
                </button>
                {expandedId === closure.id ? 
                  <ChevronUp size={14} className="text-gray-400" /> : 
                  <ChevronDown size={14} className="text-gray-400" />
                }
              </div>
            </div>

            {/* Detalles expandidos */}
            {expandedId === closure.id && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px]">
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span className="text-gray-500">N°:</span>
                    <span className="ml-1 font-mono">{closure.closure_number?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Apertura:</span>
                    <span className="ml-1">S/ {closure.initial_cash?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cierre:</span>
                    <span className="ml-1">S/ {closure.final_cash?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Hora:</span>
                    <span className="ml-1">
                      {new Date(closure.closed_at).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Mini resumen de pagos */}
                <div className="mt-2 pt-1 border-t border-gray-200 flex justify-between text-[9px]">
                  <span>💵 {closure.total_efectivo?.toFixed(2) || '0.00'}</span>
                  <span>📱 {closure.total_yape_plin?.toFixed(2) || '0.00'}</span>
                  <span>💳 {closure.total_tarjeta?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón ver más/menos */}
      {closures.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-[10px] text-center text-purple-600 hover:text-purple-800 bg-gray-50 border-t border-gray-200 font-medium"
        >
          {showAll ? '▲ VER MENOS' : `▼ VER ${closures.length - 5} CIERRES MÁS`}
        </button>
      )}
    </div>
  );
};