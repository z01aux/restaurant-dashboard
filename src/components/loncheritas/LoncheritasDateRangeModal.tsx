// ============================================
// ARCHIVO: src/components/loncheritas/LoncheritasDateRangeModal.tsx
// ACTUALIZADO: Agrega botón "PDF Ejecutivo"
// ============================================

import React, { useState } from 'react';
import { X, Calendar, Download, Printer, FileText } from 'lucide-react';

interface LoncheritasDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExcel:  (startDate: Date, endDate: Date) => void;
  onConfirmTicket: (startDate: Date, endDate: Date) => void;
  onConfirmPDF?:   (startDate: Date, endDate: Date) => void;
}

const createPeruDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const getTodayString = (): string => {
  const now = new Date();
  const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const year  = peruDate.getFullYear();
  const month = String(peruDate.getMonth() + 1).padStart(2, '0');
  const day   = String(peruDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const LoncheritasDateRangeModal: React.FC<LoncheritasDateRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirmExcel,
  onConfirmTicket,
  onConfirmPDF,
}) => {
  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [endDate,   setEndDate]   = useState<string>(getTodayString());
  const [error,     setError]     = useState<string | null>(null);

  if (!isOpen) return null;

  const validateDates = (): boolean => {
    const start = createPeruDate(startDate);
    const end   = createPeruDate(endDate);
    if (start > end) { setError('La fecha de inicio no puede ser mayor que la fecha de fin'); return false; }
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) { setError('El rango máximo permitido es de 365 días'); return false; }
    setError(null);
    return true;
  };

  const handleExcel  = () => { if (validateDates()) { onConfirmExcel(createPeruDate(startDate), createPeruDate(endDate));  onClose(); } };
  const handleTicket = () => { if (validateDates()) { onConfirmTicket(createPeruDate(startDate), createPeruDate(endDate)); onClose(); } };
  const handlePDF    = () => { if (validateDates() && onConfirmPDF) { onConfirmPDF(createPeruDate(startDate), createPeruDate(endDate)); onClose(); } };

  const setToday = () => { const t = getTodayString(); setStartDate(t); setEndDate(t); };

  const setYesterday = () => {
    const peruDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    peruDate.setDate(peruDate.getDate() - 1);
    const s = `${peruDate.getFullYear()}-${String(peruDate.getMonth() + 1).padStart(2, '0')}-${String(peruDate.getDate()).padStart(2, '0')}`;
    setStartDate(s); setEndDate(s);
  };

  const setThisWeek = () => {
    const peruDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const monday = new Date(peruDate);
    monday.setDate(peruDate.getDate() - (peruDate.getDay() === 0 ? 6 : peruDate.getDay() - 1));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(monday)); setEndDate(fmt(sunday));
  };

  const setThisMonth = () => {
    const peruDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const first = new Date(peruDate.getFullYear(), peruDate.getMonth(), 1);
    const last  = new Date(peruDate.getFullYear(), peruDate.getMonth() + 1, 0);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(first)); setEndDate(fmt(last));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar size={20} />
              <h2 className="text-lg font-bold">Reporte Loncheritas</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6">
          {/* Opciones rápidas */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Opciones rápidas:</label>
            <div className="grid grid-cols-2 gap-2">
              {([['📅 Hoy', setToday], ['📅 Ayer', setYesterday], ['📅 Esta Semana', setThisWeek], ['📅 Este Mes', setThisMonth]] as [string, () => void][]).map(([label, fn]) => (
                <button key={label} onClick={fn} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">{label}</button>
              ))}
            </div>
          </div>

          {/* Selectores */}
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio:</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setError(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin:</label>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setError(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Info */}
          <div className="mb-5 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <ul className="text-xs text-amber-800 space-y-0.5 list-disc list-inside">
              <li>Fechas en hora de Perú (UTC-5)</li>
              <li>Hoy: {new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={handleTicket}
                className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center justify-center space-x-2 font-semibold text-sm">
                <Printer size={17} /><span>Ticket</span>
              </button>
              <button type="button" onClick={handleExcel}
                className="px-4 py-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all flex items-center justify-center space-x-2 font-semibold text-sm">
                <Download size={17} /><span>Excel</span>
              </button>
            </div>

            {onConfirmPDF && (
              <button type="button" onClick={handlePDF}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center space-x-2 font-semibold text-sm shadow-sm">
                <FileText size={17} /><span>PDF Ejecutivo</span>
              </button>
            )}

            <button type="button" onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
