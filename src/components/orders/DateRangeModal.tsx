import React, { useState } from 'react';
import { X, Calendar, Download, Printer } from 'lucide-react';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExcel: (startDate: Date, endDate: Date) => void;
  onConfirmTicket: (startDate: Date, endDate: Date) => void;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirmExcel,
  onConfirmTicket
}) => {
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
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
    
    if (diffDays > 365) {
      setError('El rango máximo permitido es de 365 días');
      return false;
    }

    setError(null);
    return true;
  };

  const handleExcel = () => {
    if (validateDates()) {
      onConfirmExcel(new Date(startDate), new Date(endDate));
      onClose();
    }
  };

  const handleTicket = () => {
    if (validateDates()) {
      onConfirmTicket(new Date(startDate), new Date(endDate));
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
    firstDay.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Lunes
    
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
              <h2 className="text-lg font-bold">Seleccionar Rango de Fechas</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Información adicional */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
              <Download size={16} className="mr-2" />
              Formatos disponibles:
            </h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>📊 EXCEL: Si existen cierres para el rango, se usarán los DATOS GUARDADOS (trazabilidad garantizada)</li>
              <li>📊 EXCEL: Si no hay cierres, se calcula en vivo con las órdenes actuales</li>
              <li>🧾 TICKET: Resumen en formato ticket para impresión térmica (80mm)</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleTicket}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold"
            >
              <Printer size={18} />
              <span>Ticket</span>
            </button>
            <button
              type="button"
              onClick={handleExcel}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold"
            >
              <Download size={18} />
              <span>Excel</span>
            </button>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};