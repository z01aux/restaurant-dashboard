// ============================================
// ARCHIVO: src/utils/fulldayExportUtils.ts (MODIFICADO)
// Utilidades de exportación para FullDay
// Ahora 'exportFullDayToExcel' lista productos por categoría
// ============================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../types/fullday';
import { formatDateForDisplay, formatTimeForDisplay, getStartOfDay, getEndOfDay } from './dateUtils';

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

// --- FUNCIÓN AUXILIAR PARA LISTAR PRODUCTOS POR CATEGORÍA PRINCIPAL EN FULLDAY ---
/**
 * Toma un pedido FullDay y devuelve un string con la lista de productos
 * para cada categoría ("Entradas", "Platos de fondo", "Bebidas").
 * Cada producto se muestra con su cantidad (ej. "2x Lomo Saltado").
 * Los productos que no coinciden con ninguna categoría van a "Platos de fondo".
 */
const listFullDayItemsByMainCategory = (order: FullDayOrder): { 
  entradas: string; 
  fondos: string; 
  bebidas: string;
  montoEntradas: number;
  montoFondos: number;
  montoBebidas: number;
} => {
  const result = {
      entradas: [] as string[],
      fondos: [] as string[],
      bebidas: [] as string[],
      montoEntradas: 0,
      montoFondos: 0,
      montoBebidas: 0,
  };

  order.items.forEach(item => {
      const itemName = item.name.toLowerCase();
      const itemDisplay = `${item.quantity}x ${item.name}`;
      const itemTotal = item.price * item.quantity;

      // --- AJUSTA ESTAS CONDICIONES SEGÚN TUS PRODUCTOS DE FULLDAY ---
      if (itemName.includes('entrada') || itemName.includes('ensalada') || itemName.includes('sopa')) {
          result.entradas.push(itemDisplay);
          result.montoEntradas += itemTotal;
      } else if (itemName.includes('fondo') || itemName.includes('pollo') || itemName.includes('carne') || itemName.includes('pescado') || itemName.includes('lomo') || itemName.includes('saltado')) {
          result.fondos.push(itemDisplay);
          result.montoFondos += itemTotal;
      } else if (itemName.includes('bebida') || itemName.includes('gaseosa') || itemName.includes('jugo') || itemName.includes('agua') || itemName.includes('refresco') || itemName.includes('chicha')) {
          result.bebidas.push(itemDisplay);
          result.montoBebidas += itemTotal;
      } else {
          // Por defecto, a "Platos de fondo"
          result.fondos.push(itemDisplay);
          result.montoFondos += itemTotal;
      }
  });

  return {
      entradas: result.entradas.join('\n'),
      fondos: result.fondos.join('\n'),
      bebidas: result.bebidas.join('\n'),
      montoEntradas: result.montoEntradas,
      montoFondos: result.montoFondos,
      montoBebidas: result.montoBebidas,
  };
};

export const exportFullDayToExcel = (orders: FullDayOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) {
    alert('No hay pedidos para exportar');
    return;
  }

  // --- ESTRUCTURA DE DATOS MODIFICADA PARA LA HOJA PRINCIPAL ---
  // Se ha eliminado 'APODERADO' y 'PRODUCTOS'.
  // Se han añadido las columnas con la lista de productos por categoría.
  const data = orders.map(order => {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const hora = formatTimeForDisplay(new Date(order.created_at));
    const categorizedItems = listFullDayItemsByMainCategory(order);

    return {
      'FECHA': fecha,
      'HORA': hora,
      'N° ORDEN': order.order_number,
      'ALUMNO': order.student_name.toUpperCase(),
      'GRADO': order.grade,
      'SECCIÓN': order.section,
      // 'APODERADO' ELIMINADO
      'TELÉFONO': order.phone || '',
      'MONTO TOTAL': `S/ ${order.total.toFixed(2)}`,
      'MÉTODO PAGO': order.payment_method || 'NO APLICA',
      // --- NUEVAS COLUMNAS (LISTAS DE PRODUCTOS) ---
      'Entradas': categorizedItems.entradas,
      'Platos de fondo': categorizedItems.fondos,
      'Bebidas': categorizedItems.bebidas,
      'Monto Entradas': `S/ ${categorizedItems.montoEntradas.toFixed(2)}`,
      'Monto Fondo': `S/ ${categorizedItems.montoFondos.toFixed(2)}`,
      'Monto Bebidas': `S/ ${categorizedItems.montoBebidas.toFixed(2)}`,
      // -----------------------
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajustar el ancho de las columnas. Las columnas de texto llevan más ancho.
  ws['!cols'] = [
    { wch: 12 }, // FECHA
    { wch: 8 },  // HORA
    { wch: 15 }, // N° ORDEN
    { wch: 30 }, // ALUMNO
    { wch: 20 }, // GRADO
    { wch: 8 },  // SECCIÓN
    { wch: 15 }, // TELÉFONO
    { wch: 12 }, // MONTO TOTAL
    { wch: 12 }, // MÉTODO PAGO
    // --- NUEVAS COLUMNAS ---
    { wch: 40 }, // Entradas (lista de productos)
    { wch: 40 }, // Platos de fondo (lista de productos)
    { wch: 40 }, // Bebidas (lista de productos)
    { wch: 15 }, // Monto Entradas
    { wch: 15 }, // Monto Fondo
    { wch: 15 }, // Monto Bebidas
    // -----------------------
  ];

  const nombreHoja = tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos';
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

  const fecha = new Date().toISOString().split('T')[0];
  const tipoTexto = tipo === 'today' ? 'diarios' : 'todos';
  const fileName = `fullday_${tipoTexto}_${fecha}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

export const exportFullDayByDateRange = (
  orders: FullDayOrder[],
  startDate: Date,
  endDate: Date
) => {
  console.log('🔍 EXPORTACIÓN POR RANGO DE FECHAS - INICIANDO');
  console.log('📅 Fechas recibidas:', {
    startDate: startDate.toString(),
    endDate: endDate.toString(),
    startISO: startDate.toISOString(),
    endISO: endDate.toISOString()
  });

  // Ajustar fechas para que cubran todo el día en hora local
  const startOfDay = getStartOfDay(startDate);
  const endOfDay = getEndOfDay(endDate);

  console.log('📅 Rango ajustado:', {
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString()
  });

  console.log('📦 Total de pedidos en el sistema:', orders.length);

  // Filtrar órdenes por rango de fechas
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });

  console.log('📊 Pedidos encontrados en el rango:', filteredOrders.length);

  if (filteredOrders.length === 0) {
    alert('No hay pedidos en el rango de fechas seleccionado');
    return;
  }

  // Crear libro de Excel
  const wb = XLSX.utils.book_new();
  
  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
  
  // HOJA 1: RESUMEN GENERAL
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

  // HOJA 2: DETALLE POR ALUMNO (CORREGIDO)
  const detailData: any[][] = [
    ['DETALLE DE PEDIDOS'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['FECHA', 'HORA', 'N° ORDEN', 'GRADO', 'SECCIÓN', 'ALUMNO', 'APODERADO', 'TELÉFONO', 'PAGO', 'PRODUCTOS', 'TOTAL']
  ];

  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sortedOrders.forEach(order => {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const hora = formatTimeForDisplay(new Date(order.created_at));
    
    const productos = order.items.map(item => 
      `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`
    ).join('\n');

    detailData.push([
      fecha,
      hora,
      order.order_number,
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
    { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 20 }, { wch: 8 }, 
    { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, 
    { wch: 50 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 DETALLE');

  // HOJA 3: TOP PRODUCTOS
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

  const fileName = `FULLDAY_${startStr}_al_${endStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  console.log('✅ Reporte generado:', fileName);
};
