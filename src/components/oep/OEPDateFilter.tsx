// ============================================================
// ARCHIVO: src/components/oep/OEPDateFilter.tsx
// Filtro de fecha para OEP
// Equivalente exacto de: src/components/fullday/FullDayDateFilter.tsx
// ============================================================

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OEPDateFilterProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  totalOrders:  number;
}

export const OEPDateFilter: React.FC<OEPDateFilterProps> = ({
  selectedDate,
  onDateChange,
  totalOrders
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = () => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  const goToToday = () => onDateChange(new Date());

  const formatDate = (date: Date) =>
    date.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-center space-x-3">
        <button onClick={goToPrevDay}
          className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <div className="font-semibold text-gray-900 capitalize">
            {isToday() ? '📅 Hoy' : formatDate(selectedDate)}
          </div>
          {!isToday() && (
            <div className="text-xs text-gray-500">{formatDate(selectedDate)}</div>
          )}
        </div>

        <button onClick={goToNextDay}
          className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-sm text-blue-700 font-medium">
          {totalOrders} pedidos
        </span>
        {!isToday() && (
          <button onClick={goToToday}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            Ir a Hoy
          </button>
        )}
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => onDateChange(new Date(e.target.value + 'T12:00:00'))}
          className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};
