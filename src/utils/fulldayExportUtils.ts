// ============================================
// ARCHIVO: src/utils/fulldayExportUtils.ts
// Utilidades de exportación para FullDay
// ============================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../hooks/useFullDay';
import { FullDaySalesClosure } from '../hooks/useFullDaySalesClosure';
import { supabase } from '../lib/supabase';
import {
  getStartOfDay,
  getEndOfDay,
  formatDateForDisplay,
  formatTimeForDisplay,
  toLocalDateString
} from './dateUtils';

/**
 * Exporta pedidos FullDay por rango de fechas
 */
export const exportFullDayByDateRange = async (
  orders: FullDayOrder[],
  startDate: Date,
  endDate: Date
) => {
  console.log('🔍 FULLDAY - FECHAS RECIBIDAS:', {
    startDate: formatDateForDisplay(startDate),
    endDate: formatDateForDisplay(endDate)
  });

  const startOfDay = getStartOfDay(startDate);
  const endOfDay = getEndOfDay(endDate);

  // Buscar cierres de FullDay
  try {
    const startStr = toLocalDateString(startDate);
    const endStr = toLocalDateString(endDate);

    const { data: closures, error } = await supabase
      .from('sales_closures_fullday')
      .select('*')
      .gte('closure_date', startStr)
      .lte('closure_date', endStr)
      .order('closure_date', { ascending: true });

    if (error) throw error;

    if (closures && closures.length > 0) {
      console.log('📊 FULLDAY - Usando datos de cierre guardados');
      
      const wb = XLSX.utils.book_new();

      if (closures.length === 1) {
        const closure = closures[0];

        // HOJA 1: RESUMEN
        const resumenData = generateFullDayResumenFromClosure(closure, startDate, endDate);
        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

        // HOJA 2: TOP PRODUCTOS
        const topProducts = generateFullDayTopProductsFromClosure(closure);
        const wsProductos = XLSX.utils.json_to_sheet(topProducts);
        XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

        // HOJA 3: NOTA
        const notaData = [
          ['REPORTE DE CIERRE FULLDAY'],
          ['N° Cierre: ' + closure.closure_number],
          ['Total: S/ ' + closure.total_amount.toFixed(2)],
          ['Pedidos: ' + closure.total_orders]
        ];
        const wsNota = XLSX.utils.aoa_to_sheet(notaData);
        XLSX.utils.book_append_sheet(wb, wsNota, 'INFORMACION');

      } else {
        // Múltiples cierres
        const combinedResumen = generateCombinedFullDayResumen(closures, startDate, endDate);
        const wsResumen = XLSX.utils.aoa_to_sheet(combinedResumen);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');
      }

      const fileName = `fullday_${startStr}_al_${endStr}_CON_CORTE.xlsx`;
      XLSX.writeFile(wb, fileName);
      return;
    }
  } catch (error) {
    console.error('Error buscando cierres FullDay:', error);
  }

  // Si no hay cierres, usar datos en vivo
  console.log('📊 FULLDAY - Usando datos en vivo');
  
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const orderDay = formatDateForDisplay(orderDate);
    const startDay = formatDateForDisplay(startOfDay);
    const endDay = formatDateForDisplay(endOfDay);
    return orderDay >= startDay && orderDay <= endDay;
  });

  if (filteredOrders.length === 0) {
    alert('No hay pedidos FullDay en el rango seleccionado');
    return;
  }

  const wb = XLSX.utils.book_new();

  // HOJA 1: RESUMEN
  const resumenData = generateFullDayResumenLive(filteredOrders, startDate, endDate);
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

  // HOJA 2: TOP PRODUCTOS
  const topProducts = generateFullDayTopProductsLive(filteredOrders);
  const wsProductos = XLSX.utils.json_to_sheet(topProducts);
  XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP 5 PRODUCTOS');

  // HOJA 3: DETALLE
  const detalleData = filteredOrders.map(order => ({
    'FECHA': formatDateForDisplay(new Date(order.created_at)),
    'HORA': formatTimeForDisplay(new Date(order.created_at)),
    'ALUMNO': order.student_name,
    'GRADO': `${order.grade} "${order.section}"`,
    'APODERADO': order.guardian_name,
    'MONTO': `S/ ${order.total.toFixed(2)}`,
    'PAGO': order.payment_method || 'NO APLICA',
    'PRODUCTOS': order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
  }));

  const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'DETALLE');

  const fileName = `fullday_${toLocalDateString(startDate)}_al_${toLocalDateString(endDate)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Funciones auxiliares
const generateFullDayResumenFromClosure = (closure: any, startDate: Date, endDate: Date): any[][] => {
  return [
    ['REPORTE FULLDAY (DATOS DE CIERRE)', ''],
    ['Período', `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    ['N° Cierre', closure.closure_number],
    ['', ''],
    ['Total Pedidos', closure.total_orders],
    ['Total Ventas', `S/ ${closure.total_amount.toFixed(2)}`],
    ['', ''],
    ['EFECTIVO', `S/ ${closure.total_efectivo.toFixed(2)}`],
    ['YAPE/PLIN', `S/ ${closure.total_yape_plin.toFixed(2)}`],
    ['TARJETA', `S/ ${closure.total_tarjeta.toFixed(2)}`],
    ['NO APLICA', `S/ ${closure.total_no_aplica.toFixed(2)}`]
  ];
};

const generateFullDayTopProductsFromClosure = (closure: any): any[] => {
  if (closure.top_products && closure.top_products.length > 0) {
    return closure.top_products.slice(0, 5).map((p: any) => ({
      'PRODUCTO': p.name,
      'CANTIDAD': p.quantity,
      'TOTAL': `S/ ${p.total.toFixed(2)}`
    }));
  }
  return [];
};

const generateCombinedFullDayResumen = (closures: any[], startDate: Date, endDate: Date): any[][] => {
  const totalOrders = closures.reduce((sum, c) => sum + c.total_orders, 0);
  const totalVentas = closures.reduce((sum, c) => sum + c.total_amount, 0);
  const totalEfectivo = closures.reduce((sum, c) => sum + c.total_efectivo, 0);
  const totalYapePlin = closures.reduce((sum, c) => sum + c.total_yape_plin, 0);
  const totalTarjeta = closures.reduce((sum, c) => sum + c.total_tarjeta, 0);

  return [
    ['REPORTE FULLDAY COMBINADO', ''],
    ['Período', `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    ['Cantidad de cierres', closures.length],
    ['', ''],
    ['Total Pedidos', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`],
    ['YAPE/PLIN', `S/ ${totalYapePlin.toFixed(2)}`],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`]
  ];
};

const generateFullDayResumenLive = (orders: FullDayOrder[], startDate: Date, endDate: Date): any[][] => {
  const totalOrders = orders.length;
  const totalVentas = orders.reduce((sum, o) => sum + o.total, 0);
  const efectivo = orders.filter(o => o.payment_method === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0);
  const yapePlin = orders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0);
  const tarjeta = orders.filter(o => o.payment_method === 'TARJETA').reduce((sum, o) => sum + o.total, 0);

  return [
    ['REPORTE FULLDAY (EN VIVO)', ''],
    ['Período', `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    ['', ''],
    ['Total Pedidos', totalOrders],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['', ''],
    ['EFECTIVO', `S/ ${efectivo.toFixed(2)}`],
    ['YAPE/PLIN', `S/ ${yapePlin.toFixed(2)}`],
    ['TARJETA', `S/ ${tarjeta.toFixed(2)}`]
  ];
};

const generateFullDayTopProductsLive = (orders: FullDayOrder[]): any[] => {
  const productMap = new Map();
  
  orders.forEach(order => {
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

  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(p => ({
      'PRODUCTO': p.name,
      'CANTIDAD': p.quantity,
      'TOTAL': `S/ ${p.total.toFixed(2)}`
    }));
};