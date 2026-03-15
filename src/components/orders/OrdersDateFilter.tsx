// ARCHIVO: src/components/orders/OrdersDateFilter.tsx
// Selector de fecha para pedidos Órdenes
// ============================================

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrdersDateFilterProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  totalOrders: number;
}

export const OrdersDateFilter: React.FC<OrdersDateFilterProps> = ({
  selectedDate,
  onDateChange,
  totalOrders,
}) => {
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => onDateChange(new Date());

  const formatDate = (date: Date): string =>
    date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate()     === today.getDate()     &&
      date.getMonth()    === today.getMonth()    &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Selector de fecha con flechas */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Día anterior"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
            <Calendar size={18} className="text-red-600" />
            <span className="font-medium text-red-800">
              {formatDate(selectedDate)}
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Día siguiente"
            disabled={isToday(selectedDate)}
          >
            <ChevronRight size={20} className={isToday(selectedDate) ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>

        {/* Botón Hoy */}
        {!isToday(selectedDate) && (
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Ver Hoy
          </button>
        )}

        {/* Total de pedidos */}
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{totalOrders}</span> órdenes en esta fecha
        </div>
      </div>
    </div>
  );
};
