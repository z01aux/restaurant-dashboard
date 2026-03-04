// =========================================
// ARCHIVO: src/utils/fulldayExportUtils.ts
// =========================================

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

// --- FUNCIÓN AUXILIAR PARA LISTAR PRODUCTOS POR CATEGORÍA (CORREGIDA) ---
const listFullDayItemsByMainCategory = (order: FullDayOrder): { 
  entradas: string; 
  fondos: string; 
  bebidas: string;
} => {
  const result = {
      entradas: [] as string[],
      fondos: [] as string[],
      bebidas: [] as string[],
  };

  order.items.forEach(item => {
      const itemDisplay = `${item.quantity}x ${item.name}`;

      // --- PRIORIDAD 1: Usar la categoría del producto si existe ---
      // @ts-ignore - Asumiendo que item puede tener una propiedad 'category'
      const category = item.category ? item.category.toLowerCase() : null;
      
      if (category) {
        // Palabras clave para identificar el tipo de categoría
        if (category.includes('entrada') || category.includes('ensalada') || category.includes('sopa')) {
          result.entradas.push(itemDisplay);
          return;
        }
        if (category.includes('fondo') || category.includes('principal') || category.includes('plato')) {
          result.fondos.push(itemDisplay);
          return;
        }
        if (category.includes('bebida') || category.includes('gaseosa') || category.includes('jugo') || 
            category.includes('café') || category.includes('infusión') || category.includes('te') || 
            category.includes('mate') || category.includes('agua')) {
          result.bebidas.push(itemDisplay);
          return;
        }
        // Si no coincide con las keywords anteriores, pero tiene categoría, lo dejamos como fondo por defecto.
        result.fondos.push(itemDisplay);
        return;
      }

      // --- PRIORIDAD 2: Si no hay categoría, usar palabras clave en el nombre (RESPALDO MEJORADO) ---
      const itemName = item.name.toLowerCase();
      
      // Bebidas (Lista más completa)
      if (itemName.includes('gaseosa') || 
          itemName.includes('inca kola') || 
          itemName.includes('coca cola') ||
          itemName.includes('sprite') ||
          itemName.includes('fanta') ||
          itemName.includes('agua') ||
          itemName.includes('jugo') ||
          itemName.includes('chicha') ||
          itemName.includes('maracuya') ||
          itemName.includes('limonada') ||
          itemName.includes('café') ||      // <--- AGREGADO
          itemName.includes('infusión') ||  // <--- AGREGADO
          itemName.includes('te') ||        // <--- AGREGADO
          itemName.includes('mate') ||      // <--- AGREGADO
          itemName.includes('capuchino') || // <--- AGREGADO
          itemName.includes('expresso')) {  // <--- AGREGADO
        result.bebidas.push(itemDisplay);
        return;
      }
      
      // Entradas
      if (itemName.includes('entrada') || 
          itemName.includes('ensalada') || 
          itemName.includes('sopa') ||
          itemName.includes('caldo') ||
          itemName.includes('causa') ||
          itemName.includes('papa a la huancaina') ||
          itemName.includes('tamal')) {
        result.entradas.push(itemDisplay);
        return;
      }
      
      // Si no coincide con ninguna, es un plato de fondo
      result.fondos.push(itemDisplay);
  });

  return {
      entradas: result.entradas.join('\n'),
      fondos: result.fondos.join('\n'),
      bebidas: result.bebidas.join('\n'),
  };
};

export const exportFullDayToExcel = (orders: FullDayOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) {
    alert('No hay pedidos para exportar');
    return;
  }

  // --- ESTRUCTURA DE DATOS PARA LA HOJA PRINCIPAL ---
  // CON EMOJIS EN LOS ENCABEZADOS
  const data = orders.map(order => {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const hora = formatTimeForDisplay(new Date(order.created_at));
    const categorizedItems = listFullDayItemsByMainCategory(order);

    return {
      '📅 FECHA': fecha,
      '⏰ HORA': hora,
      '🔢 N° ORDEN': order.order_number,
      '👤 ALUMNO': order.student_name.toUpperCase(),
      '📚 GRADO': order.grade,
      '📌 SECCIÓN': order.section,
      '📞 TELÉFONO': order.phone || '',
      '💰 MONTO TOTAL': `S/ ${order.total.toFixed(2)}`,
      '💳 MÉTODO PAGO': order.payment_method || 'NO APLICA',
      // --- COLUMNAS CON EMOJIS DISTINTIVOS ---
      '🥗 ENTRADAS': categorizedItems.entradas,
      '🍽️ PLATOS DE FONDO': categorizedItems.fondos,
      '🥤 BEBIDAS': categorizedItems.bebidas,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajustar el ancho de las columnas
  ws['!cols'] = [
    { wch: 12 }, // 📅 FECHA
    { wch: 8 },  // ⏰ HORA
    { wch: 15 }, // 🔢 N° ORDEN
    { wch: 30 }, // 👤 ALUMNO
    { wch: 20 }, // 📚 GRADO
    { wch: 8 },  // 📌 SECCIÓN
    { wch: 15 }, // 📞 TELÉFONO
    { wch: 12 }, // 💰 MONTO TOTAL
    { wch: 12 }, // 💳 MÉTODO PAGO
    { wch: 40 }, // 🥗 ENTRADAS
    { wch: 40 }, // 🍽️ PLATOS DE FONDO
    { wch: 40 }, // 🥤 BEBIDAS
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
  
  const startOfDay = getStartOfDay(startDate);
  const endOfDay = getEndOfDay(endDate);

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });

  if (filteredOrders.length === 0) {
    alert('No hay pedidos en el rango de fechas seleccionado');
    return;
  }

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

  // HOJA 2: DETALLE POR ALUMNO
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
