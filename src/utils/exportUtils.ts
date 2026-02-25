// ============================================
// ARCHIVO: src/utils/exportUtils.ts
// ============================================

import * as XLSX from 'xlsx';
import { Order } from '../types';
import { SalesClosure } from '../types/sales';
import { supabase } from '../lib/supabase';

/**
 * Formatea una fecha para mostrar en Excel
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Formatea hora para mostrar en Excel
 */
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Interfaz para el resumen diario (simplificada)
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
  
  // Verificar si existe daily_breakdown y es un array
  const dailyBreakdown = (closure as any).daily_breakdown;
  if (dailyBreakdown && Array.isArray(dailyBreakdown) && dailyBreakdown.length > 0) {
    dailyBreakdown.forEach((day: any) => {
      if (day.total && day.total > mejorDia.total) {
        mejorDia = { fecha: day.date || '', total: day.total };
      }
    });
  }

  return [
    ['📊 REPORTE DE VENTAS (DATOS DE CIERRE)', ''],
    ['Período', `${formatDate(startDate)} al ${formatDate(endDate)}`],
    ['Fecha de generación', new Date().toLocaleString('es-PE')],
    ['N° de Cierre', closure.closure_number],
    ['', ''],
    ['📈 ESTADÍSTICAS GENERALES', ''],
    ['Total de Órdenes', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['💰 VENTAS POR MÉTODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${closure.total_efectivo.toFixed(2)}`, `${((closure.total_efectivo / totalVentas) * 100).toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${closure.total_yape_plin.toFixed(2)}`, `${((closure.total_yape_plin / totalVentas) * 100).toFixed(1)}%`],
    ['TARJETA', `S/ ${closure.total_tarjeta.toFixed(2)}`, `${((closure.total_tarjeta / totalVentas) * 100).toFixed(1)}%`],
    ['NO APLICA', `S/ ${closure.total_no_aplica.toFixed(2)}`],
    ['', ''],
    ['🏆 ESTADÍSTICAS DESTACADAS', ''],
    ['Día con más ventas', mejorDia.fecha || 'N/A', mejorDia.total > 0 ? `S/ ${mejorDia.total.toFixed(2)}` : ''],
    ['Promedio diario', `S/ ${(totalVentas / (totalOrders || 1)).toFixed(2)}`]
  ];
};

/**
 * Genera hoja de desglose diario a partir de un cierre guardado
 */
const generateDiarioSheetFromClosure = (closure: SalesClosure): DailySummary[] => {
  const result: DailySummary[] = [];
  
  // Verificar si existe daily_breakdown y es un array
  const dailyBreakdown = (closure as any).daily_breakdown;
  if (dailyBreakdown && Array.isArray(dailyBreakdown) && dailyBreakdown.length > 0) {
    // Mapear solo los campos que necesitamos
    dailyBreakdown.forEach((day: any) => {
      result.push({
        date: day.date || formatDate(new Date(closure.closure_date)),
        orders: day.orders || 0,
        efectivo: day.efectivo || 0,
        yapePlin: day.yapePlin || 0,
        tarjeta: day.tarjeta || 0,
        noAplica: day.noAplica || 0,
        total: day.total || 0
      });
    });
  } else {
    // Si no hay desglose guardado, crear un solo día con los totales
    result.push({
      date: formatDate(new Date(closure.closure_date)),
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
    // Limitar a TOP 5 productos
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
 * Genera hoja de detalle a partir de órdenes
 */
const generateDetalleSheetFromOrders = (orders: Order[]): any[] => {
  return orders.map(order => ({
    'FECHA': formatDate(order.createdAt),
    'HORA': formatTime(order.createdAt),
    'N° ORDEN': order.orderNumber || `ORD-${order.id.slice(-8)}`,
    'CLIENTE': order.customerName.toUpperCase(),
    'TELÉFONO': order.phone,
    'MONTO': `S/ ${order.total.toFixed(2)}`,
    'MÉTODO': order.paymentMethod || 'NO APLICA',
    'PRODUCTOS': order.items.map(item => 
      `${item.quantity}x ${item.menuItem.name}`
    ).join('\n')
  }));
};

/**
 * Exporta órdenes por rango de fechas
 */
export const exportOrdersByDateRange = async (
  orders: Order[], 
  startDate: Date, 
  endDate: Date
) => {
  // Verificar si existe un cierre para este rango de fechas
  try {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const { data: closures, error } = await supabase
      .from('sales_closures')
      .select('*')
      .gte('closure_date', startStr)
      .lte('closure_date', endStr)
      .order('closure_date', { ascending: true });

    if (error) throw error;

    // Si encontramos cierres, usamos esos datos
    if (closures && closures.length > 0) {
      console.log('📊 Usando datos de cierre guardados para el reporte');
      
      // Crear libro de Excel
      const wb = XLSX.utils.book_new();

      // Para múltiples cierres, combinamos la información
      if (closures.length === 1) {
        // Un solo cierre - usar todos sus datos
        const closure = closures[0] as SalesClosure;
        
        // HOJA 1: RESUMEN GENERAL
        const resumenData = generateResumenSheetFromClosure(closure, startDate, endDate);
        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

        // HOJA 2: DESGLOSE DIARIO
        const diarioData = generateDiarioSheetFromClosure(closure);
        const wsDiario = XLSX.utils.json_to_sheet(diarioData);
        
        // Renombrar headers
        const diarioHeaders = [
          { v: 'FECHA', position: 'A1' },
          { v: 'ÓRDENES', position: 'B1' },
          { v: 'EFECTIVO', position: 'C1' },
          { v: 'YAPE/PLIN', position: 'D1' },
          { v: 'TARJETA', position: 'E1' },
          { v: 'NO APLICA', position: 'F1' },
          { v: 'TOTAL DÍA', position: 'G1' }
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
        const topProducts = generateTopProductsFromClosure(closure);
        const wsProductos = XLSX.utils.json_to_sheet(topProducts);

        const productHeaders = [
          { v: 'PRODUCTO', position: 'A1' },
          { v: 'CANTIDAD', position: 'B1' },
          { v: 'TOTAL VENDIDO', position: 'C1' },
          { v: 'CATEGORÍA', position: 'D1' }
        ];

        productHeaders.forEach(h => {
          const cell = wsProductos[h.position as keyof typeof wsProductos];
          if (cell) cell.v = h.v;
        });

        wsProductos['!cols'] = [{ wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

      } else {
        // Múltiples cierres - crear un resumen combinado
        const combinedResumen = generateCombinedResumen(closures as SalesClosure[], startDate, endDate);
        const wsResumen = XLSX.utils.aoa_to_sheet(combinedResumen);
        wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

        // Desglose diario combinado de todos los cierres
        const allDailyBreakdown: DailySummary[] = [];
        closures.forEach(closure => {
          const c = closure as SalesClosure;
          const dailyFromClosure = generateDiarioSheetFromClosure(c);
          allDailyBreakdown.push(...dailyFromClosure);
        });

        const wsDiario = XLSX.utils.json_to_sheet(allDailyBreakdown.sort((a, b) => a.date.localeCompare(b.date)));
        XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

        // Top 5 productos combinados
        const combinedProducts = combineTopProducts(closures as SalesClosure[]).slice(0, 5);
        const wsProductos = XLSX.utils.json_to_sheet(combinedProducts);
        XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');
      }

      // HOJA 4: DETALLE COMPLETO
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      });

      if (filteredOrders.length > 0) {
        const detalleData = generateDetalleSheetFromOrders(filteredOrders);
        const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
        wsDetalle['!cols'] = [
          { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 25 },
          { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 50 }
        ];
        XLSX.utils.book_append_sheet(wb, wsDetalle, 'DETALLE');
      }

      // Generar nombre del archivo
      const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
      const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `ventas_${startStr}_al_${endStr}_CON_CORTE.xlsx`;

      // Guardar archivo
      XLSX.writeFile(wb, fileName);
      return;
    }
  } catch (error) {
    console.error('Error al buscar cierres, usando datos en vivo:', error);
  }

  // Si no hay cierres, usar el método tradicional
  console.log('📊 No se encontraron cierres, usando cálculo en vivo');
  
  // Filtrar órdenes por rango de fechas
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return orderDate >= start && orderDate <= end;
  });

  if (filteredOrders.length === 0) {
    alert('No hay órdenes en el rango de fechas seleccionado');
    return;
  }

  // Crear libro de Excel
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
    { v: 'ÓRDENES', position: 'B1' },
    { v: 'EFECTIVO', position: 'C1' },
    { v: 'YAPE/PLIN', position: 'D1' },
    { v: 'TARJETA', position: 'E1' },
    { v: 'NO APLICA', position: 'F1' },
    { v: 'TOTAL DÍA', position: 'G1' }
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
    { v: 'CATEGORÍA', position: 'D1' }
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

  // Generar nombre del archivo
  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `ventas_${startStr}_al_${endStr}.xlsx`;

  // Guardar archivo
  XLSX.writeFile(wb, fileName);
};

/**
 * Genera los datos para la hoja de resumen (cálculo en vivo)
 */
const generateResumenSheet = (orders: Order[], startDate: Date, endDate: Date): any[][] => {
  const totalOrders = orders.length;
  const totalVentas = orders.reduce((sum, o) => sum + o.total, 0);

  const efectivo = orders.filter(o => o.paymentMethod === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0);
  const yapePlin = orders.filter(o => o.paymentMethod === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0);
  const tarjeta = orders.filter(o => o.paymentMethod === 'TARJETA').reduce((sum, o) => sum + o.total, 0);
  const noAplica = orders.filter(o => !o.paymentMethod).reduce((sum, o) => sum + o.total, 0);

  const efectivoPct = totalVentas > 0 ? (efectivo / totalVentas) * 100 : 0;
  const yapePlinPct = totalVentas > 0 ? (yapePlin / totalVentas) * 100 : 0;
  const tarjetaPct = totalVentas > 0 ? (tarjeta / totalVentas) * 100 : 0;

  const ventasPorDia = new Map<string, number>();
  orders.forEach(order => {
    const date = formatDate(order.createdAt);
    ventasPorDia.set(date, (ventasPorDia.get(date) || 0) + order.total);
  });

  let mejorDia = { fecha: '', total: 0 };
  ventasPorDia.forEach((total, fecha) => {
    if (total > mejorDia.total) {
      mejorDia = { fecha, total };
    }
  });

  return [
    ['📊 REPORTE DE VENTAS', ''],
    ['Período', `${formatDate(startDate)} al ${formatDate(endDate)}`],
    ['Fecha de generación', new Date().toLocaleString('es-PE')],
    ['', ''],
    ['📈 ESTADÍSTICAS GENERALES', ''],
    ['Total de Órdenes', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['💰 VENTAS POR MÉTODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${efectivo.toFixed(2)}`, `${efectivoPct.toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${yapePlin.toFixed(2)}`, `${yapePlinPct.toFixed(1)}%`],
    ['TARJETA', `S/ ${tarjeta.toFixed(2)}`, `${tarjetaPct.toFixed(1)}%`],
    ['NO APLICA', `S/ ${noAplica.toFixed(2)}`],
    ['', ''],
    ['🏆 ESTADÍSTICAS DESTACADAS', ''],
    ['Día con más ventas', mejorDia.fecha, `S/ ${mejorDia.total.toFixed(2)}`],
    ['Promedio diario', `S/ ${(totalVentas / (ventasPorDia.size || 1)).toFixed(2)}`]
  ];
};

/**
 * Genera los datos para la hoja de desglose diario (cálculo en vivo)
 */
const generateDiarioSheet = (orders: Order[], startDate: Date, endDate: Date): DailySummary[] => {
  const dailyMap = new Map<string, DailySummary>();

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
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

  orders.forEach(order => {
    const dateStr = formatDate(order.createdAt);
    const day = dailyMap.get(dateStr);
    
    if (day) {
      day.orders++;
      day.total += order.total;

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
  });

  return Array.from(dailyMap.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
};

/**
 * Genera el top de productos más vendidos
 */
const generateTopProducts = (orders: Order[]): any[] => {
  const productMap = new Map<string, ProductSummary>();

  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.menuItem.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += item.menuItem.price * item.quantity;
      } else {
        productMap.set(item.menuItem.id, {
          id: item.menuItem.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          total: item.menuItem.price * item.quantity,
          category: item.menuItem.category
        });
      }
    });
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

/**
 * Funciones auxiliares para combinar múltiples cierres
 */
const generateCombinedResumen = (closures: SalesClosure[], startDate: Date, endDate: Date): any[][] => {
  const totalOrders = closures.reduce((sum, c) => sum + c.total_orders, 0);
  const totalVentas = closures.reduce((sum, c) => sum + c.total_amount, 0);

  const totalEfectivo = closures.reduce((sum, c) => sum + c.total_efectivo, 0);
  const totalYapePlin = closures.reduce((sum, c) => sum + c.total_yape_plin, 0);
  const totalTarjeta = closures.reduce((sum, c) => sum + c.total_tarjeta, 0);
  const totalNoAplica = closures.reduce((sum, c) => sum + c.total_no_aplica, 0);

  const efectivoPct = totalVentas > 0 ? (totalEfectivo / totalVentas) * 100 : 0;
  const yapePlinPct = totalVentas > 0 ? (totalYapePlin / totalVentas) * 100 : 0;
  const tarjetaPct = totalVentas > 0 ? (totalTarjeta / totalVentas) * 100 : 0;

  return [
    ['📊 REPORTE DE VENTAS COMBINADO (MÚLTIPLES CIERRES)', ''],
    ['Período', `${formatDate(startDate)} al ${formatDate(endDate)}`],
    ['Fecha de generación', new Date().toLocaleString('es-PE')],
    ['Cantidad de cierres', closures.length],
    ['', ''],
    ['📈 ESTADÍSTICAS GENERALES', ''],
    ['Total de Órdenes', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['💰 VENTAS POR MÉTODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`, `${efectivoPct.toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${totalYapePlin.toFixed(2)}`, `${yapePlinPct.toFixed(1)}%`],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`, `${tarjetaPct.toFixed(1)}%`],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`]
  ];
};

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

/**
 * Exporta órdenes a Excel con formato profesional
 */
export const exportOrdersToExcel = (orders: Order[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) {
    alert('No hay órdenes para exportar');
    return;
  }

  const data = orders.map(order => {
    const fecha = order.createdAt.toLocaleDateString('es-PE');
    const hora = order.createdAt.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const productosList = order.items.map(item => 
      `${item.quantity}x ${item.menuItem.name}`
    ).join('\n');

    return {
      'CLIENTE': order.customerName.toUpperCase(),
      'MONTO TOTAL': `S/ ${order.total.toFixed(2)}`,
      'MÉTODO PAGO': order.paymentMethod || 'NO APLICA',
      'FECHA': fecha,
      'HORA': hora,
      'N° ORDEN': order.orderNumber || `ORD-${order.id.slice(-8)}`,
      'TELÉFONO': order.phone,
      'PRODUCTOS': productosList
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 25 }, { wch: 12 }, { wch: 12 }, 
    { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
  ];

  const nombreHoja = tipo === 'today' ? 'Ventas del Día' : 'Todas las Ventas';
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

  const fecha = new Date().toISOString().split('T')[0];
  const tipoTexto = tipo === 'today' ? 'diarias' : 'totales';
  const fileName = `ventas_${tipoTexto}_${fecha}.xlsx`;

  XLSX.writeFile(wb, fileName);
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

    // HOJA 1: RESUMEN
    const startDate = new Date(closure.opened_at);
    const endDate = new Date(closure.closed_at);
    const resumenData = generateResumenSheetFromClosure(closure, startDate, endDate);
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

    // HOJA 2: DESGLOSE DIARIO
    const diarioData = generateDiarioSheetFromClosure(closure);
    const wsDiario = XLSX.utils.json_to_sheet(diarioData);
    XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

    // HOJA 3: TOP 5 PRODUCTOS
    const topProducts = generateTopProductsFromClosure(closure);
    const wsProductos = XLSX.utils.json_to_sheet(topProducts);
    XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

    // Guardar archivo
    const fileName = `cierre_${closure.closure_number}.xlsx`;
    XLSX.writeFile(wb, fileName);

  } catch (error: any) {
    console.error('Error exporting closure:', error);
    alert('Error al exportar cierre: ' + error.message);
  }
};
