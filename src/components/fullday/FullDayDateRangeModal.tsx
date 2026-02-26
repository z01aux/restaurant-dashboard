// ============================================
// ARCHIVO: src/components/fullday/FullDayDateRangeModal.tsx
// Modal para seleccionar rango de fechas en FullDay
// ============================================

import React, { useState } from 'react';
import { X, Calendar, Download } from 'lucide-react';

interface FullDayDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
}

export const FullDayDateRangeModal: React.FC<FullDayDateRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateDates = (): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('La fecha de inicio no puede ser mayor que la fecha de fin');
      return false;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 31) {
      setError('El rango máximo permitido es de 31 días');
      return false;
    }

    setError(null);
    return true;
  };

  const handleConfirm = () => {
    if (validateDates()) {
      onConfirm(new Date(startDate), new Date(endDate));
      onClose();
    }
  };

  // Opciones rápidas
  const setToday = () => {
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setStartDate(yesterday.toISOString().split('T')[0]);
    setEndDate(yesterday.toISOString().split('T')[0]);
  };

  const setThisWeek = () => {
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  const setThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar size={20} />
              <h2 className="text-lg font-bold">Reporte por Rango de Fechas</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          
          {/* Opciones rápidas */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opciones rápidas:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={setToday}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                📅 Hoy
              </button>
              <button
                onClick={setYesterday}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                📅 Ayer
              </button>
              <button
                onClick={setThisWeek}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                📅 Esta Semana
              </button>
              <button
                onClick={setThisMonth}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                📅 Este Mes
              </button>
            </div>
          </div>

          {/* Selectores de fecha */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de fin:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Información */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 El reporte incluirá:</h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Resumen general del período</li>
              <li>Desglose diario de ventas</li>
              <li>Detalle de pedidos por alumno (organizado por grado)</li>
              <li>Top productos más vendidos</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all font-semibold flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>Generar Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};