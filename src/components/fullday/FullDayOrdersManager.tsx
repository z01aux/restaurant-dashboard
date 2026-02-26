import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { useFullDayOrders } from '../../hooks/useFullDayOrders';
import { useFullDaySalesClosure } from '../../hooks/useFullDaySalesClosure';
import { FullDayCashRegisterModal } from '../sales_fullday/FullDayCashRegisterModal';
import { FullDaySalesHistory } from '../sales_fullday/FullDaySalesHistory';
import { FullDayDateRangeModal } from './FullDayDateRangeModal';
import { FullDayDateFilter } from './FullDayDateFilter';
import { exportFullDayToCSV, exportFullDayToExcel, exportFullDayByDateRange } from '../../utils/fulldayExportUtils';
import { generateFullDayTicketSummary, printFullDayResumenTicket } from '../../utils/fulldayTicketUtils';

export const FullDayOrdersManager: React.FC = () => {
  const { orders, loading, deleteOrder, getTodayOrders } = useFullDayOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useFullDaySalesClosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showOnlyToday, setShowOnlyToday] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (showOnlyToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.student_name?.toLowerCase().includes(term) ||
        order.guardian_name?.toLowerCase().includes(term) ||
        order.order_number?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [orders, searchTerm, showOnlyToday]);

  const handleExportTodayCSV = () => {
    const todayOrders = getTodayOrders();
    exportFullDayToCSV(todayOrders, 'fullday_hoy');
  };

  const handleExportAllCSV = () => {
    exportFullDayToCSV(orders, 'fullday_todos');
  };

  const handleExportTodayExcel = () => {
    const todayOrders = getTodayOrders();
    exportFullDayToExcel(todayOrders, 'today');
  };

  const handleExportAllExcel = () => {
    exportFullDayToExcel(orders, 'all');
  };

  const handleExportSummary = async (startDate: Date, endDate: Date) => {
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    if (filtered.length === 0) {
      alert('No hay pedidos en el rango seleccionado');
      return;
    }
    
    const summary = generateFullDayTicketSummary(filtered);
    printFullDayResumenTicket(summary, startDate, endDate);
  };

  const handleExportByDateRange = (startDate: Date, endDate: Date) => {
    exportFullDayByDateRange(orders, startDate, endDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          
          {/* Header con caja */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedidos FullDay</h1>
              <p className="text-sm text-gray-600 mt-1">{filteredOrders.length} pedidos</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
                <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
                </span>
              </div>

              {!cashRegister?.is_open ? (
                <button onClick={() => { setCashModalType('open'); setShowCashModal(true); }} 
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">
                  Abrir Caja
                </button>
              ) : (
                <button onClick={() => { setCashModalType('close'); setShowCashModal(true); }} 
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">
                  Cerrar Caja
                </button>
              )}

              <button onClick={() => setShowHistory(!showHistory)} 
                className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700">
                {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>

          {/* Filtro de fecha */}
          <FullDayDateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            totalOrders={filteredOrders.length}
          />

          {/* Historial */}
          {showHistory && <FullDaySalesHistory closures={closures} />}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={handleExportTodayCSV} className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 flex items-center">
              <Download size={16} className="mr-1" /> CSV Hoy
            </button>
            <button onClick={handleExportAllCSV} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center">
              <Download size={16} className="mr-1" /> CSV Todo
            </button>
            <button onClick={handleExportTodayExcel} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center">
              <FileSpreadsheet size={16} className="mr-1" /> Excel Hoy
            </button>
            <button onClick={handleExportAllExcel} className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center">
              <FileSpreadsheet size={16} className="mr-1" /> Excel Todo
            </button>
            <button onClick={() => setShowDateRangeModal(true)} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center">
              <Calendar size={16} className="mr-1" /> Reporte por Fechas
            </button>
            <button onClick={() => handleExportSummary(new Date(), new Date())} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center">
              <Printer size={16} className="mr-1" /> Ticket Resumen
            </button>
          </div>

          {/* Búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por alumno, apoderado..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay pedidos para mostrar
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{order.student_name}</div>
                      <div className="text-sm text-gray-600">{order.grade} - Sección {order.section}</div>
                      <div className="text-sm text-gray-600">Apoderado: {order.guardian_name}</div>
                      {order.phone && <div className="text-sm text-gray-600">Tel: {order.phone}</div>}
                      <div className="mt-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="text-sm">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">S/ {order.total.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{order.payment_method || 'NO APLICA'}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modales */}
          <FullDayCashRegisterModal
            isOpen={showCashModal}
            onClose={() => setShowCashModal(false)}
            type={cashModalType}
            cashRegister={cashRegister}
            onConfirm={cashModalType === 'open' 
              ? (data) => openCashRegister(data.initialCash!)
              : (data) => closeCashRegister(data.finalCash!, data.notes)
            }
            loading={salesLoading}
          />

          <FullDayDateRangeModal
            isOpen={showDateRangeModal}
            onClose={() => setShowDateRangeModal(false)}
            onConfirm={handleExportByDateRange}
          />
        </div>
      </div>
    </div>
  );
};