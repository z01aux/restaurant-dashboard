import React, { useState } from 'react';
import { Calendar, Download, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FullDaySalesHistoryProps {
  closures: any[];
}

export const FullDaySalesHistory: React.FC<FullDaySalesHistoryProps> = ({ closures }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const exportClosure = (closure: any) => {
    const wb = XLSX.utils.book_new();
    
    const data = [
      ['CIERRE FULLDAY', closure.closure_number],
      ['Fecha', new Date(closure.closed_at).toLocaleString('es-PE')],
      ['Total', `S/ ${closure.total_amount?.toFixed(2) || '0.00'}`],
      ['Pedidos', closure.total_orders || 0]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Cierre');
    XLSX.writeFile(wb, `cierre_${closure.closure_number}.xlsx`);
  };

  if (closures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay cierres registrados
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700 flex items-center">
          <Calendar size={18} className="mr-2" />
          Historial de Cierres FullDay
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {closures.map((closure) => (
          <div key={closure.id} className="text-sm">
            <div 
              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => setExpandedId(expandedId === closure.id ? null : closure.id)}
            >
              <div className="flex items-center space-x-4">
                <span className="font-mono text-xs text-gray-500">
                  {new Date(closure.closed_at).toLocaleDateString()}
                </span>
                <span className="font-semibold text-purple-600">
                  S/ {closure.total_amount?.toFixed(2) || '0.00'}
                </span>
                <span className="text-xs text-gray-500">
                  {closure.total_orders || 0} pedidos
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportClosure(closure);
                  }}
                  className="p-1 text-gray-400 hover:text-green-600"
                  title="Exportar"
                >
                  <Download size={16} />
                </button>
                {expandedId === closure.id ? 
                  <ChevronUp size={16} className="text-gray-400" /> : 
                  <ChevronDown size={16} className="text-gray-400" />
                }
              </div>
            </div>

            {expandedId === closure.id && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Apertura:</span>
                    <span className="ml-2 font-medium">S/ {closure.initial_cash?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cierre:</span>
                    <span className="ml-2 font-medium">S/ {closure.final_cash?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                {closure.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
                    📝 {closure.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};