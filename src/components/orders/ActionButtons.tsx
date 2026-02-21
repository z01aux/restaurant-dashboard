// ============================================
// ARCHIVO: src/components/orders/ActionButtons.tsx
// ============================================

import React from 'react';
import { Download, FileSpreadsheet, FileText, Plus } from 'lucide-react';

interface ActionButtonsProps {
  onExportTodayCSV: () => void;
  onExportAllCSV: () => void;
  onExportTodayExcel: () => void;
  onExportAllExcel: () => void;
  onExportSummary: () => void;
  onNewOrder: () => void;
}

export const ActionButtons = React.memo(({
  onExportTodayCSV,
  onExportAllCSV,
  onExportTodayExcel,
  onExportAllExcel,
  onExportSummary,
  onNewOrder
}: ActionButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Botones CSV */}
      <button 
        onClick={onExportTodayCSV} 
        className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-green-600 transition-colors"
      >
        <Download size={16} /><span>CSV Hoy</span>
      </button>
      
      <button 
        onClick={onExportAllCSV} 
        className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-blue-600 transition-colors"
      >
        <Download size={16} /><span>CSV Todo</span>
      </button>

      {/* Botones Excel */}
      <button 
        onClick={onExportTodayExcel} 
        className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-emerald-700 transition-colors"
      >
        <FileSpreadsheet size={16} /><span>Excel Hoy</span>
      </button>

      <button 
        onClick={onExportAllExcel} 
        className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-emerald-800 transition-colors"
      >
        <FileSpreadsheet size={16} /><span>Excel Todo</span>
      </button>

      <button 
        onClick={onExportSummary} 
        className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-purple-700 transition-colors"
      >
        <FileText size={16} /><span>Resumen</span>
      </button>

      <button 
        onClick={onNewOrder} 
        className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:from-red-600 hover:to-amber-600 transition-colors"
      >
        <Plus size={16} /><span>Nueva Orden</span>
      </button>
    </div>
  );
});