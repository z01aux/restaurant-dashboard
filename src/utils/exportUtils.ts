// ============================================
// ARCHIVO: src/utils/exportUtils.ts
// ============================================

import * as XLSX from 'xlsx';
import { Order } from '../types';
import { SalesClosure } from '../types/sales';
import { supabase } from '../lib/supabase';
import {
  getStartOfDay,
  getEndOfDay,
  formatDateForDisplay,
  formatTimeForDisplay,
  toLocalDateString
} from './dateUtils';

/**
 * Interfaz para el resumen diario
 */
interface DailySummary {
  date: string;
  orders: number;
  efectivo: number;
  yapePlin: number;
  tarjeta: number;
  noAplica: number;
  total: number;
}

/**
 * Interfaz para el resumen de productos
 */
interface ProductSummary {
  id: string;
  name: string;
  quantity: number;
  total: number;
  category: string;
}

/**
 * Genera hoja de resumen a partir de un cierre guardado
 */
const generateResumenSheetFromClosure = (closure: SalesClosure, startDate: Date, endDate: Date): any[][] => {
  const totalOrders = closure.total_orders;
  const totalVentas = closure.total_amount;

  // Encontrar día con más ventas
  let mejorDia = { fecha: '', total: 0 };
  
  const dailyBreakdown = (closure as any).daily_breakdown;
  if (dailyBreakdown && Array.isArray(dailyBreakdown) && dailyBreakdown.length > 0) {
    dailyBreakdown.forEach((day: any) => {
      if (day.total && day.total > mejorDia.total) {
        mejorDia = { fecha: day.date || '', total: day.total };
      }
    });
  }

  return [
    ['REPORTE DE VENTAS (DATOS DE CIERRE)', ''],
    ['Período', `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    ['Fecha de generación', new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })],
    ['N° de Cierre', closure.closure_number],
    ['', ''],
    ['ESTADISTICAS GENERALES', ''],
    ['Total de Órdenes', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['VENTAS POR METODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${closure.total_efectivo.toFixed(2)}`, `${((closure.total_efectivo / totalVentas) * 100).toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${closure.total_yape_plin.toFixed(2)}`, `${((closure.total_yape_plin / totalVentas) * 100).toFixed(1)}%`],
    ['TARJETA', `S/ ${closure.total_tarjeta.toFixed(2)}`, `${((closure.total_tarjeta / totalVentas) * 100).toFixed(1)}%`],
    ['NO APLICA', `S/ ${closure.total_no_aplica.toFixed(2)}`],
    ['', ''],
    ['ESTADISTICAS DESTACADAS', ''],
    ['Día con más ventas', mejorDia.fecha || 'N/A', mejorDia.total > 0 ? `S/ ${mejorDia.total.toFixed(2)}` : ''],
    ['Promedio diario', `S/ ${(totalVentas / (totalOrders || 1)).toFixed(2)}`]
  ];
};

/**
 * Genera hoja de desglose diario a partir de un cierre guardado
 */
const generateDiarioSheetFromClosure = (closure: SalesClosure): DailySummary[] => {
  const result: DailySummary[] = [];
  
  const dailyBreakdown = (closure as any).daily_breakdown;
  if (dailyBreakdown && Array.isArray(dailyBreakdown) && dailyBreakdown.length > 0) {
    dailyBreakdown.forEach((day: any) => {
      result.push({
        date: day.date || formatDateForDisplay(new Date(closure.closure_date)),
        orders: day.orders || 0,
        efectivo: day.efectivo || 0,
        yapePlin: day.yapePlin || 0,
        tarjeta: day.tarjeta || 0,
        noAplica: day.noAplica || 0,
        total: day.total || 0
      });
    });
  } else {
    result.push({
      date: formatDateForDisplay(new Date(closure.closure_date)),
      orders: closure.total_orders,
      efectivo: closure.total_efectivo,
      yapePlin: closure.total_yape_plin,
      tarjeta: closure.total_tarjeta,
      noAplica: closure.total_no_aplica,
      total: closure.total_amount
    });
  }
  
  return result;
};

/**
 * Genera hoja de top productos a partir de un cierre guardado
 */
const generateTopProductsFromClosure = (closure: SalesClosure): any[] => {
  if (closure.top_products && Array.isArray(closure.top_products) && closure.top_products.length > 0) {
    return closure.top_products.slice(0, 5).map(p => ({
      name: p.name || 'Producto',
      quantity: p.quantity || 0,
      total: `S/ ${(p.total || 0).toFixed(2)}`,
      category: p.category || 'Sin categoría'
    }));
  }
  return [];
};

/**
 * Genera hoja de detalle a partir de órdenes (SOLO PARA DETALLE)
 */
const generateDetalleSheetFromOrders = (orders: Order[]): any[] => {
  return orders.map(order => ({
    'FECHA': formatDateForDisplay(order.createdAt),
    'HORA': formatTimeForDisplay(order.createdAt),
    'N° ORDEN': order.orderNumber || `ORD-${order.id.slice(-8)}`,
    'CLIENTE': order.customerName.toUpperCase(),
    'TELÉFONO': order.phone,
    'MONTO': `S/ ${order.total.toFixed(2)}`,
    'METODO': order.paymentMethod || 'NO APLICA',
    'PRODUCTOS': order.items.map(item => 
      `${item.quantity}x ${item.menuItem.name}`
    ).join('\n')
  }));
};

/**
 * Exporta órdenes por rango de fechas - CORREGIDO: USA SIEMPRE DATOS DE CIERRE CUANDO EXISTEN
 */
export const exportOrdersByDateRange = async (
  orders: Order[], 
  startDate: Date, 
  endDate: Date
) => {
  console.log('🔍 FECHAS RECIBIDAS EN EXCEL:', {
    startDate: formatDateForDisplay(startDate),
    endDate: formatDateForDisplay(endDate)
  });

  // Obtener inicio y fin del día en hora LOCAL
  const startOfDay = getStartOfDay(startDate);
  const endOfDay = getEndOfDay(endDate);
  
  // Verificar si existe un cierre para este rango de fechas
  try {
    const startStr = toLocalDateString(startDate);
    const endStr = toLocalDateString(endDate);
    
    console.log('🔍 BUSCANDO CIERRES ENTRE:', startStr, 'y', endStr);
    
    const { data: closures, error } = await supabase
      .from('sales_closures')
      .select('*')
      .gte('closure_date', startStr)
      .lte('closure_date', endStr)
      .order('closure_date', { ascending: true });

    if (error) throw error;

    // SI HAY CIERRES, USAMOS SUS DATOS (NO LAS ÓRDENES ACTUALES)
    if (closures && closures.length > 0) {
      console.log('📊 USANDO DATOS DE CIERRE GUARDADOS (NO las órdenes actuales)');
      console.log('💰 Total del cierre:', closures[0].total_amount);
      
      const wb = XLSX.utils.book_new();

      if (closures.length === 1) {
        // UN SOLO CIERRE - Usamos todos sus datos
        const closure = closures[0] as SalesClosure;
        
        // HOJA 1: RESUMEN (DATOS DEL CIERRE)
        const resumenData = generateResumenSheetFromClosure(closure, startDate, endDate);
        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

        // HOJA 2: DESGLOSE DIARIO (DATOS DEL CIERRE)
        const diarioData = generateDiarioSheetFromClosure(closure);
        const wsDiario = XLSX.utils.json_to_sheet(diarioData);
        
        const diarioHeaders = [
          { v: 'FECHA', position: 'A1' },
          { v: 'ORDENES', position: 'B1' },
          { v: 'EFECTIVO', position: 'C1' },
          { v: 'YAPE/PLIN', position: 'D1' },
          { v: 'TARJETA', position: 'E1' },
          { v: 'NO APLICA', position: 'F1' },
          { v: 'TOTAL DIA', position: 'G1' }
        ];
        
        diarioHeaders.forEach(h => {
          const cell = wsDiario[h.position as keyof typeof wsDiario];
          if (cell) cell.v = h.v;
        });

        wsDiario['!cols'] = [
          { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, 
          { wch: 12 }, { wch: 12 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

        // HOJA 3: TOP 5 PRODUCTOS (DATOS DEL CIERRE)
        const topProducts = generateTopProductsFromClosure(closure);
        const wsProductos = XLSX.utils.json_to_sheet(topProducts);

        const productHeaders = [
          { v: 'PRODUCTO', position: 'A1' },
          { v: 'CANTIDAD', position: 'B1' },
          { v: 'TOTAL VENDIDO', position: 'C1' },
          { v: 'CATEGORIA', position: 'D1' }
        ];

        productHeaders.forEach(h => {
          const cell = wsProductos[h.position as keyof typeof wsProductos];
          if (cell) cell.v = h.v;
        });

        wsProductos['!cols'] = [{ wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

        // HOJA 4: DETALLE (SOLO PARA REFERENCIA, CON LAS ÓRDENES ACTUALES)
        // Nota: Esta hoja muestra las órdenes actuales, pero los totales ya están congelados
        const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          const orderDay = formatDateForDisplay(orderDate);
          const startDay = formatDateForDisplay(startOfDay);
          const endDay = formatDateForDisplay(endOfDay);
          return orderDay >= startDay && orderDay <= endDay;
        });

        if (filteredOrders.length > 0) {
          const detalleData = generateDetalleSheetFromOrders(filteredOrders);
          const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
          wsDetalle['!cols'] = [
            { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 25 },
            { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 50 }
          ];
          
          // Agregar nota de que los totales son del cierre
          const nota = [
            ['NOTA: Los totales de este reporte corresponden al CIERRE DE CAJA #' + closure.closure_number],
            ['Las órdenes detalladas abajo son las que existen ACTUALMENTE en el sistema'],
            ['Si se eliminaron órdenes después del cierre, los totales NO coincidirán con el detalle']
          ];
          const wsNota = XLSX.utils.aoa_to_sheet(nota);
          XLSX.utils.book_append_sheet(wb, wsNota, 'NOTA IMPORTANTE');
          
          XLSX.utils.book_append_sheet(wb, wsDetalle, 'DETALLE ACTUAL');
        }

      } else {
        // MÚLTIPLES CIERRES - Combinamos los datos
        const combinedResumen = generateCombinedResumen(closures as SalesClosure[], startDate, endDate);
        const wsResumen = XLSX.utils.aoa_to_sheet(combinedResumen);
        wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

        const allDailyBreakdown: DailySummary[] = [];
        closures.forEach(closure => {
          const c = closure as SalesClosure;
          const dailyFromClosure = generateDiarioSheetFromClosure(c);
          allDailyBreakdown.push(...dailyFromClosure);
        });

        const wsDiario = XLSX.utils.json_to_sheet(allDailyBreakdown.sort((a, b) => a.date.localeCompare(b.date)));
        XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

        const combinedProducts = combineTopProducts(closures as SalesClosure[]).slice(0, 5);
        const wsProductos = XLSX.utils.json_to_sheet(combinedProducts);
        XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');
      }

      const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
      const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `ventas_${startStr}_al_${endStr}_CON_CORTE.xlsx`;

      XLSX.writeFile(wb, fileName);
      return; // IMPORTANTE: Salimos de la función, NO usamos las órdenes actuales
    }
  } catch (error) {
    console.error('Error al buscar cierres:', error);
  }

  // SOLO si NO hay cierres, usamos cálculo en vivo
  console.log('📊 NO HAY CIERRES, usando cálculo en vivo con órdenes actuales');
  
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const orderDay = formatDateForDisplay(orderDate);
    const startDay = formatDateForDisplay(getStartOfDay(startDate));
    const endDay = formatDateForDisplay(getEndOfDay(endDate));
    return orderDay >= startDay && orderDay <= endDay;
  });

  if (filteredOrders.length === 0) {
    alert('No hay órdenes en el rango de fechas seleccionado');
    return;
  }

  const wb = XLSX.utils.book_new();

  // HOJA 1: RESUMEN GENERAL
  const resumenData = generateResumenSheet(filteredOrders, startDate, endDate);
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

  // HOJA 2: DESGLOSE DIARIO
  const diarioData = generateDiarioSheet(filteredOrders, startDate, endDate);
  const wsDiario = XLSX.utils.json_to_sheet(diarioData);
  
  const diarioHeaders = [
    { v: 'FECHA', position: 'A1' },
    { v: 'ORDENES', position: 'B1' },
    { v: 'EFECTIVO', position: 'C1' },
    { v: 'YAPE/PLIN', position: 'D1' },
    { v: 'TARJETA', position: 'E1' },
    { v: 'NO APLICA', position: 'F1' },
    { v: 'TOTAL DIA', position: 'G1' }
  ];
  
  diarioHeaders.forEach(h => {
    const cell = wsDiario[h.position as keyof typeof wsDiario];
    if (cell) cell.v = h.v;
  });

  wsDiario['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

  // HOJA 3: TOP 5 PRODUCTOS
  const topProducts = generateTopProducts(filteredOrders).slice(0, 5);
  const wsProductos = XLSX.utils.json_to_sheet(topProducts);

  const productHeaders = [
    { v: 'PRODUCTO', position: 'A1' },
    { v: 'CANTIDAD', position: 'B1' },
    { v: 'TOTAL VENDIDO', position: 'C1' },
    { v: 'CATEGORIA', position: 'D1' }
  ];

  productHeaders.forEach(h => {
    const cell = wsProductos[h.position as keyof typeof wsProductos];
    if (cell) cell.v = h.v;
  });

  wsProductos['!cols'] = [{ wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

  // HOJA 4: DETALLE COMPLETO
  const detalleData = generateDetalleSheetFromOrders(filteredOrders);
  const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
  wsDetalle['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 25 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 50 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'DETALLE');

  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `ventas_${startStr}_al_${endStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

// ... (el resto de las funciones auxiliares se mantienen igual)
