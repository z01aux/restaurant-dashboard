// ============================================================
// ARCHIVO: src/components/oep/OEPDateFilter.tsx
// Selector de fecha para pedidos OEP
// ============================================================

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface OEPDateFilterProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    totalOrders: number;
}

export const OEPDateFilter: React.FC<OEPDateFilterProps> = ({
    selectedDate,
    onDateChange,
    totalOrders
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

    const handleToday = () => {
        onDateChange(new Date());
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePrevDay}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Día anterior"
                    >
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>

                    <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <Calendar size={18} className="text-blue-600" />
                        <span className="font-medium text-blue-800">
                            {formatDate(selectedDate)}
                        </span>
                    </div>

                    <button
                        onClick={handleNextDay}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Día siguiente"
                        disabled={isToday(selectedDate)}
                    >
                        <ChevronRight size={20} className={`${isToday(selectedDate) ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>
                </div>

                {!isToday(selectedDate) && (
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Ver Hoy
                    </button>
                )}

                <div className="text-sm text-gray-600">
                    <span className="font-semibold">{totalOrders}</span> pedidos en esta fecha
                </div>
            </div>
        </div>
    );
};