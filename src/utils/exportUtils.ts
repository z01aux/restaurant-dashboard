// ============================================
// ARCHIVO: src/utils/exportUtils.ts (VERSIÓN FINAL - SIN CATEGORÍA)
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
  mixto: number;
  tarjeta: number;
  noAplica: number;
  total: number;
}

// ============================================
// FUNCIONES AUXILIARES PARA CIERRES
// ============================================

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
    ['MIXTO', `S/ ${(closure as any).total_mixto?.toFixed(2) || '0.00'}`, `${(((closure as any).total_mixto || 0) / totalVentas * 100).toFixed(1)}%`],
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
        mixto: day.mixto || 0,
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
      mixto: (closure as any).total_mixto || 0,
      noAplica: closure.total_no_aplica,
      total: closure.total_amount
    });
  }
  
  return result;
};

/**
 * Genera resumen combinado para múltiples cierres
 */
const generateCombinedResumen = (closures: SalesClosure[], startDate: Date, endDate: Date): any[][] => {
  const totalOrders = closures.reduce((sum, c) => sum + c.total_orders, 0);
  const totalVentas = closures.reduce((sum, c) => sum + c.total_amount, 0);

  const totalEfectivo = closures.reduce((sum, c) => sum + c.total_efectivo, 0);
  const totalYapePlin = closures.reduce((sum, c) => sum + c.total_yape_plin, 0);
  const totalTarjeta = closures.reduce((sum, c) => sum + c.total_tarjeta, 0);
  const totalMixto = closures.reduce((sum, c) => sum + ((c as any).total_mixto || 0), 0);
  const totalNoAplica = closures.reduce((sum, c) => sum + c.total_no_aplica, 0);

  const efectivoPct = totalVentas > 0 ? (totalEfectivo / totalVentas) * 100 : 0;
  const yapePlinPct = totalVentas > 0 ? (totalYapePlin / totalVentas) * 100 : 0;
  const tarjetaPct = totalVentas > 0 ? (totalTarjeta / totalVentas) * 100 : 0;
  const mixtoPct = totalVentas > 0 ? (totalMixto / totalVentas) * 100 : 0;

  return [
    ['REPORTE DE VENTAS COMBINADO (MULTIPLES CIERRES)', ''],
    ['Período', `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    ['Fecha de generación', new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })],
    ['Cantidad de cierres', closures.length],
    ['', ''],
    ['ESTADISTICAS GENERALES', ''],
    ['Total de Órdenes', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['VENTAS POR METODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`, `${efectivoPct.toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${totalYapePlin.toFixed(2)}`, `${yapePlinPct.toFixed(1)}%`],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`, `${tarjetaPct.toFixed(1)}%`],
    ['MIXTO', `S/ ${totalMixto.toFixed(2)}`, `${mixtoPct.toFixed(1)}%`],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`]
  ];
};

/**
 * Combina top productos de múltiples cierres
 */
const combineTopProducts = (closures: SalesClosure[]): any[] => {
  const productMap = new Map<string, { quantity: number; total: number; name: string; category: string }>();

  closures.forEach(closure => {
    if (closure.top_products && Array.isArray(closure.top_products)) {
      closure.top_products.forEach(product => {
        const existing = productMap.get(product.id);
        if (existing) {
          existing.quantity += product.quantity;
          existing.total += product.total;
        } else {
          productMap.set(product.id, {
            name: product.name,
            quantity: product.quantity,
            total: product.total,
            category: product.category
          });
        }
      });
    }
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .map(p => ({
      name: p.name,
      quantity: p.quantity,
      total: `S/ ${p.total.toFixed(2)}`,
      category: p.category
    }));
};

// ============================================
// FUNCIONES PARA CÁLCULO EN VIVO (SIN CIERRES)
// ============================================

/**
 * Genera los datos para la hoja de resumen (cálculo en vivo) - CON PAGO MIXTO
 */
const generateResumenSheet = (orders: Order[], startDate: Date, endDate: Date): any[][] => {
  const totalOrders = orders.length;
  const totalVentas = orders.reduce((sum, o) => sum + o.total, 0);

  // Calcular por método de pago incluyendo MIXTO
  let efectivo = 0;
  let yapePlin = 0;
  let tarjeta = 0;
  let mixto = 0;
  let noAplica = 0;

  orders.forEach(order => {
    if (order.paymentMethod === 'MIXTO' && order.splitPayment) {
      // Para pagos mixtos, sumamos cada parte a su método correspondiente
      efectivo += order.splitPayment.efectivo || 0;
      yapePlin += order.splitPayment.yapePlin || 0;
      tarjeta += order.splitPayment.tarjeta || 0;
      mixto += order.total; // También guardamos el total de órdenes mixtas
    } else {
      // Para pagos normales
      switch (order.paymentMethod) {
        case 'EFECTIVO':
          efectivo += order.total;
          break;
        case 'YAPE/PLIN':
          yapePlin += order.total;
          break;
        case 'TARJETA':
          tarjeta += order.total;
          break;
        default:
          noAplica += order.total;
      }
    }
  });

  const efectivoPct = totalVentas > 0 ? (efectivo / totalVentas) * 100 : 0;
  const yapePlinPct = totalVentas > 0 ? (yapePlin / totalVentas) * 100 : 0;
  const tarjetaPct = totalVentas > 0 ? (tarjeta / totalVentas) * 100 : 0;
  const mixtoPct = totalVentas > 0 ? (mixto / totalVentas) * 100 : 0;

  const ventasPorDia = new Map<string, number>();
  orders.forEach(order => {
    const date = formatDateForDisplay(order.createdAt);
    ventasPorDia.set(date, (ventasPorDia.get(date) || 0) + order.total);
  });

  let mejorDia = { fecha: '', total: 0 };
  ventasPorDia.forEach((total, fecha) => {
    if (total > mejorDia.total) {
      mejorDia = { fecha, total };
    }
  });

  return [
    ['REPORTE DE VENTAS', ''],
    ['Período', `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    ['Fecha de generación', new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })],
    ['', ''],
    ['ESTADISTICAS GENERALES', ''],
    ['Total de Órdenes', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['VENTAS POR METODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${efectivo.toFixed(2)}`, `${efectivoPct.toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${yapePlin.toFixed(2)}`, `${yapePlinPct.toFixed(1)}%`],
    ['TARJETA', `S/ ${tarjeta.toFixed(2)}`, `${tarjetaPct.toFixed(1)}%`],
    ['MIXTO', `S/ ${mixto.toFixed(2)}`, `${mixtoPct.toFixed(1)}%`],
    ['NO APLICA', `S/ ${noAplica.toFixed(2)}`],
    ['', ''],
    ['ESTADISTICAS DESTACADAS', ''],
    ['Día con más ventas', mejorDia.fecha, `S/ ${mejorDia.total.toFixed(2)}`],
    ['Promedio diario', `S/ ${(totalVentas / (ventasPorDia.size || 1)).toFixed(2)}`]
  ];
};

/**
 * Genera los datos para la hoja de desglose diario (cálculo en vivo) - CON PAGO MIXTO
 */
const generateDiarioSheet = (orders: Order[], startDate: Date, endDate: Date): DailySummary[] => {
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
      mixto: 0,
      noAplica: 0,
      total: 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  orders.forEach(order => {
    const dateStr = formatDateForDisplay(order.createdAt);
    const day = dailyMap.get(dateStr);
    
    if (day) {
      day.orders++;
      day.total += order.total;

      if (order.paymentMethod === 'MIXTO' && order.splitPayment) {
        // Para pagos mixtos, sumamos cada parte a su método correspondiente
        day.efectivo += order.splitPayment.efectivo || 0;
        day.yapePlin += order.splitPayment.yapePlin || 0;
        day.tarjeta += order.splitPayment.tarjeta || 0;
        day.mixto += order.total; // También guardamos el total de órdenes mixtas
      } else {
        switch (order.paymentMethod) {
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
    }
  });

  return Array.from(dailyMap.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
};

// ============================================
// FUNCIÓN PRINCIPAL DE EXPORTACIÓN
// ============================================

/**
 * Exporta órdenes por rango de fechas - USA DATOS DE CIERRE SI EXISTEN
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
          { v: 'MIXTO', position: 'F1' },
          { v: 'NO APLICA', position: 'G1' },
          { v: 'TOTAL DIA', position: 'H1' }
        ];
        
        diarioHeaders.forEach(h => {
          const cell = wsDiario[h.position as keyof typeof wsDiario];
          if (cell) cell.v = h.v;
        });

        wsDiario['!cols'] = [
          { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, 
          { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

        // HOJA 3: TOP 5 PRODUCTOS (DATOS DEL CIERRE)
        const topProducts = (closure.top_products || []).slice(0, 5).map((p: any) => ({
          name: p.name || 'Producto',
          quantity: p.quantity || 0,
          total: `S/ ${(p.total || 0).toFixed(2)}`,
          category: p.category || 'Sin categoría'
        }));
        const wsProductos = XLSX.utils.json_to_sheet(topProducts);
        XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

        // HOJA 4: DETALLE ACTUAL (con TODOS los productos - SIN CATEGORÍA)
        const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          const orderDay = formatDateForDisplay(orderDate);
          const startDay = formatDateForDisplay(startOfDay);
          const endDay = formatDateForDisplay(endOfDay);
          return orderDay >= startDay && orderDay <= endDay;
        });

        console.log(`📊 Órdenes filtradas para detalle: ${filteredOrders.length}`);

        if (filteredOrders.length > 0) {
          // Usar el mismo formato que exportOrdersToExcel para consistencia - SIN CATEGORÍA
          const detalleData = filteredOrders.map(order => {
            const fecha = formatDateForDisplay(order.createdAt);
            const hora = formatTimeForDisplay(order.createdAt);

            // Formatear método de pago con detalle si es mixto
            let metodoPago = order.paymentMethod || 'NO APLICA';
            if (order.paymentMethod === 'MIXTO' && order.splitPayment) {
              const { efectivo, yapePlin, tarjeta } = order.splitPayment;
              metodoPago = `MIXTO (EFECTIVO: S/ ${efectivo.toFixed(2)}, YAPE: S/ ${yapePlin.toFixed(2)}, TARJETA: S/ ${tarjeta.toFixed(2)})`;
            }

            // Formatear TODOS los productos - SIN CATEGORÍA
            let productosTexto = '';
            if (order.items && order.items.length > 0) {
              productosTexto = order.items.map((item, idx) => {
                const nombre = item.menuItem?.name || 'Producto';
                const cantidad = item.quantity || 0;
                const notas = item.notes ? ` (${item.notes})` : '';
                const subtotal = ((item.menuItem?.price || 0) * cantidad).toFixed(2);
                
                return `${idx + 1}. ${cantidad}x ${nombre}${notas} - S/ ${subtotal}`;
              }).join(' | ');
            } else {
              productosTexto = 'Sin productos';
            }

            return {
              'FECHA': fecha,
              'HORA': hora,
              'N° ORDEN': order.orderNumber || `ORD-${order.id.slice(-8)}`,
              'CLIENTE': order.customerName?.toUpperCase() || '',
              'TELÉFONO': order.phone || '',
              'MONTO': `S/ ${order.total.toFixed(2)}`,
              'MÉTODO PAGO': metodoPago,
              'PRODUCTOS': productosTexto,
              'CANTIDAD': order.items.length
            };
          });
          
          const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
          wsDetalle['!cols'] = [
            { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 25 }, 
            { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 120 }, { wch: 8 }
          ];
          XLSX.utils.book_append_sheet(wb, wsDetalle, 'DETALLE');
        }

        // HOJA 5: NOTA INFORMATIVA
        const notaData = [
          ['NOTA IMPORTANTE:'],
          ['Los totales de este reporte corresponden al CIERRE DE CAJA #' + closure.closure_number],
          ['Fecha del cierre: ' + new Date(closure.closed_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })],
          ['']
        ];
        
        if (closure.total_amount !== orders.reduce((sum, o) => sum + o.total, 0)) {
          notaData.push(['⚠️ Hay diferencia con las órdenes actuales!']);
          notaData.push(['Total del cierre: S/ ' + closure.total_amount.toFixed(2)]);
          notaData.push(['Total actual: S/ ' + orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)]);
        }
        
        const wsNota = XLSX.utils.aoa_to_sheet(notaData);
        XLSX.utils.book_append_sheet(wb, wsNota, 'INFORMACION');

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
      return;
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

  console.log(`📊 Generando reporte con ${filteredOrders.length} órdenes`);

  const wb = XLSX.utils.book_new();

  // HOJA 1: RESUMEN GENERAL (con pagos mixtos)
  const resumenData = generateResumenSheet(filteredOrders, startDate, endDate);
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

  // HOJA 2: DESGLOSE DIARIO (con pagos mixtos)
  const diarioData = generateDiarioSheet(filteredOrders, startDate, endDate);
  const wsDiario = XLSX.utils.json_to_sheet(diarioData);
  
  const diarioHeaders = [
    { v: 'FECHA', position: 'A1' },
    { v: 'ORDENES', position: 'B1' },
    { v: 'EFECTIVO', position: 'C1' },
    { v: 'YAPE/PLIN', position: 'D1' },
    { v: 'TARJETA', position: 'E1' },
    { v: 'MIXTO', position: 'F1' },
    { v: 'NO APLICA', position: 'G1' },
    { v: 'TOTAL DIA', position: 'H1' }
  ];
  
  diarioHeaders.forEach(h => {
    const cell = wsDiario[h.position as keyof typeof wsDiario];
    if (cell) cell.v = h.v;
  });

  wsDiario['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

  // HOJA 3: TOP 5 PRODUCTOS
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  
  filteredOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const existing = productMap.get(item.menuItem.id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.menuItem.price * item.quantity;
        } else {
          productMap.set(item.menuItem.id, {
            name: item.menuItem.name,
            quantity: item.quantity,
            total: item.menuItem.price * item.quantity
          });
        }
      });
    }
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      quantity: p.quantity,
      total: `S/ ${p.total.toFixed(2)}`
    }));

  const wsProductos = XLSX.utils.json_to_sheet(topProducts);
  XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

  // HOJA 4: DETALLE COMPLETO (con TODOS los productos - SIN CATEGORÍA)
  const detalleData = filteredOrders.map(order => {
    const fecha = formatDateForDisplay(order.createdAt);
    const hora = formatTimeForDisplay(order.createdAt);

    // Formatear método de pago con detalle si es mixto
    let metodoPago = order.paymentMethod || 'NO APLICA';
    if (order.paymentMethod === 'MIXTO' && order.splitPayment) {
      const { efectivo, yapePlin, tarjeta } = order.splitPayment;
      metodoPago = `MIXTO (EFECTIVO: S/ ${efectivo.toFixed(2)}, YAPE: S/ ${yapePlin.toFixed(2)}, TARJETA: S/ ${tarjeta.toFixed(2)})`;
    }

    // Formatear TODOS los productos - SIN CATEGORÍA
    let productosTexto = '';
    if (order.items && order.items.length > 0) {
      productosTexto = order.items.map((item, idx) => {
        const nombre = item.menuItem?.name || 'Producto';
        const cantidad = item.quantity || 0;
        const notas = item.notes ? ` (${item.notes})` : '';
        const subtotal = ((item.menuItem?.price || 0) * cantidad).toFixed(2);
        
        return `${idx + 1}. ${cantidad}x ${nombre}${notas} - S/ ${subtotal}`;
      }).join(' | ');
    } else {
      productosTexto = 'Sin productos';
    }

    return {
      'FECHA': fecha,
      'HORA': hora,
      'N° ORDEN': order.orderNumber || `ORD-${order.id.slice(-8)}`,
      'CLIENTE': order.customerName?.toUpperCase() || '',
      'TELÉFONO': order.phone || '',
      'MONTO': `S/ ${order.total.toFixed(2)}`,
      'MÉTODO PAGO': metodoPago,
      'PRODUCTOS': productosTexto,
      'CANTIDAD': order.items.length
    };
  });

  const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
  wsDetalle['!cols'] = [
    { wch: 12 },  // FECHA
    { wch: 8 },   // HORA
    { wch: 15 },  // N° ORDEN
    { wch: 25 },  // CLIENTE
    { wch: 15 },  // TELÉFONO
    { wch: 12 },  // MONTO
    { wch: 35 },  // MÉTODO PAGO
    { wch: 120 }, // PRODUCTOS (ancho suficiente)
    { wch: 8 }    // CANTIDAD
  ];
  
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'DETALLE');

  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `ventas_${startStr}_al_${endStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
  console.log('✅ Reporte generado:', fileName);
};

// ============================================
// FUNCIONES DE EXPORTACIÓN SIMPLES
// ============================================

/**
 * Exporta órdenes a Excel con formato profesional - VERSIÓN CORREGIDA PARA EXCEL HOY (SIN CATEGORÍA)
 */
export const exportOrdersToExcel = (orders: Order[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) {
    alert('No hay órdenes para exportar');
    return;
  }

  console.log(`📊 Exportando ${orders.length} órdenes a Excel (formato simple)`);

  const data = orders.map(order => {
    const fecha = formatDateForDisplay(order.createdAt);
    const hora = formatTimeForDisplay(order.createdAt);

    // Formatear método de pago con detalle
    let metodoPago = order.paymentMethod || 'NO APLICA';
    if (order.paymentMethod === 'MIXTO' && order.splitPayment) {
      const { efectivo, yapePlin, tarjeta } = order.splitPayment;
      metodoPago = `MIXTO (EFECTIVO: S/ ${efectivo.toFixed(2)}, YAPE: S/ ${yapePlin.toFixed(2)}, TARJETA: S/ ${tarjeta.toFixed(2)})`;
    }

    // Formatear TODOS los productos - SIN CATEGORÍA
    let productosTexto = '';
    if (order.items && order.items.length > 0) {
      productosTexto = order.items.map((item, idx) => {
        const nombre = item.menuItem?.name || 'Producto';
        const cantidad = item.quantity || 0;
        const notas = item.notes ? ` (${item.notes})` : '';
        const subtotal = ((item.menuItem?.price || 0) * cantidad).toFixed(2);
        
        return `${idx + 1}. ${cantidad}x ${nombre}${notas} - S/ ${subtotal}`;
      }).join(' | ');
    } else {
      productosTexto = 'Sin productos';
    }

    return {
      'CLIENTE': order.customerName?.toUpperCase() || 'SIN NOMBRE',
      'MONTO TOTAL': `S/ ${(order.total || 0).toFixed(2)}`,
      'MÉTODO PAGO': metodoPago,
      'FECHA': fecha,
      'HORA': hora,
      'N° ORDEN': order.orderNumber || `ORD-${order.id.slice(-8)}`,
      'TELÉFONO': order.phone || '',
      'PRODUCTOS': productosTexto,
      'CANT. PRODUCTOS': order.items?.length || 0
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 25 },  // CLIENTE
    { wch: 12 },  // MONTO TOTAL
    { wch: 40 },  // MÉTODO PAGO
    { wch: 12 },  // FECHA
    { wch: 10 },  // HORA
    { wch: 15 },  // N° ORDEN
    { wch: 15 },  // TELÉFONO
    { wch: 120 }, // PRODUCTOS (ancho suficiente)
    { wch: 10 }   // CANT. PRODUCTOS
  ];

  const nombreHoja = tipo === 'today' ? 'Ventas del Día' : 'Todas las Ventas';
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

  const fecha = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' }).replace(/\//g, '-');
  const tipoTexto = tipo === 'today' ? 'diarias' : 'totales';
  const fileName = `ventas_${tipoTexto}_${fecha}.xlsx`;

  XLSX.writeFile(wb, fileName);
  console.log('✅ Excel generado:', fileName);
};

/**
 * Exporta un cierre específico a Excel
 */
export const exportClosureToExcel = async (closureId: string) => {
  try {
    const { data: closure, error } = await supabase
      .from('sales_closures')
      .select('*')
      .eq('id', closureId)
      .single();

    if (error) throw error;
    if (!closure) {
      alert('No se encontró el cierre');
      return;
    }

    const wb = XLSX.utils.book_new();

    const startDate = new Date(closure.opened_at);
    const endDate = new Date(closure.closed_at);
    const resumenData = generateResumenSheetFromClosure(closure, startDate, endDate);
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

    const diarioData = generateDiarioSheetFromClosure(closure);
    const wsDiario = XLSX.utils.json_to_sheet(diarioData);
    XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

    const topProducts = (closure.top_products || []).slice(0, 5).map((p: any) => ({
      name: p.name || 'Producto',
      quantity: p.quantity || 0,
      total: `S/ ${(p.total || 0).toFixed(2)}`,
      category: p.category || 'Sin categoría'
    }));
    const wsProductos = XLSX.utils.json_to_sheet(topProducts);
    XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

    const fileName = `cierre_${closure.closure_number}.xlsx`;
    XLSX.writeFile(wb, fileName);

  } catch (error: any) {
    console.error('Error exporting closure:', error);
    alert('Error al exportar cierre: ' + error.message);
  }
};