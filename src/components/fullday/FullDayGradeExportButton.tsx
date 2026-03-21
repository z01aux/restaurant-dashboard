// ============================================
// ARCHIVO: src/components/fullday/FullDayGradeExportButton.tsx
// Botones "Excel por Grado" y "CSV por Grado" para FullDay
// ============================================

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Loader } from 'lucide-react';
import { FullDayOrder } from '../../types/fullday';
import { exportFullDayGradeExcel, exportFullDayGradeCSV } from '../../utils/gradeExportUtils';

interface Props {
  orders: FullDayOrder[];
  selectedDate?: Date;
}

export const FullDayGradeExportButton: React.FC<Props> = ({ orders, selectedDate }) => {
  const [loadingXlsx, setLoadingXlsx] = useState(false);
  const [loadingCsv,  setLoadingCsv]  = useState(false);

  const handleExcel = async () => {
    if (loadingXlsx) return;
    setLoadingXlsx(true);
    try {
      await exportFullDayGradeExcel(orders, selectedDate);
    } catch (e) {
      console.error('Error exportando FullDay Excel por grado:', e);
      alert('Error al exportar. Revisa la consola.');
    } finally {
      setLoadingXlsx(false);
    }
  };

  const handleCsv = async () => {
    if (loadingCsv) return;
    setLoadingCsv(true);
    try {
      await exportFullDayGradeCSV(orders, selectedDate);
    } catch (e) {
      console.error('Error exportando FullDay CSV por grado:', e);
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
        title="Excel ordenado por Grado y Sección"
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

export default FullDayGradeExportButton;
