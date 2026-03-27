// ============================================
// ARCHIVO: src/components/loncheritas/LoncheritasGradeExportButton.tsx
// Botón "Excel Alumnos" con dropdown:
//   - 📊 Por Grado/Sección
//   - 📋 Por Alumno (A-Z)
// Archivos separados con nombres diferenciados
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, ChevronDown, Loader } from 'lucide-react';
import { LoncheritasOrder } from '../../types/loncheritas';
import { exportLoncheritasGradeExcel, exportLoncheritasAlfabeticoExcel } from '../../utils/gradeExportUtils';

interface Props {
  orders: LoncheritasOrder[];
  selectedDate?: Date;
}

export const LoncheritasGradeExportButton: React.FC<Props> = ({ orders, selectedDate }) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportPorGrado = async () => {
    if (loading) return;
    if (orders.length === 0) {
      alert('No hay pedidos para exportar.');
      return;
    }
    setLoading(true);
    setIsOpen(false);
    try {
      await exportLoncheritasGradeExcel(orders, selectedDate);
    } catch (e) {
      console.error('Error exportando Loncheritas Excel por Grado:', e);
      alert('Error al exportar. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAlfabetico = async () => {
    if (loading) return;
    if (orders.length === 0) {
      alert('No hay pedidos para exportar.');
      return;
    }
    setLoading(true);
    setIsOpen(false);
    try {
      await exportLoncheritasAlfabeticoExcel(orders, selectedDate);
    } catch (e) {
      console.error('Error exportando Loncheritas Excel Alfabético:', e);
      alert('Error al exportar. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  const disabled = orders.length === 0;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="bg-amber-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
        <span>{loading ? 'Generando...' : 'Excel Alumnos'}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <button
            onClick={handleExportPorGrado}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors border-b border-gray-100"
          >
            <span className="text-lg">📊</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Por Grado/Sección</div>
              <div className="text-xs text-gray-400">ordenado por grado y sección</div>
            </div>
          </button>
          <button
            onClick={handleExportAlfabetico}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors"
          >
            <span className="text-lg">📋</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Por Alumno (A-Z)</div>
              <div className="text-xs text-gray-400">orden alfabético por nombre</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default LoncheritasGradeExportButton;