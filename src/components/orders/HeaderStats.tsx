// ============================================
// ARCHIVO: src/components/orders/HeaderStats.tsx
// ============================================

import React from 'react';
import { Order } from '../../types';

interface HeaderStatsProps {
  totalOrders: number;
  showOnlyToday: boolean;
  setShowOnlyToday: (value: boolean) => void;
  cashRegister: any;
  onOpenCash: () => void;
  onCloseCash: () => void;
  onShowHistory: () => void;
  showHistory: boolean;
}

export const HeaderStats = React.memo(({
  totalOrders,
  showOnlyToday,
  setShowOnlyToday,
  cashRegister,
  onOpenCash,
  onCloseCash,
  onShowHistory,
  showHistory
}: HeaderStatsProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
        <p className="text-sm text-gray-600 mt-1">
          {totalOrders} órdenes encontradas
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Toggle para mostrar solo hoy */}
        <button
          onClick={() => setShowOnlyToday(!showOnlyToday)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showOnlyToday 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}
        >
          {showOnlyToday ? '📅 Solo Hoy' : '📅 Todas las fechas'}
        </button>

        {/* Estado de caja */}
        <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
          <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
          </span>
        </div>

        {/* Botones de caja */}
        {!cashRegister?.is_open ? (
          <button 
            onClick={onOpenCash} 
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-green-700 transition-colors"
          >
            <span>Abrir Caja</span>
          </button>
        ) : (
          <button 
            onClick={onCloseCash} 
            className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-red-700 transition-colors"
          >
            <span>Cerrar Caja</span>
          </button>
        )}

        <button 
          onClick={onShowHistory} 
          className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1 hover:bg-gray-700 transition-colors"
        >
          <span>{showHistory ? 'Ocultar Historial' : 'Ver Historial'}</span>
        </button>
      </div>
    </div>
  );
});