// ============================================
// ARCHIVO: src/components/fullday/FullDayOrdersManager.tsx (ACTUALIZADO)
// Con sistema de caja y reportes
// ============================================

import React, { useState, useMemo } from 'react';
import { useFullDay } from '../../hooks/useFullDay';
import { useFullDaySalesClosure } from '../../hooks/useFullDaySalesClosure';
import { GraduationCap, Download, Calendar, DollarSign, Users, Search, Printer } from 'lucide-react';
import { CashRegisterModal } from '../sales/CashRegisterModal';
import { DateRangeModal } from '../orders/DateRangeModal';
import { exportFullDayByDateRange } from '../../utils/fulldayExportUtils';
import { SalesHistoryMinimal } from '../sales/SalesHistoryMinimal';
import { generateFullDayTicketSummary, printFullDayResumenTicket } from '../../utils/fulldayTicketUtils';

export const FullDayOrdersManager: React.FC = () => {
  const { orders, loading } = useFullDay();
  const { 
    cashRegister, 
    loading: salesLoading, 
    openCashRegister, 
    closeCashRegister,
    closures
  } = useFullDaySalesClosure();
  
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filtrar por fecha
  const filteredByDate = useMemo(() => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case 'today':
          return orderDate.getTime() === today.getTime();
        case 'week':
          return orderDate >= weekAgo;
        case 'month':
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [orders, dateFilter]);

  // Filtrar por búsqueda
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return filteredByDate;
    
    const term = searchTerm.toLowerCase();
    return filteredByDate.filter(order => 
      order.student_name.toLowerCase().includes(term) ||
      order.guardian_name.toLowerCase().includes(term) ||
      order.phone?.toLowerCase().includes(term) ||
      order.order_number?.toLowerCase().includes(term)
    );
  }, [filteredByDate, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const count = filteredOrders.length;
    const average = count > 0 ? total / count : 0;

    const byPayment = {
      EFECTIVO: filteredOrders.filter(o => o.payment_method === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0),
      YAPE_PLIN: filteredOrders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0),
      TARJETA: filteredOrders.filter(o => o.payment_method === 'TARJETA').reduce((sum, o) => sum + o.total, 0),
      NO_APLICA: filteredOrders.filter(o => !o.payment_method).reduce((sum, o) => sum + o.total, 0)
    };

    return { total, count, average, byPayment };
  }, [filteredOrders]);

  // Handlers de caja
  const handleOpenCash = () => {
    setCashModalType('open');
    setShowCashModal(true);
  };

  const handleCloseCash = () => {
    setCashModalType('close');
    setShowCashModal(true);
  };

  const handleCashConfirm = async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const result = await openCashRegister(data.initialCash!);
      if (result.success) {
        alert('✅ Caja FullDay abierta correctamente');
        setShowCashModal(false);
      }
    } else {
      const result = await closeCashRegister(filteredOrders, data.finalCash!, data.notes || '');
      if (result.success) {
        alert('✅ Caja FullDay cerrada correctamente');
        setShowCashModal(false);
      }
    }
  };

  // Handlers de reportes
  const handleExportExcel = async (startDate: Date, endDate: Date) => {
    if (exporting) return;
    setExporting(true);
    
    try {
      await exportFullDayByDateRange(filteredOrders, startDate, endDate);
    } catch (error) {
      console.error('Error exportando FullDay:', error);
      alert('Error al generar reporte');
    } finally {
      setExporting(false);
    }
  };

  const handlePrintTicket = async (startDate: Date, endDate: Date) => {
    const summary = generateFullDayTicketSummary(filteredOrders, startDate, endDate);
    printFullDayResumenTicket(summary, startDate, endDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          
          {/* Header con controles de caja */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pedidos FullDay</h1>
                <p className="text-gray-600 text-sm">Gestión exclusiva de pedidos de alumnos</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Estado de caja */}
              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
                <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  Caja FullDay: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
                </span>
              </div>

              {/* Botones de caja */}
              {!cashRegister?.is_open ? (
                <button 
                  onClick={handleOpenCash} 
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  Abrir Caja
                </button>
              ) : (
                <button 
                  onClick={handleCloseCash} 
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
                >
                  Cerrar Caja
                </button>
              )}

              <button 
                onClick={() => setShowHistory(!showHistory)} 
                className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700"
              >
                {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>

          {/* Historial minimalista */}
          {showHistory && <SalesHistoryMinimal closures={closures} type="fullday" />}

          {/* Filtros y acciones */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar alumno..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
                />
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="all">Todos</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDateRangeModal(true)}
                disabled={exporting}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-purple-700 disabled:opacity-50"
              >
                <Calendar size={16} />
                <span>Reportes</span>
              </button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Total Pedidos</div>
              <div className="text-2xl font-bold text-purple-800">{stats.count}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-600 font-medium">Total Ventas</div>
              <div className="text-2xl font-bold text-green-800">S/ {stats.total.toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Ticket Promedio</div>
              <div className="text-2xl font-bold text-blue-800">S/ {stats.average.toFixed(2)}</div>
            </div>
          </div>

          {/* Modal de caja */}
          <CashRegisterModal
            isOpen={showCashModal}
            onClose={() => setShowCashModal(false)}
            type={cashModalType}
            cashRegister={cashRegister}
            todaySummary={undefined}
            onConfirm={handleCashConfirm}
            loading={salesLoading}
          />

          {/* Modal de fechas */}
          <DateRangeModal
            isOpen={showDateRangeModal}
            onClose={() => setShowDateRangeModal(false)}
            onConfirmExcel={handleExportExcel}
            onConfirmTicket={handlePrintTicket}
          />

          {/* Lista de pedidos (tu código existente) */}
          {/* ... resto del componente ... */}

        </div>
      </div>
    </div>
  );
};