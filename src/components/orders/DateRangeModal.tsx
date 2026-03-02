import React, { useState, useCallback, useMemo } from 'react';
import { X, Calendar, Download, Printer, AlertCircle } from 'lucide-react';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExcel: (startDate: Date, endDate: Date) => Promise<void>;
  onConfirmTicket: (startDate: Date, endDate: Date) => void;
}

/**
 * Convierte una fecha local (YYYY-MM-DD) a un objeto Date en hora local de Perú
 */
const createPeruDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (hora local de Perú)
 */
const getTodayString = (): string => {
  const now = new Date();
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
  const [loading, setLoading] = useState<'excel' | 'ticket' | null>(null);

  // Memoizar las fechas convertidas para no recalcular en cada render
  const convertedDates = useMemo(() => {
    if (!startDate || !endDate) return null;
    try {
      const start = createPeruDate(startDate);
      const end = createPeruDate(endDate);
      return { start, end };
    } catch {
      return null;
    }
  }, [startDate, endDate]);

  const validateDates = useCallback((): boolean => {
    if (!convertedDates) {
      setError('Fechas inválidas');
      return false;
    }

    const { start, end } = convertedDates;

    if (start > end) {
      setError('La fecha de inicio no puede ser mayor que la fecha de fin');
      return false;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) { // Reducido de 365 a 90 días para mejor rendimiento
      setError('El rango máximo permitido es de 90 días por rendimiento');
      return false;
    }

    setError(null);
    return true;
  }, [convertedDates]);

  const handleExcel = useCallback(async () => {
    if (!validateDates() || !convertedDates || loading) return;
    
    setLoading('excel');
    try {
      await onConfirmExcel(convertedDates.start, convertedDates.end);
      onClose();
    } catch (error) {
      setError('Error al generar el reporte de Excel');
      console.error(error);
    } finally {
      setLoading(null);
    }
  }, [convertedDates, validateDates, onConfirmExcel, onClose, loading]);

  const handleTicket = useCallback(() => {
    if (!validateDates() || !convertedDates || loading) return;
    
    setLoading('ticket');
    try {
      // Usar requestAnimationFrame para no bloquear la UI
      requestAnimationFrame(() => {
        onConfirmTicket(convertedDates.start, convertedDates.end);
        setLoading(null);
        onClose();
      });
    } catch (error) {
      setError('Error al generar el ticket');
      setLoading(null);
    }
  }, [convertedDates, validateDates, onConfirmTicket, onClose, loading]);

  // Opciones rápidas memoizadas
  const setToday = useCallback(() => {
    const today = getTodayString();
    setStartDate(today);
    setEndDate(today);
    setError(null);
  }, []);

  const setYesterday = useCallback(() => {
    const today = new Date();
    const peruDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    peruDate.setDate(peruDate.getDate() - 1);
    
    const year = peruDate.getFullYear();
    const month = String(peruDate.getMonth() + 1).padStart(2, '0');
    const day = String(peruDate.getDate()).padStart(2, '0');
    const yesterdayStr = `${year}-${month}-${day}`;
    
    setStartDate(yesterdayStr);
    setEndDate(yesterdayStr);
    setError(null);
  }, []);

  const setThisWeek = useCallback(() => {
    const today = new Date();
    const peruDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    
    const monday = new Date(peruDate);
    const dayOfWeek = peruDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(peruDate.getDate() - diff);
    
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
    setError(null);
  }, []);

  const setThisMonth = useCallback(() => {
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
    setError(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar size={20} />
              <h2 className="text-lg font-bold">Reporte por Fechas</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              disabled={!!loading}
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
                disabled={!!loading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📅 Hoy
              </button>
              <button
                onClick={setYesterday}
                disabled={!!loading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📅 Ayer
              </button>
              <button
                onClick={setThisWeek}
                disabled={!!loading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📅 Esta Semana
              </button>
              <button
                onClick={setThisMonth}
                disabled={!!loading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={!!loading}
                max={endDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
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
                disabled={!!loading}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Información adicional */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
              <Calendar size={16} className="mr-2" />
              Información:
            </h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Las fechas se interpretan en hora de Perú (UTC-5)</li>
              <li>Hoy es: {new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</li>
              <li>Rango máximo: 90 días por rendimiento</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleTicket}
              disabled={!!loading}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'ticket' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Printer size={18} />
                  <span>Ticket</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleExcel}
              disabled={!!loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'excel' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Excel</span>
                </>
              )}
            </button>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            disabled={!!loading}
            className="w-full mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};