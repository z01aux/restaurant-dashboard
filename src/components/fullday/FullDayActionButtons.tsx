// ============================================
// ARCHIVO: src/components/fullday/FullDayActionButtons.tsx
// Botones de acción para FullDay
// ============================================

import React from 'react';
import { Download, FileSpreadsheet, Printer, Plus } from 'lucide-react';

interface FullDayActionButtonsProps {
  onExportTodayCSV: () => void;
  onExportAllCSV: () => void;
  onExportTodayExcel: () => void;
  onExportAllExcel: () => void;
  onExportSummary: () => void;
  onNewOrder: () => void;
  onPrintKitchenTicket?: () => void;
}

export const FullDayActionButtons = React.memo(({
  onExportTodayCSV,
  onExportAllCSV,
  onExportTodayExcel,
  onExportAllExcel,
  onExportSummary,
  onNewOrder,
  onPrintKitchenTicket
}: FullDayActionButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
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
        <Printer size={16} /><span>Resumen</span>
      </button>

      {onPrintKitchenTicket && (
        <button 
          onClick={onPrintKitchenTicket} 
          className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-orange-600 transition-colors"
        >
          <Printer size={16} /><span>Ticket Cocina</span>
        </button>
      )}

      <button 
        onClick={onNewOrder} 
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:from-purple-600 hover:to-indigo-600 transition-colors"
      >
        <Plus size={16} /><span>Nuevo Pedido</span>
      </button>
    </div>
  );
});