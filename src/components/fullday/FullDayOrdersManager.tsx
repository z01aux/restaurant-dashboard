// ============================================
// ARCHIVO: src/components/fullday/FullDayOrdersManager.tsx (COMPLETO)
// Gestor de pedidos FullDay con filtros por fecha, reportes y vista cocina
// ============================================

import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, Download, Search, Printer, FileSpreadsheet, 
  ChefHat, CalendarRange 
} from 'lucide-react';
import { useFullDay } from '../../hooks/useFullDay';
import { FullDayDateFilter } from './FullDayDateFilter';
import { FullDayDateRangeModal } from './FullDayDateRangeModal';
import { 
  exportKitchenReportToExcel, 
  printKitchenTicket 
} from '../../utils/fulldayReports';
import { exportAdminReportByGrade } from '../../utils/fulldayAdminReport';
import { exportFullDayByDateRange } from '../../utils/fulldayDateRangeReport';

export const FullDayOrdersManager: React.FC = () => {
  const { orders, loading } = useFullDay();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'normal' | 'kitchen'>('normal');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  // Filtrar pedidos por fecha seleccionada
  const ordersByDate = useMemo(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });
  }, [orders, selectedDate]);

  // Filtrar por búsqueda
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return ordersByDate;
    
    const term = searchTerm.toLowerCase();
    return ordersByDate.filter(order => 
      order.student_name.toLowerCase().includes(term) ||
      order.guardian_name.toLowerCase().includes(term) ||
      order.phone?.toLowerCase().includes(term) ||
      order.order_number?.toLowerCase().includes(term)
    );
  }, [ordersByDate, searchTerm]);

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

  // Resumen de productos para vista cocina
  const kitchenSummary = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number }>();
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          productMap.set(item.id, {
            name: item.name,
            quantity: item.quantity
          });
        }
      });
    });

    return Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  // Handlers de reportes
  const handlePrintKitchenTicket = () => {
    if (filteredOrders.length === 0) {
      alert('No hay pedidos para generar ticket de cocina');
      return;
    }
    printKitchenTicket(filteredOrders, selectedDate);
  };

  const handleExportKitchenExcel = () => {
    if (filteredOrders.length === 0) {
      alert('No hay pedidos para exportar');
      return;
    }
    exportKitchenReportToExcel(filteredOrders, selectedDate);
  };

  const handleExportAdminExcel = () => {
    if (filteredOrders.length === 0) {
      alert('No hay pedidos para exportar');
      return;
    }
    exportAdminReportByGrade(filteredOrders, selectedDate);
  };

  const handleExportByDateRange = (startDate: Date, endDate: Date) => {
    exportFullDayByDateRange(orders, startDate, endDate);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pedidos FullDay</h1>
                <p className="text-gray-600 text-sm">Gestión de pedidos de alumnos</p>
              </div>
            </div>

            {/* Toggle de vista */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('normal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'normal' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 Vista Normal
              </button>
              <button
                onClick={() => setViewMode('kitchen')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'kitchen' 
                    ? 'bg-white text-orange-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👨‍🍳 Vista Cocina
              </button>
            </div>
          </div>

          {/* Filtro de fecha */}
          <FullDayDateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            totalOrders={filteredOrders.length}
          />

          {/* Barra de búsqueda y botones de reporte */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar alumno o apoderado..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Reportes de cocina */}
              <button
                onClick={handlePrintKitchenTicket}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-orange-600 transition-colors"
                title="Imprimir ticket para cocina"
              >
                <Printer size={16} />
                <span>Ticket Cocina</span>
              </button>

              <button
                onClick={handleExportKitchenExcel}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-orange-700 transition-colors"
                title="Exportar reporte de cocina a Excel"
              >
                <FileSpreadsheet size={16} />
                <span>Excel Cocina</span>
              </button>

              {/* Reporte administrativo del día */}
              <button
                onClick={handleExportAdminExcel}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-purple-700 transition-colors"
                title="Exportar reporte administrativo del día"
              >
                <Download size={16} />
                <span>Excel Día</span>
              </button>

              {/* Reporte por rango de fechas */}
              <button
                onClick={() => setShowDateRangeModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
                title="Exportar reporte por rango de fechas"
              >
                <CalendarRange size={16} />
                <span>Reporte por Fechas</span>
              </button>
            </div>
          </div>

          {/* Modal de rango de fechas */}
          <FullDayDateRangeModal
            isOpen={showDateRangeModal}
            onClose={() => setShowDateRangeModal(false)}
            onConfirm={handleExportByDateRange}
          />

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Productos</div>
              <div className="text-2xl font-bold text-yellow-800">
                {kitchenSummary.reduce((sum, p) => sum + p.quantity, 0)}
              </div>
            </div>
          </div>

          {/* VISTA COCINA */}
          {viewMode === 'kitchen' && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ChefHat className="mr-2 text-orange-500" size={24} />
                Resumen para Cocina - {selectedDate.toLocaleDateString()}
              </h2>
              
              {kitchenSummary.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No hay productos para mostrar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kitchenSummary.map(product => (
                    <div key={product.name} className="bg-white rounded-lg p-6 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{product.name}</h3>
                      <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-orange-600">{product.quantity}</span>
                        <span className="text-sm text-gray-500">unidades</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA NORMAL - Lista de pedidos */}
          {viewMode === 'normal' && (
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay pedidos para esta fecha
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm 
                      ? 'Intenta con otros términos de búsqueda' 
                      : 'Los pedidos aparecerán aquí cuando se registren'}
                  </p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            #{order.order_number}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Alumno</div>
                            <div className="font-medium text-gray-900">{order.student_name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Grado y Sección</div>
                            <div className="font-medium text-gray-900">{order.grade} "{order.section}"</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Apoderado</div>
                            <div className="font-medium text-gray-900">{order.guardian_name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Teléfono</div>
                            <div className="font-medium text-gray-900">{order.phone || 'No registrado'}</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 mb-2">Productos</div>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                              >
                                <span className="font-semibold text-purple-600">{item.quantity}x</span>
                                <span className="ml-2 text-gray-700">{item.name}</span>
                                {item.notes && (
                                  <span className="ml-2 text-xs text-gray-500 italic">
                                    (Nota: {item.notes})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="lg:text-right flex lg:block items-center justify-between lg:min-w-[200px]">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Total</div>
                          <div className="text-2xl font-bold text-purple-600">
                            S/ {order.total.toFixed(2)}
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            order.payment_method === 'EFECTIVO' ? 'bg-green-100 text-green-800' :
                            order.payment_method === 'YAPE/PLIN' ? 'bg-purple-100 text-purple-800' :
                            order.payment_method === 'TARJETA' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.payment_method || 'NO APLICA'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Notas adicionales</div>
                        <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded-lg">
                          {order.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};