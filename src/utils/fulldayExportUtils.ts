// =========================================
// ARCHIVO: src/utils/fulldayExportUtils.ts
// CORREGIDO: Filtrado robusto por fechas y eliminadas importaciones no usadas
// =========================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../types/fullday';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';
import { supabase } from '../lib/supabase';

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
      `${item.quantity}x ${item.name.toUpperCase()}`
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

// --- FUNCIÓN AUXILIAR PARA LISTAR PRODUCTOS POR CATEGORÍA ---
const listFullDayItemsByMainCategory = async (order: FullDayOrder): Promise<{ 
  entradas: string; 
  fondos: string; 
  bebidas: string;
}> => {
  const result = {
      entradas: [] as string[],
      fondos: [] as string[],
      bebidas: [] as string[],
  };

  const itemIds = order.items.map(item => item.id);
  
  let menuItemsWithCategories: any[] = [];
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, category')
      .in('id', itemIds);
    
    if (!error && data) {
      menuItemsWithCategories = data;
    }
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
  }

  const categoryMap = new Map();
  menuItemsWithCategories.forEach(item => {
    categoryMap.set(item.id, item.category);
  });

  for (const item of order.items) {
    const itemDisplay = `${item.quantity}x ${item.name.toUpperCase()}`;
    
    const category = categoryMap.get(item.id) || '';
    const categoryLower = category.toLowerCase();
    const itemNameLower = item.name.toLowerCase();

    if (category) {
      if (categoryLower.includes('bebida') || 
          categoryLower.includes('gaseosa') || 
          categoryLower.includes('jugo') || 
          categoryLower.includes('café') || 
          categoryLower.includes('infusión') || 
          categoryLower.includes('te') || 
          categoryLower.includes('mate') || 
          categoryLower.includes('agua')) {
        result.bebidas.push(itemDisplay);
        continue;
      }
      
      if (categoryLower.includes('entrada') || 
          categoryLower.includes('ensalada') || 
          categoryLower.includes('sopa')) {
        result.entradas.push(itemDisplay);
        continue;
      }
      
      result.fondos.push(itemDisplay);
      continue;
    }

    if (itemNameLower.includes('gaseosa') || 
        itemNameLower.includes('inca kola') || 
        itemNameLower.includes('coca cola') ||
        itemNameLower.includes('sprite') ||
        itemNameLower.includes('fanta') ||
        itemNameLower.includes('agua') ||
        itemNameLower.includes('jugo') ||
        itemNameLower.includes('chicha') ||
        itemNameLower.includes('maracuya') ||
        itemNameLower.includes('limonada') ||
        itemNameLower.includes('café') ||
        itemNameLower.includes('infusión') ||
        itemNameLower.includes('te') ||
        itemNameLower.includes('mate') ||
        itemNameLower.includes('capuchino') ||
        itemNameLower.includes('expresso') ||
        itemNameLower.includes('bebida')) {
      result.bebidas.push(itemDisplay);
      continue;
    }
    
    if (itemNameLower.includes('entrada') || 
        itemNameLower.includes('ensalada') || 
        itemNameLower.includes('sopa') ||
        itemNameLower.includes('caldo') ||
        itemNameLower.includes('causa') ||
        itemNameLower.includes('papa a la huancaina') ||
        itemNameLower.includes('tamal') ||
        itemNameLower.includes('chaufa')) {
      result.entradas.push(itemDisplay);
      continue;
    }
    
    result.fondos.push(itemDisplay);
  }

  return {
      entradas: result.entradas.join('\n'),
      fondos: result.fondos.join('\n'),
      bebidas: result.bebidas.join('\n'),
  };
};

export const exportFullDayToExcel = async (orders: FullDayOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) {
    alert('No hay pedidos para exportar');
    return;
  }

  const dataPromises = orders.map(async (order) => {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const hora = formatTimeForDisplay(new Date(order.created_at));
    const categorizedItems = await listFullDayItemsByMainCategory(order);

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
      '🥗 ENTRADAS': categorizedItems.entradas,
      '🍽️ PLATOS DE FONDO': categorizedItems.fondos,
      '🥤 BEBIDAS': categorizedItems.bebidas,
    };
  });

  const data = await Promise.all(dataPromises);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
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
    { wch: 60 }, // 🥗 ENTRADAS
    { wch: 60 }, // 🍽️ PLATOS DE FONDO
    { wch: 40 }, // 🥤 BEBIDAS
  ];

  const nombreHoja = tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos';
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

  const fecha = new Date().toISOString().split('T')[0];
  const fileName = `fullday_${fecha}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

export const exportFullDayByDateRange = async (
  orders: FullDayOrder[],
  startDate: Date,
  endDate: Date
) => {
  console.log('🔍 EXPORTACIÓN POR RANGO DE FECHAS - INICIANDO');
  
  // --- FILTRADO CORREGIDO: Usando objetos Date con rangos explícitos ---
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  console.log('🔍 Filtrando por rango de fechas (local):', {
    start: startOfDay.toLocaleString(),
    end: endOfDay.toLocaleString()
  });

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });

  if (filteredOrders.length === 0) {
    alert('No hay pedidos en el rango de fechas seleccionado');
    return;
  }

  console.log(`📊 Generando reporte con ${filteredOrders.length} pedidos`);

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

  // HOJA 2: DETALLE POR ALUMNO (con productos categorizados)
  const detailData: any[][] = [
    ['DETALLE DE PEDIDOS'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['FECHA', 'HORA', 'N° ORDEN', 'GRADO', 'SECCIÓN', 'ALUMNO', 'APODERADO', 'TELÉFONO', 'PAGO', 'ENTRADAS', 'PLATOS DE FONDO', 'BEBIDAS', 'TOTAL']
  ];

  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  for (const order of sortedOrders) {
    const fecha = formatDateForDisplay(new Date(order.created_at));
    const hora = formatTimeForDisplay(new Date(order.created_at));
    const categorizedItems = await listFullDayItemsByMainCategory(order);

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
      categorizedItems.entradas,
      categorizedItems.fondos,
      categorizedItems.bebidas,
      `S/ ${order.total.toFixed(2)}`
    ]);
  }

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  wsDetail['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 20 }, { wch: 8 }, 
    { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, 
    { wch: 60 }, { wch: 60 }, { wch: 40 }, { wch: 12 }
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
      p.name.toUpperCase(),
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

  const fileName = `fullday_${startStr}_al_${endStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  console.log('✅ Reporte generado:', fileName);
};