// ============================================
// ARCHIVO: src/utils/fulldayDateRangeReport.ts
// Reporte de FullDay por rango de fechas (similar a Ordenes)
// ============================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../hooks/useFullDay';
import { formatDateForDisplay } from './dateUtils';

interface DailySummary {
  date: string;
  orders: number;
  total: number;
  efectivo: number;
  yapePlin: number;
  tarjeta: number;
  noAplica: number;
}

export const exportFullDayByDateRange = (
  orders: FullDayOrder[],
  startDate: Date,
  endDate: Date
) => {
  console.log('📅 Generando reporte FullDay por rango de fechas...');
  console.log('📅 Rango seleccionado:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startLocal: formatDateForDisplay(startDate),
    endLocal: formatDateForDisplay(endDate)
  });
  console.log('📦 Total de pedidos en el sistema:', orders.length);

  // ============================================
  // 1. Filtrar órdenes por rango de fechas
  // ============================================
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  console.log('🔍 Buscando pedidos entre:', {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString()
  });

  // Mostrar algunos pedidos de ejemplo para depuración
  if (orders.length > 0) {
    console.log('📝 Primeros 3 pedidos en el sistema:');
    orders.slice(0, 3).forEach((order, i) => {
      console.log(`  Pedido ${i + 1}:`, {
        id: order.id,
        fecha: new Date(order.created_at).toISOString(),
        fechaLocal: formatDateForDisplay(new Date(order.created_at)),
        alumno: order.student_name
      });
    });
  }

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });

  console.log('✅ Pedidos encontrados en el rango:', filteredOrders.length);

  if (filteredOrders.length === 0) {
    // Mostrar mensaje más informativo
    const mensaje = `No hay pedidos entre ${formatDateForDisplay(startDate)} y ${formatDateForDisplay(endDate)}. 
    Total de pedidos en el sistema: ${orders.length}`;
    console.warn('⚠️', mensaje);
    alert(mensaje);
    return;
  }

  // ============================================
  // 2. Agrupar por fecha para resumen diario
  // ============================================
  const dailyMap = new Map<string, DailySummary>();
  
  // Inicializar todos los días del rango
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = formatDateForDisplay(currentDate);
    dailyMap.set(dateStr, {
      date: dateStr,
      orders: 0,
      total: 0,
      efectivo: 0,
      yapePlin: 0,
      tarjeta: 0,
      noAplica: 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Acumular pedidos por día
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
    } else {
      console.warn('⚠️ Fecha no encontrada en el mapa:', dateStr);
    }
  });

  // ============================================
  // 3. Agrupar por grado y sección
  // ============================================
  const gradeGroups: Record<string, FullDayOrder[]> = {};
  
  filteredOrders.forEach(order => {
    const key = `${order.grade} - ${order.section}`;
    if (!gradeGroups[key]) gradeGroups[key] = [];
    gradeGroups[key].push(order);
  });

  console.log('📚 Grupos por grado:', Object.keys(gradeGroups).length);

  // Ordenar grados
  const gradeOrder = [
    'RED ROOM', 'YELLOW ROOM', 'GREEN ROOM',
    'PRIMERO DE PRIMARIA', 'SEGUNDO DE PRIMARIA', 'TERCERO DE PRIMARIA',
    'CUARTO DE PRIMARIA', 'QUINTO DE PRIMARIA', 'SEXTO DE PRIMARIA',
    'PRIMERO DE SECUNDARIA', 'SEGUNDO DE SECUNDARIA', 'TERCERO DE SECUNDARIA',
    'CUARTO DE SECUNDARIA', 'QUINTO DE SECUNDARIA'
  ];

  const sortedGradeKeys = Object.keys(gradeGroups).sort((a, b) => {
    const gradeA = a.split(' - ')[0];
    const gradeB = b.split(' - ')[0];
    const sectionA = a.split(' - ')[1];
    const sectionB = b.split(' - ')[1];
    
    const indexA = gradeOrder.indexOf(gradeA);
    const indexB = gradeOrder.indexOf(gradeB);
    
    if (indexA === indexB) {
      return sectionA.localeCompare(sectionB);
    }
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // ============================================
  // 4. Crear libro de Excel
  // ============================================
  const wb = XLSX.utils.book_new();
  
  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
  
  // ============================================
  // HOJA 1: RESUMEN GENERAL
  // ============================================
  const totalOrders = filteredOrders.length;
  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  
  const totalEfectivo = filteredOrders.filter(o => o.payment_method === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0);
  const totalYape = filteredOrders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0);
  const totalTarjeta = filteredOrders.filter(o => o.payment_method === 'TARJETA').reduce((sum, o) => sum + o.total, 0);
  const totalNoAplica = filteredOrders.filter(o => !o.payment_method).reduce((sum, o) => sum + o.total, 0);

  const summaryData: any[][] = [
    ['REPORTE DE PEDIDOS FULLDAY'],
    ['Colegio San José y El Redentor'],
    [],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [`Fecha de generación: ${formatDateForDisplay(new Date())}`],
    [],
    ['📊 RESUMEN GENERAL'],
    ['Total de Pedidos', totalOrders],
    ['Total Ventas', `S/ ${totalAmount.toFixed(2)}`],
    [],
    ['💰 VENTAS POR MÉTODO DE PAGO'],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`, totalAmount > 0 ? `${((totalEfectivo / totalAmount) * 100).toFixed(1)}%` : '0%'],
    ['YAPE/PLIN', `S/ ${totalYape.toFixed(2)}`, totalAmount > 0 ? `${((totalYape / totalAmount) * 100).toFixed(1)}%` : '0%'],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`, totalAmount > 0 ? `${((totalTarjeta / totalAmount) * 100).toFixed(1)}%` : '0%'],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`, totalAmount > 0 ? `${((totalNoAplica / totalAmount) * 100).toFixed(1)}%` : '0%']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 Resumen General');

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

  // Totales del período
  dailyData.push([]);
  dailyData.push([
    'TOTAL PERÍODO',
    totalOrders,
    `S/ ${totalEfectivo.toFixed(2)}`,
    `S/ ${totalYape.toFixed(2)}`,
    `S/ ${totalTarjeta.toFixed(2)}`,
    `S/ ${totalNoAplica.toFixed(2)}`,
    `S/ ${totalAmount.toFixed(2)}`
  ]);

  const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
  wsDaily['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDaily, '📅 Desglose Diario');

  // ============================================
  // HOJA 3: DETALLE POR ALUMNO (ORGANIZADO POR GRADO)
  // ============================================
  const detailData: any[][] = [
    ['DETALLE DE PEDIDOS POR ALUMNO'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['GRADO', 'SECCIÓN', 'FECHA', 'ALUMNO', 'APODERADO', 'TELÉFONO', 'PAGO', 'PRODUCTOS', 'TOTAL']
  ];

  sortedGradeKeys.forEach(gradeKey => {
    const orders = gradeGroups[gradeKey];
    const [grade, section] = gradeKey.split(' - ');
    
    // Separador visual
    detailData.push([`═══════════════════════════════════════════════════════════════════════════════`]);
    detailData.push([`📚 ${grade} - SECCIÓN ${section} (${orders.length} pedidos)`]);
    detailData.push([`═══════════════════════════════════════════════════════════════════════════════`]);
    
    // Ordenar por fecha (más reciente primero)
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    sortedOrders.forEach(order => {
      const fecha = formatDateForDisplay(new Date(order.created_at));
      const productos = order.items.map(item => 
        `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`
      ).join('\n');

      detailData.push([
        grade,
        section,
        fecha,
        order.student_name,
        order.guardian_name,
        order.phone || '---',
        order.payment_method || 'NO APLICA',
        productos,
        `S/ ${order.total.toFixed(2)}`
      ]);
    });
    
    // Subtotal del grado
    const gradeTotal = orders.reduce((sum, o) => sum + o.total, 0);
    detailData.push([]);
    detailData.push([
      '', '', '', '', '', '', '',
      `🔹 SUBTOTAL ${grade} - ${section}:`,
      `S/ ${gradeTotal.toFixed(2)}`
    ]);
    detailData.push([]);
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  wsDetail['!cols'] = [
    { wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 30 }, 
    { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 50 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 Detalle por Alumno');

  // ============================================
  // HOJA 4: TOP PRODUCTOS DEL PERÍODO
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
    .map((p, index) => [
      index + 1,
      p.name,
      p.quantity,
      `S/ ${p.total.toFixed(2)}`,
      p.quantity > 0 ? `S/ ${(p.total / p.quantity).toFixed(2)}` : 'S/ 0.00'
    ]);

  // Calcular totales de forma segura
  let totalProductQuantity = 0;
  let totalProductAmount = 0;
  
  topProducts.forEach(p => {
    totalProductQuantity += p[2] as number;
    const amountStr = p[3] as string;
    const amount = parseFloat(amountStr.replace('S/ ', ''));
    totalProductAmount += amount;
  });

  const productsData: any[][] = [
    ['🏆 TOP PRODUCTOS DEL PERÍODO'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['#', 'PRODUCTO', 'CANTIDAD', 'TOTAL VENDIDO', 'PRECIO PROMEDIO'],
    ...topProducts,
    [],
    ['📈 TOTALES', '', totalProductQuantity, `S/ ${totalProductAmount.toFixed(2)}`, '']
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
  wsProducts['!cols'] = [
    { wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsProducts, '🏆 Top Productos');

  // ============================================
  // Guardar archivo
  // ============================================
  const fileName = `FULLDAY_${startStr}_al_${endStr}_REPORTE.xlsx`;
  XLSX.writeFile(wb, fileName);
  console.log('✅ Reporte por rango de fechas generado:', fileName);
};