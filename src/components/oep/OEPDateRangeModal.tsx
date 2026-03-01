// ============================================================
// ARCHIVO: src/components/oep/OEPDateRangeModal.tsx
// Modal para reportes por rango de fechas en OEP
// ============================================================

import React, { useState } from 'react';
import { X, Calendar, Download } from 'lucide-react';

interface OEPDateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (startDate: Date, endDate: Date) => void;
}

const getTodayString = (): string => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const year = peruDate.getFullYear();
    const month = String(peruDate.getMonth() + 1).padStart(2, '0');
    const day = String(peruDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const createPeruDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const OEPDateRangeModal: React.FC<OEPDateRangeModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    const [startDate, setStartDate] = useState<string>(getTodayString);
    const [endDate, setEndDate] = useState<string>(getTodayString);
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

        if (diffDays > 31) {
            setError('El rango máximo permitido es de 31 días');
            return false;
        }

        setError(null);
        return true;
    };

    const handleConfirm = () => {
        if (validateDates()) {
            onConfirm(createPeruDate(startDate), createPeruDate(endDate));
            onClose();
        }
    };

    const setToday = () => {
        const today = getTodayString();
        setStartDate(today);
        setEndDate(today);
    };

    const setYesterday = () => {
        const now = new Date();
        const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
        peruDate.setDate(peruDate.getDate() - 1);
        const year = peruDate.getFullYear();
        const month = String(peruDate.getMonth() + 1).padStart(2, '0');
        const day = String(peruDate.getDate()).padStart(2, '0');
        const yesterdayStr = `${year}-${month}-${day}`;
        setStartDate(yesterdayStr);
        setEndDate(yesterdayStr);
    };

    const setThisWeek = () => {
        const now = new Date();
        const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));

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
    };

    const setThisMonth = () => {
        const now = new Date();
        const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));

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

                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
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

                <div className="p-6">

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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 El reporte incluirá:</h3>
                        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                            <li>Resumen general del período</li>
                            <li>Desglose diario de ventas</li>
                            <li>Detalle de pedidos por cliente</li>
                            <li>Top productos más vendidos</li>
                        </ul>
                    </div>

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
                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all font-semibold flex items-center justify-center space-x-2"
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