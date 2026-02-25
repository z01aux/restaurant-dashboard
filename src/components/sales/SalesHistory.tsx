// ============================================
// ARCHIVO: src/components/sales/SalesHistory.tsx
// ============================================

import React, { useState } from 'react';
import { Calendar, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useSalesClosure } from '../../hooks/useSalesClosure';
import { SalesClosure } from '../../types/sales';
import * as XLSX from 'xlsx';

export const SalesHistory: React.FC = () => {
  const { closures, loading, getClosureById } = useSalesClosure();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedClosure, setSelectedClosure] = useState<SalesClosure | null>(null);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const viewDetails = async (id: string) => {
    const result = await getClosureById(id);
    if (result.success) {
      setSelectedClosure(result.data);
    }
  };

  const exportClosure = (closure: SalesClosure) => {
    const wb = XLSX.utils.book_new();
    
    const data = [
      ['CIERRE DE CAJA', closure.closure_number],
      ['Fecha', new Date(closure.closed_at).toLocaleString('es-PE')],
      ['Total', `S/ ${closure.total_amount.toFixed(2)}`],
      ['Órdenes', closure.total_orders]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Cierre');
    XLSX.writeFile(wb, `cierre_${closure.closure_number}.xlsx`);
  };

  // Filtrar cierres
  const filteredClosures = React.useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    
    return closures.filter(c => {
      const date = new Date(c.closed_at);
      if (filter === 'week') return date >= weekAgo;
      if (filter === 'month') return date >= monthAgo;
      return true;
    });
  }, [closures, filter]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header compacto */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Historial de Cierres</h3>
        </div>
        
        {/* Filtros rápidos */}
        <div className="flex space-x-1 text-xs">
          <button
            onClick={() => setFilter('week')}
            className={`px-2 py-1 rounded ${filter === 'week' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Semana
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-2 py-1 rounded ${filter === 'month' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Mes
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* Lista compacta */}
      <div className="divide-y divide-gray-100">
        {filteredClosures.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No hay cierres registrados
          </div>
        ) : (
          filteredClosures.map((closure) => (
            <div key={closure.id} className="text-sm">
              {/* Fila principal */}
              <div 
                className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleExpand(closure.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs text-gray-500">
                    {new Date(closure.closed_at).toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-gray-900">
                    S/ {closure.total_amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {closure.total_orders} ped
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportClosure(closure);
                    }}
                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Exportar"
                  >
                    <Download size={14} />
                  </button>
                  {expandedId === closure.id ? 
                    <ChevronUp size={16} className="text-gray-400" /> : 
                    <ChevronDown size={16} className="text-gray-400" />
                  }
                </div>
              </div>

              {/* Detalles expandidos */}
              {expandedId === closure.id && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500">Apertura:</span>
                      <span className="ml-2 font-medium">S/ {closure.initial_cash.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cierre:</span>
                      <span className="ml-2 font-medium">S/ {closure.final_cash.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">N° Cierre:</span>
                      <span className="ml-2 font-mono">{closure.closure_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cerrado por:</span>
                      <span className="ml-2">{(closure as any).closed_by?.name || 'Sistema'}</span>
                    </div>
                  </div>
                  
                  {closure.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
                      📝 {closure.notes}
                    </div>
                  )}
                  
                  <button
                    onClick={() => viewDetails(closure.id)}
                    className="mt-2 w-full text-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    Ver detalles completos
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal simple para detalles completos */}
      {selectedClosure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center">
              <h3 className="font-semibold">Detalles: {selectedClosure.closure_number}</h3>
              <button onClick={() => setSelectedClosure(null)} className="text-gray-500">✕</button>
            </div>
            <div className="p-4">
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(selectedClosure, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
