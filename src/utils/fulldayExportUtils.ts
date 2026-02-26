// ============================================
// ARCHIVO: src/utils/fulldayExportUtils.ts
// Utilidades de exportación para FullDay
// ============================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../types/fullday';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';

export const exportFullDayToCSV = (orders: FullDayOrder[], fileName: string) => {
  if (orders.length === 0) {
    alert('No hay pedidos para exportar');
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
    'PRODUCTOS'
  ];

  const csvData = orders.map(order => {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const hora = formatTimeForDisplay(new Date(order.created_at));
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
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportFullDayToExcel = (orders: FullDayOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) {
    alert('No hay pedidos para exportar');
    return;
  }

  const data = orders.map(order => {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const hora = formatTimeForDisplay(new Date(order.created_at));
    const productos = order.items.map(item => 
      `${item.quantity}x ${item.name}`
    ).join('\n');

    return {
      'FECHA': fecha,
      'HORA': hora,
      'N° ORDEN': order.order_number,
      'ALUMNO': order.student_name.toUpperCase(),
      'GRADO': order.grade,
      'SECCIÓN': order.section,
      'APODERADO': order.guardian_name.toUpperCase(),
      'TELÉFONO': order.phone || '',
      'MONTO': `S/ ${order.total.toFixed(2)}`,
      'MÉTODO PAGO': order.payment_method || 'NO APLICA',
      'PRODUCTOS': productos
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 30 },
    { wch: 20 }, { wch: 8 }, { wch: 30 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 50 }
  ];

  const nombreHoja = tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos';
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

  const fecha = new Date().toISOString().split('T')[0];
  const tipoTexto = tipo === 'today' ? 'diarios' : 'todos';
  const fileName = `fullday_${tipoTexto}_${fecha}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

export const exportFullDayByDateRange = async (
  orders: FullDayOrder[],
  startDate: Date,
  endDate: Date
) => {
  console.log('🔍 FECHAS RECIBIDAS:', {
    startDate: startDate.toString(),
    endDate: endDate.toString(),
    startLocal: formatDateForDisplay(startDate),
    endLocal: formatDateForDisplay(endDate)
  });

  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });

  if (filteredOrders.length === 0) {
    alert('No hay pedidos en el rango de fechas seleccionado');
    return;
  }

  const wb = XLSX.utils.book_new();

  // HOJA 1: RESUMEN GENERAL
  const totalOrders = filteredOrders.length;
  const totalVentas = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  const totalEfectivo = filteredOrders.filter(o => o.payment_method === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0);
  const totalYape = filteredOrders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0);
  const totalTarjeta = filteredOrders.filter(o => o.payment_method === 'TARJETA').reduce((sum, o) => sum + o.total, 0);
  const totalNoAplica = filteredOrders.filter(o => !o.payment_method).reduce((sum, o) => sum + o.total, 0);

  const summaryData: any[][] = [
    ['REPORTE DE PEDIDOS FULLDAY'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    ['Fecha de generación', new Date().toLocaleString('es-PE')],
    [],
    ['📈 ESTADÍSTICAS GENERALES'],
    ['Total de Pedidos', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    [],
    ['💰 VENTAS POR MÉTODO DE PAGO'],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`, totalVentas > 0 ? `${((totalEfectivo / totalVentas) * 100).toFixed(1)}%` : '0%'],
    ['YAPE/PLIN', `S/ ${totalYape.toFixed(2)}`, totalVentas > 0 ? `${((totalYape / totalVentas) * 100).toFixed(1)}%` : '0%'],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`, totalVentas > 0 ? `${((totalTarjeta / totalVentas) * 100).toFixed(1)}%` : '0%'],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 RESUMEN');

  // HOJA 2: DETALLE POR ALUMNO
  const detailData: any[][] = [
    ['DETALLE DE PEDIDOS'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['FECHA', 'GRADO', 'SECCIÓN', 'ALUMNO', 'APODERADO', 'TELÉFONO', 'PAGO', 'PRODUCTOS', 'TOTAL']
  ];

  filteredOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  filteredOrders.forEach(order => {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const productos = order.items.map(item => 
      `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`
    ).join('\n');

    detailData.push([
      fecha,
      order.grade,
      order.section,
      order.student_name,
      order.guardian_name,
      order.phone || '---',
      order.payment_method || 'NO APLICA',
      productos,
      `S/ ${order.total.toFixed(2)}`
    ]);
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 DETALLE');

  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `FULLDAY_${startStr}_al_${endStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
};