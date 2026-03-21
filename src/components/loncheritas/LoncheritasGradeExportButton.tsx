// ============================================
// ARCHIVO: src/components/loncheritas/LoncheritasGradeExportButton.tsx
// Botones "Excel por Grado" y "CSV por Grado" para Loncheritas
// ============================================

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Loader } from 'lucide-react';
import { LoncheritasOrder } from '../../types/loncheritas';
import { exportLoncheritasGradeExcel, exportLoncheritasGradeCSV } from '../../utils/gradeExportUtils';

interface Props {
  orders: LoncheritasOrder[];
  selectedDate?: Date;
}

export const LoncheritasGradeExportButton: React.FC<Props> = ({ orders, selectedDate }) => {
  const [loadingXlsx, setLoadingXlsx] = useState(false);
  const [loadingCsv,  setLoadingCsv]  = useState(false);

  const handleExcel = async () => {
    if (loadingXlsx) return;
    setLoadingXlsx(true);
    try {
      await exportLoncheritasGradeExcel(orders, selectedDate);
    } catch (e) {
      console.error('Error exportando Loncheritas Excel por grado:', e);
      alert('Error al exportar. Revisa la consola.');
    } finally {
      setLoadingXlsx(false);
    }
  };

  const handleCsv = async () => {
    if (loadingCsv) return;
    setLoadingCsv(true);
    try {
      await exportLoncheritasGradeCSV(orders, selectedDate);
    } catch (e) {
      console.error('Error exportando Loncheritas CSV por grado:', e);
      alert('Error al exportar. Revisa la consola.');
    } finally {
      setLoadingCsv(false);
    }
  };

  const disabled = orders.length === 0;

  return (
    <>
      <button
        onClick={handleExcel}
        disabled={disabled || loadingXlsx}
        title="Excel ordenado por Grado y Sección con colores"
        className="bg-amber-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingXlsx ? <Loader size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
        <span>{loadingXlsx ? 'Generando...' : 'Excel por Grado'}</span>
      </button>

      <button
        onClick={handleCsv}
        disabled={disabled || loadingCsv}
        title="CSV ordenado por Grado y Sección"
        className="bg-amber-500 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingCsv ? <Loader size={15} className="animate-spin" /> : <Download size={15} />}
        <span>{loadingCsv ? 'Generando...' : 'CSV por Grado'}</span>
      </button>
    </>
  );
};

export default LoncheritasGradeExportButton;
