// ============================================
// ARCHIVO: src/components/fullday/FullDayOrdersManager.tsx
// Gestor exclusivo para pedidos FullDay (usando tabla fullday)
// ============================================

import React, { useState, useMemo } from 'react';
import { useFullDay } from '../../hooks/useFullDay';
import { GraduationCap, Download, Calendar, DollarSign, Users, Search } from 'lucide-react';

export const FullDayOrdersManager: React.FC = () => {
  const { orders, loading } = useFullDay();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');

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

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No hay pedidos FullDay para exportar');
      return;
    }

    const headers = [
      'FECHA',
      'HORA',
      'N° ORDEN',
      'ALUMNO',
      'GRADO',
      'SECCIÓN',
      'APODERADO',
      'TELÉFONO',
      'MONTO',
      'MÉTODO PAGO',
      'ESTADO',
      'PRODUCTOS'
    ];

    const csvData = filteredOrders.map(order => {
      const fecha = new Date(order.created_at).toLocaleDateString();
      const hora = new Date(order.created_at).toLocaleTimeString();
      const productos = order.items.map(item => 
        `${item.quantity}x ${item.name}`
      ).join(' | ');

      return [
        fecha,
        hora,
        order.order_number,
        order.student_name,
        order.grade,
        order.section,
        order.guardian_name,
        order.phone || '',
        `S/ ${order.total.toFixed(2)}`,
        order.payment_method || 'NO APLICA',
        order.status,
        productos
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `fullday_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-indigo-100 text-indigo-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendiente',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Pedidos FullDay</h1>
                  <p className="text-gray-600 text-sm">Gestión exclusiva de pedidos de alumnos</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar alumno o apoderado..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-64"
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

              <button
                onClick={exportToCSV}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 hover:shadow-md transition-all"
              >
                <Download size={16} />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-purple-600 font-medium flex items-center">
                <Users size={16} className="mr-1" /> Total Pedidos
              </div>
              <div className="text-2xl font-bold text-purple-800">{stats.count}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-600 font-medium flex items-center">
                <DollarSign size={16} className="mr-1" /> Total Ventas
              </div>
              <div className="text-2xl font-bold text-green-800">S/ {stats.total.toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Ticket Promedio</div>
              <div className="text-2xl font-bold text-blue-800">S/ {stats.average.toFixed(2)}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Efectivo</div>
              <div className="text-lg font-bold text-yellow-800">S/ {stats.byPayment.EFECTIVO.toFixed(2)}</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-indigo-600 font-medium">Yape/Plin</div>
              <div className="text-lg font-bold text-indigo-800">S/ {stats.byPayment.YAPE_PLIN.toFixed(2)}</div>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay pedidos FullDay
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchTerm || dateFilter !== 'all' 
                    ? 'No se encontraron pedidos con los filtros seleccionados'
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
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {new Date(order.created_at).toLocaleString()}
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

          {filteredOrders.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Mostrando {filteredOrders.length} de {orders.length} pedidos FullDay
                </span>
                <span className="font-semibold text-purple-600">
                  Total: S/ {stats.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};