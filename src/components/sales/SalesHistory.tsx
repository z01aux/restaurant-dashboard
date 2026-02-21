// ============================================
// ARCHIVO: src/components/sales/SalesHistory.tsx
// ============================================

import React, { useState } from 'react';
import { Calendar, Download, Eye, ChevronDown, ChevronUp, DollarSign, ShoppingBag, CreditCard, X } from 'lucide-react';
import { useSalesClosure } from '../../hooks/useSalesClosure';
import { SalesClosure } from '../../types/sales';
import * as XLSX from 'xlsx';

export const SalesHistory: React.FC = () => {
  const { closures, loading, getClosureById } = useSalesClosure();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedClosure, setSelectedClosure] = useState<SalesClosure | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const viewDetails = async (id: string) => {
    const result = await getClosureById(id);
    if (result.success) {
      setSelectedClosure(result.data);
    }
  };

  const exportClosureToExcel = (closure: SalesClosure) => {
    const wb = XLSX.utils.book_new();

    const resumenData = [
      ['CIERRE DE CAJA', ''],
      ['Número', closure.closure_number],
      ['Fecha Apertura', new Date(closure.opened_at).toLocaleString('es-PE')],
      ['Fecha Cierre', new Date(closure.closed_at).toLocaleString('es-PE')],
      ['', ''],
      ['RESUMEN DE VENTAS', ''],
      ['Total Órdenes', closure.total_orders],
      ['Total Ventas', `S/ ${closure.total_amount.toFixed(2)}`],
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    XLSX.writeFile(wb, `cierre_${closure.closure_number}.xlsx`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="mr-2" size={20} />
        Historial de Cierres
      </h3>

      {closures.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-4xl text-gray-300 mb-3">📅</div>
          <p className="text-gray-600">No hay cierres registrados</p>
          <p className="text-gray-400 text-sm mt-1">
            Los cierres aparecerán aquí cuando realices tu primer cierre de caja
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {closures.map((closure) => (
            <div
              key={closure.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-red-300 transition-colors"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => toggleExpand(closure.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {closure.closure_number}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {new Date(closure.closed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <DollarSign size={14} className="mr-1" />
                      S/ {closure.total_amount.toFixed(2)}
                    </span>
                    <span className="flex items-center">
                      <ShoppingBag size={14} className="mr-1" />
                      {closure.total_orders} pedidos
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportClosureToExcel(closure);
                    }}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                    title="Exportar a Excel"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewDetails(closure.id);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <Eye size={18} />
                  </button>
                  {expandedId === closure.id ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === closure.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500">Apertura</div>
                      <div className="font-semibold">S/ {closure.initial_cash.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500">Cierre</div>
                      <div className="font-semibold">S/ {closure.final_cash.toFixed(2)}</div>
                    </div>
                  </div>

                  {closure.notes && (
                    <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                      <span className="font-semibold">Notas:</span> {closure.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedClosure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Detalles del Cierre: {selectedClosure.closure_number}
              </h3>
              <button
                onClick={() => setSelectedClosure(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(selectedClosure, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};