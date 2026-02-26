import React, { useState, useMemo } from 'react';
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
  const { orders, loading, getTodayOrders } = useFullDayOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useFullDaySalesClosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  // Filtrar pedidos por fecha seleccionada y búsqueda
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    // Filtrar por fecha seleccionada
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.student_name?.toLowerCase().includes(term) ||
        order.guardian_name?.toLowerCase().includes(term) ||
        order.order_number?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [orders, searchTerm, selectedDate]);

  // Handlers de exportación
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
    console.log('📅 Exportando resumen para fechas:', { 
      start: startDate.toISOString(), 
      end: endDate.toISOString() 
    });
    
    // Ajustar fechas para que cubran todo el día
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });
    
    console.log('📊 Pedidos encontrados:', filtered.length);
    
    if (filtered.length === 0) {
      alert('No hay pedidos en el rango seleccionado');
      return;
    }
    
    const summary = generateFullDayTicketSummary(filtered);
    printFullDayResumenTicket(summary, startDate, endDate);
  };

  const handleExportByDateRange = (startDate: Date, endDate: Date) => {
    console.log('📅 Exportando Excel para fechas:', { 
      start: startDate.toISOString(), 
      end: endDate.toISOString() 
    });
    exportFullDayByDateRange(orders, startDate, endDate);
  };

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
        alert('✅ Caja abierta correctamente');
        setShowCashModal(false);
      } else {
        alert('❌ ' + result.error);
      }
    } else {
      const result = await closeCashRegister(data.finalCash!, data.notes || '');
      if (result.success) {
        alert('✅ Caja cerrada correctamente');
        setShowCashModal(false);
      } else {
        alert('❌ ' + result.error);
      }
    }
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
                <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}
                </span>
              </div>

              {!cashRegister?.is_open ? (
                <button 
                  onClick={handleOpenCash} 
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Abrir Caja
                </button>
              ) : (
                <button 
                  onClick={handleCloseCash} 
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Cerrar Caja
                </button>
              )}

              <button 
                onClick={() => setShowHistory(!showHistory)} 
                className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
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

          {/* Historial de cierres */}
          {showHistory && <FullDaySalesHistory closures={closures} />}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              onClick={handleExportTodayCSV} 
              className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 flex items-center transition-colors"
            >
              <Download size={16} className="mr-1" /> CSV Hoy
            </button>
            
            <button 
              onClick={handleExportAllCSV} 
              className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center transition-colors"
            >
              <Download size={16} className="mr-1" /> CSV Todo
            </button>

            <button 
              onClick={handleExportTodayExcel} 
              className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center transition-colors"
            >
              <FileSpreadsheet size={16} className="mr-1" /> Excel Hoy
            </button>

            <button 
              onClick={handleExportAllExcel} 
              className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center transition-colors"
            >
              <FileSpreadsheet size={16} className="mr-1" /> Excel Todo
            </button>

            <button 
              onClick={() => setShowDateRangeModal(true)} 
              className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center transition-colors"
            >
              <Calendar size={16} className="mr-1" /> Reporte por Fechas
            </button>

            <button 
              onClick={() => handleExportSummary(selectedDate, selectedDate)} 
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center transition-colors"
            >
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
                placeholder="Buscar por alumno, apoderado o número de orden..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl text-gray-300 mb-4">📭</div>
                <p className="text-gray-500 text-lg">No hay pedidos para esta fecha</p>
                <p className="text-gray-400 text-sm mt-2">Selecciona otra fecha o crea un nuevo pedido en Recepción</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          #{order.order_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div>
                          <div className="text-xs text-gray-500">Alumno</div>
                          <div className="font-semibold text-gray-900">{order.student_name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Grado y Sección</div>
                          <div className="text-sm text-gray-700">{order.grade} - Sección {order.section}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Apoderado</div>
                          <div className="text-sm text-gray-700">{order.guardian_name}</div>
                        </div>
                        {order.phone && (
                          <div>
                            <div className="text-xs text-gray-500">Teléfono</div>
                            <div className="text-sm text-gray-700">{order.phone}</div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">Productos</div>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                              <span className="font-semibold text-purple-600">{item.quantity}x</span>
                              <span className="ml-1 text-gray-700">{item.name}</span>
                              {item.notes && (
                                <span className="ml-1 text-xs text-gray-500 italic">({item.notes})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4 min-w-[120px]">
                      <div className="text-lg font-bold text-purple-600">S/ {order.total.toFixed(2)}</div>
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                        order.payment_method === 'EFECTIVO' ? 'bg-green-100 text-green-800' :
                        order.payment_method === 'YAPE/PLIN' ? 'bg-purple-100 text-purple-800' :
                        order.payment_method === 'TARJETA' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.payment_method || 'NO APLICA'}
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">Notas:</div>
                      <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded mt-1">
                        {order.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Modales */}
          <FullDayCashRegisterModal
            isOpen={showCashModal}
            onClose={() => setShowCashModal(false)}
            type={cashModalType}
            onConfirm={handleCashConfirm}
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
