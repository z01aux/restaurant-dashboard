// ============================================
// ARCHIVO: src/components/fullday/FullDayHeaderStats.tsx
// Header con estadísticas para FullDay
// ============================================

import React from 'react';

interface FullDayHeaderStatsProps {
  totalOrders: number;
  showOnlyToday: boolean;
  setShowOnlyToday: (value: boolean) => void;
  cashRegister: any;
  onOpenCash: () => void;
  onCloseCash: () => void;
  onShowHistory: () => void;
  showHistory: boolean;
}

export const FullDayHeaderStats = React.memo(({
  totalOrders,
  showOnlyToday,
  setShowOnlyToday,
  cashRegister,
  onOpenCash,
  onCloseCash,
  onShowHistory,
  showHistory
}: FullDayHeaderStatsProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos FullDay</h2>
        <p className="text-sm text-gray-600 mt-1">
          {totalOrders} pedidos encontrados
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowOnlyToday(!showOnlyToday)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showOnlyToday 
              ? 'bg-purple-100 text-purple-700 border border-purple-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}
        >
          {showOnlyToday ? '📅 Solo Hoy' : '📅 Todas las fechas'}
        </button>

        <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
          <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
          </span>
        </div>

        {!cashRegister?.is_open ? (
          <button 
            onClick={onOpenCash} 
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            Abrir Caja
          </button>
        ) : (
          <button 
            onClick={onCloseCash} 
            className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Cerrar Caja
          </button>
        )}

        <button 
          onClick={onShowHistory} 
          className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
        </button>
      </div>
    </div>
  );
});