import React, { useState } from 'react';
import { X, Calendar, Download, Printer } from 'lucide-react';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExcel: (startDate: Date, endDate: Date) => void;
  onConfirmTicket: (startDate: Date, endDate: Date) => void;
}

/**
 * Convierte una fecha local (YYYY-MM-DD) a un objeto Date en hora local de Perú
 */
const createPeruDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Crear fecha en hora local de Perú (00:00:00)
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (hora local de Perú)
 */
const getTodayString = (): string => {
  const now = new Date();
  // Ajustar a hora local de Perú
  const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const year = peruDate.getFullYear();
  const month = String(peruDate.getMonth() + 1).padStart(2, '0');
  const day = String(peruDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirmExcel,
  onConfirmTicket
}) => {
  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [endDate, setEndDate] = useState<string>(getTodayString());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateDates = (): boolean => {
    const start = createPeruDate(startDate);
    const end = createPeruDate(endDate);

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
      console.log('📅 Enviando fechas (Perú):', { startDate, endDate });
      const start = createPeruDate(startDate);
      const end = createPeruDate(endDate);
      console.log('📅 Fechas convertidas:', {
        start: start.toString(),
        end: end.toString(),
        startISO: start.toISOString(),
        endISO: end.toISOString()
      });
      onConfirmExcel(start, end);
      onClose();
    }
  };

  const handleTicket = () => {
    if (validateDates()) {
      console.log('📅 Enviando fechas para ticket (Perú):', { startDate, endDate });
      const start = createPeruDate(startDate);
      const end = createPeruDate(endDate);
      onConfirmTicket(start, end);
      onClose();
    }
  };

  // Opciones rápidas (siempre en hora local de Perú)
  const setToday = () => {
    const today = getTodayString();
    setStartDate(today);
    setEndDate(today);
  };

  const setYesterday = () => {
    const today = new Date();
    const peruDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    peruDate.setDate(peruDate.getDate() - 1);
    
    const year = peruDate.getFullYear();
    const month = String(peruDate.getMonth() + 1).padStart(2, '0');
    const day = String(peruDate.getDate()).padStart(2, '0');
    const yesterdayStr = `${year}-${month}-${day}`;
    
    setStartDate(yesterdayStr);
    setEndDate(yesterdayStr);
  };

  const setThisWeek = () => {
    const today = new Date();
    const peruDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    
    // Obtener el lunes de esta semana
    const monday = new Date(peruDate);
    const dayOfWeek = peruDate.getDay(); // 0 = domingo, 1 = lunes, ...
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si es domingo, restar 6 para llegar al lunes anterior
    monday.setDate(peruDate.getDate() - diff);
    
    // Obtener el domingo de esta semana
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    setStartDate(formatDate(monday));
    setEndDate(formatDate(sunday));
  };

  const setThisMonth = () => {
    const today = new Date();
    const peruDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    
    const firstDay = new Date(peruDate.getFullYear(), peruDate.getMonth(), 1);
    const lastDay = new Date(peruDate.getFullYear(), peruDate.getMonth() + 1, 0);
    
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));
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
              Información:
            </h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Las fechas se interpretan en hora de Perú (UTC-5)</li>
              <li>Hoy es: {new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</li>
              <li>Si seleccionas "Hoy", se buscarán órdenes desde las 00:00 hasta las 23:59</li>
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
