// ============================================
// ARCHIVO: src/utils/fulldayDateRangeReport.ts
// Reporte de FullDay por rango de fechas
// ============================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../types/fullday';
import { formatDateForDisplay } from './dateUtils';

interface DailySummary {
  date: string;
  orders: number;
  efectivo: number;
  yapePlin: number;
  tarjeta: number;
  noAplica: number;
  total: number;
}

export const exportFullDayByDateRange = (
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

  // Ajustar fechas para que cubran todo el día
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  console.log('📅 RANGO AJUSTADO:', {
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString()
  });

  // Filtrar órdenes por rango de fechas
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });

  console.log('📊 ÓRDENES FILTRADAS:', {
    total: orders.length,
    filtradas: filteredOrders.length
  });

  if (filteredOrders.length === 0) {
    alert('No hay pedidos en el rango de fechas seleccionado');
    return;
  }

  // ============================================
  // 1. Agrupar por fecha para resumen diario
  // ============================================
  const dailyMap = new Map<string, DailySummary>();
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = formatDateForDisplay(currentDate);
    dailyMap.set(dateStr, {
      date: dateStr,
      orders: 0,
      efectivo: 0,
      yapePlin: 0,
      tarjeta: 0,
      noAplica: 0,
      total: 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  filteredOrders.forEach(order => {
    const dateStr = formatDateForDisplay(new Date(order.created_at));
    const day = dailyMap.get(dateStr);
    
    if (day) {
      day.orders++;
      day.total += order.total;

      switch (order.payment_method) {
        case 'EFECTIVO':
          day.efectivo += order.total;
          break;
        case 'YAPE/PLIN':
          day.yapePlin += order.total;
          break;
        case 'TARJETA':
          day.tarjeta += order.total;
          break;
        default:
          day.noAplica += order.total;
      }
    }
  });

  // ============================================
  // 2. Crear libro de Excel
  // ============================================
  const wb = XLSX.utils.book_new();
  
  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
  
  // ============================================
  // HOJA 1: RESUMEN GENERAL
  // ============================================
  const totalOrders = filteredOrders.length;
  const totalVentas = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  const totalEfectivo = filteredOrders.filter(o => o.payment_method === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0);
  const totalYape = filteredOrders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0);
  const totalTarjeta = filteredOrders.filter(o => o.payment_method === 'TARJETA').reduce((sum, o) => sum + o.total, 0);
  const totalNoAplica = filteredOrders.filter(o => !o.payment_method).reduce((sum, o) => sum + o.total, 0);

  const summaryData: any[][] = [
    ['REPORTE DE PEDIDOS FULLDAY'],
    ['Colegio San José y El Redentor'],
    [],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [`Fecha de generación: ${new Date().toLocaleString('es-PE')}`],
    [],
    ['📊 RESUMEN GENERAL'],
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
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 RESUMEN');

  // ============================================
  // HOJA 2: DETALLE POR ALUMNO
  // ============================================
  const detailData: any[][] = [
    ['DETALLE DE PEDIDOS'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['FECHA', 'HORA', 'GRADO', 'SECCIÓN', 'ALUMNO', 'APODERADO', 'TELÉFONO', 'PAGO', 'PRODUCTOS', 'TOTAL']
  ];

  // Ordenar por fecha (más reciente primero)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sortedOrders.forEach(order => {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const hora = new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const productos = order.items.map(item => 
      `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`
    ).join('\n');

    detailData.push([
      fecha,
      hora,
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
  wsDetail['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 8 }, 
    { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, 
    { wch: 50 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 DETALLE');

  // ============================================
  // HOJA 3: TOP PRODUCTOS
  // ============================================
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += item.price * item.quantity;
      } else {
        productMap.set(item.id, {
          name: item.name,
          quantity: item.quantity,
          total: item.price * item.quantity
        });
      }
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((p, index) => [
      index + 1,
      p.name,
      p.quantity,
      `S/ ${p.total.toFixed(2)}`
    ]);

  const productsData: any[][] = [
    ['🏆 TOP 10 PRODUCTOS'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['#', 'PRODUCTO', 'CANTIDAD', 'TOTAL VENDIDO'],
    ...topProducts
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
  wsProducts['!cols'] = [
    { wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsProducts, '🏆 TOP 10');

  // ============================================
  // Guardar archivo
  // ============================================
  const fileName = `FULLDAY_${startStr}_al_${endStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  console.log('✅ Reporte generado:', fileName);
};
