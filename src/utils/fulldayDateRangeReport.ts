// ============================================
// ARCHIVO: src/utils/fulldayDateRangeReport.ts
// Reporte de FullDay por rango de fechas (MISMA LÓGICA QUE ÓRDENES)
// ============================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../hooks/useFullDay';
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

  // Obtener inicio y fin del día en hora LOCAL
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  console.log('📅 RANGO AJUSTADO:', {
    startOfDay: startOfDay.toString(),
    endOfDay: endOfDay.toString(),
    startLocal: formatDateForDisplay(startOfDay),
    endLocal: formatDateForDisplay(endOfDay)
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

  const efectivoPct = totalVentas > 0 ? (totalEfectivo / totalVentas) * 100 : 0;
  const yapePct = totalVentas > 0 ? (totalYape / totalVentas) * 100 : 0;
  const tarjetaPct = totalVentas > 0 ? (totalTarjeta / totalVentas) * 100 : 0;

  // Encontrar día con más ventas
  const ventasPorDia = new Map<string, number>();
  filteredOrders.forEach(order => {
    const date = formatDateForDisplay(new Date(order.created_at));
    ventasPorDia.set(date, (ventasPorDia.get(date) || 0) + order.total);
  });

  let mejorDia = { fecha: '', total: 0 };
  ventasPorDia.forEach((total, fecha) => {
    if (total > mejorDia.total) {
      mejorDia = { fecha, total };
    }
  });

  const summaryData: any[][] = [
    ['REPORTE DE PEDIDOS FULLDAY', ''],
    ['Período', `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    ['Fecha de generación', new Date().toLocaleString('es-PE')],
    ['', ''],
    ['📈 ESTADÍSTICAS GENERALES', ''],
    ['Total de Pedidos', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['💰 VENTAS POR MÉTODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`, `${efectivoPct.toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${totalYape.toFixed(2)}`, `${yapePct.toFixed(1)}%`],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`, `${tarjetaPct.toFixed(1)}%`],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`],
    ['', ''],
    ['🏆 ESTADÍSTICAS DESTACADAS', ''],
    ['Día con más ventas', mejorDia.fecha, `S/ ${mejorDia.total.toFixed(2)}`],
    ['Promedio diario', `S/ ${(totalVentas / (ventasPorDia.size || 1)).toFixed(2)}`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 RESUMEN');

  // ============================================
  // HOJA 2: DESGLOSE DIARIO
  // ============================================
  const dailyData: any[][] = [
    ['DESGLOSE DIARIO'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['FECHA', 'PEDIDOS', 'EFECTIVO', 'YAPE/PLIN', 'TARJETA', 'NO APLICA', 'TOTAL DÍA']
  ];

  const sortedDays = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  
  sortedDays.forEach(day => {
    dailyData.push([
      day.date,
      day.orders,
      `S/ ${day.efectivo.toFixed(2)}`,
      `S/ ${day.yapePlin.toFixed(2)}`,
      `S/ ${day.tarjeta.toFixed(2)}`,
      `S/ ${day.noAplica.toFixed(2)}`,
      `S/ ${day.total.toFixed(2)}`
    ]);
  });

  const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
  wsDaily['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDaily, '📅 DIARIO');

  // ============================================
  // HOJA 3: DETALLE POR ALUMNO
  // ============================================
  const detailData: any[][] = [
    ['DETALLE DE PEDIDOS POR ALUMNO'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['FECHA', 'GRADO', 'SECCIÓN', 'ALUMNO', 'APODERADO', 'TELÉFONO', 'PAGO', 'PRODUCTOS', 'TOTAL']
  ];

  // Ordenar por fecha (más reciente primero)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  sortedOrders.forEach(order => {
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
  wsDetail['!cols'] = [
    { wch: 12 }, { wch: 25 }, { wch: 8 }, { wch: 30 }, 
    { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 50 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 DETALLE');

  // ============================================
  // HOJA 4: TOP PRODUCTOS
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
