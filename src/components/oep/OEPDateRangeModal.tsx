// ============================================================
// ARCHIVO: src/components/oep/OEPDateRangeModal.tsx
// Modal para selección de rango de fechas en OEP
// Equivalente exacto de: src/components/fullday/FullDayDateRangeModal.tsx
// ============================================================

import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

interface OEPDateRangeModalProps {
  isOpen:          boolean;
  onClose:         () => void;
  onConfirm:       (startDate: Date, endDate: Date) => void;
  title?:          string;
  confirmLabel?:   string;
}

export const OEPDateRangeModal: React.FC<OEPDateRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title        = 'Reporte por Rango de Fechas',
  confirmLabel = 'Generar Excel',
}) => {
  const today    = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState(today);
  const [error,     setError]     = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    setError('');
    if (!startDate || !endDate) { setError('Selecciona ambas fechas'); return; }
    if (startDate > endDate)    { setError('La fecha inicial debe ser anterior a la final'); return; }
    onConfirm(
      new Date(startDate + 'T00:00:00'),
      new Date(endDate   + 'T23:59:59')
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 El reporte incluirá:</h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Resumen general del período</li>
              <li>Desglose diario de ventas</li>
              <li>Detalle de pedidos por alumno (organizado por grado)</li>
              <li>Top productos más vendidos</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicial</label>
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Final</label>
            <input
              type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-md font-semibold flex items-center justify-center space-x-2">
              <Download size={16} />
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
