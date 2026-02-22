// ============================================
// ARCHIVO: src/utils/exportUtils.ts
// VERSIÓN MEJORADA: Exportación por rango de fechas
// ============================================

import * as XLSX from 'xlsx';
import { Order } from '../types';

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
  phone: number;
  walkIn: number;
  delivery: number;
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
 * Exporta órdenes por rango de fechas con múltiples hojas
 */
export const exportOrdersByDateRange = (
  orders: Order[], 
  startDate: Date, 
  endDate: Date
) => {
  if (orders.length === 0) {
    alert('No hay órdenes para exportar en el rango seleccionado');
    return;
  }

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

  console.log(`📊 Exportando ${filteredOrders.length} órdenes del ${formatDate(startDate)} al ${formatDate(endDate)}`);

  // Crear libro de Excel
  const wb = XLSX.utils.book_new();

  // ============================================
  // HOJA 1: RESUMEN GENERAL
  // ============================================
  const resumenData = generateResumenSheet(filteredOrders, startDate, endDate);
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');

  // ============================================
  // HOJA 2: DESGLOSE DIARIO
  // ============================================
  const diarioData = generateDiarioSheet(filteredOrders, startDate, endDate);
  const wsDiario = XLSX.utils.json_to_sheet(diarioData, { 
    header: ['date', 'orders', 'efectivo', 'yapePlin', 'tarjeta', 'noAplica', 'total', 'phone', 'walkIn', 'delivery']
  });
  
  // Renombrar headers para mejor legibilidad
  const diarioHeaders = [
    { v: 'FECHA', position: 'A1' },
    { v: 'ÓRDENES', position: 'B1' },
    { v: 'EFECTIVO', position: 'C1' },
    { v: 'YAPE/PLIN', position: 'D1' },
    { v: 'TARJETA', position: 'E1' },
    { v: 'NO APLICA', position: 'F1' },
    { v: 'TOTAL DÍA', position: 'G1' },
    { v: 'TELÉFONO', position: 'H1' },
    { v: 'LOCAL', position: 'I1' },
    { v: 'DELIVERY', position: 'J1' }
  ];
  
  diarioHeaders.forEach(h => {
    const cell = wsDiario[h.position as keyof typeof wsDiario];
    if (cell) {
      cell.v = h.v;
    }
  });

  wsDiario['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDiario, 'DIARIO');

  // ============================================
  // HOJA 3: TOP PRODUCTOS
  // ============================================
  const topProducts = generateTopProducts(filteredOrders);
  const wsProductos = XLSX.utils.json_to_sheet(topProducts, {
    header: ['name', 'quantity', 'total', 'category']
  });

  const productHeaders = [
    { v: 'PRODUCTO', position: 'A1' },
    { v: 'CANTIDAD', position: 'B1' },
    { v: 'TOTAL VENDIDO', position: 'C1' },
    { v: 'CATEGORÍA', position: 'D1' }
  ];

  productHeaders.forEach(h => {
    const cell = wsProductos[h.position as keyof typeof wsProductos];
    if (cell) {
      cell.v = h.v;
    }
  });

  wsProductos['!cols'] = [
    { wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsProductos, 'TOP PRODUCTOS');

  // ============================================
  // HOJA 4: DETALLE COMPLETO
  // ============================================
  const detalleData = filteredOrders.map(order => ({
    'FECHA': formatDate(order.createdAt),
    'HORA': formatTime(order.createdAt),
    'N° ORDEN': order.orderNumber || `ORD-${order.id.slice(-8)}`,
    'CLIENTE': order.customerName.toUpperCase(),
    'TELÉFONO': order.phone,
    'MONTO': `S/ ${order.total.toFixed(2)}`,
    'MÉTODO': order.paymentMethod || 'NO APLICA',
    'TIPO': order.source.type === 'phone' ? 'COCINA' : 
            order.source.type === 'walk-in' ? 'LOCAL' : 'DELIVERY',
    'PRODUCTOS': order.items.map(item => 
      `${item.quantity}x ${item.menuItem.name}`
    ).join('\n')
  }));

  const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
  wsDetalle['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 25 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 50 }
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
 * Genera los datos para la hoja de resumen
 */
const generateResumenSheet = (orders: Order[], startDate: Date, endDate: Date): any[][] => {
  const totalOrders = orders.length;
  const totalVentas = orders.reduce((sum, o) => sum + o.total, 0);
  const ticketPromedio = totalVentas / totalOrders;

  // Totales por método de pago
  const efectivo = orders
    .filter(o => o.paymentMethod === 'EFECTIVO')
    .reduce((sum, o) => sum + o.total, 0);
  
  const yapePlin = orders
    .filter(o => o.paymentMethod === 'YAPE/PLIN')
    .reduce((sum, o) => sum + o.total, 0);
  
  const tarjeta = orders
    .filter(o => o.paymentMethod === 'TARJETA')
    .reduce((sum, o) => sum + o.total, 0);
  
  const noAplica = orders
    .filter(o => !o.paymentMethod)
    .reduce((sum, o) => sum + o.total, 0);

  // Totales por tipo de pedido
  const phone = orders
    .filter(o => o.source.type === 'phone')
    .reduce((sum, o) => sum + o.total, 0);
  
  const walkIn = orders
    .filter(o => o.source.type === 'walk-in')
    .reduce((sum, o) => sum + o.total, 0);
  
  const delivery = orders
    .filter(o => o.source.type === 'delivery')
    .reduce((sum, o) => sum + o.total, 0);

  // Calcular porcentajes
  const efectivoPct = (efectivo / totalVentas) * 100;
  const yapePlinPct = (yapePlin / totalVentas) * 100;
  const tarjetaPct = (tarjeta / totalVentas) * 100;

  const phonePct = (phone / totalVentas) * 100;
  const walkInPct = (walkIn / totalVentas) * 100;
  const deliveryPct = (delivery / totalVentas) * 100;

  // Encontrar día con más ventas
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
    ['Total de Órdenes', totalOrders, ''],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`, ''],
    ['Ticket Promedio', `S/ ${ticketPromedio.toFixed(2)}`, ''],
    ['', ''],
    ['💰 VENTAS POR MÉTODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${efectivo.toFixed(2)}`, `${efectivoPct.toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${yapePlin.toFixed(2)}`, `${yapePlinPct.toFixed(1)}%`],
    ['TARJETA', `S/ ${tarjeta.toFixed(2)}`, `${tarjetaPct.toFixed(1)}%`],
    ['NO APLICA', `S/ ${noAplica.toFixed(2)}`, ''],
    ['', ''],
    ['📋 VENTAS POR TIPO DE PEDIDO', ''],
    ['COCINA (Teléfono)', `S/ ${phone.toFixed(2)}`, `${phonePct.toFixed(1)}%`],
    ['LOCAL (Presencial)', `S/ ${walkIn.toFixed(2)}`, `${walkInPct.toFixed(1)}%`],
    ['DELIVERY', `S/ ${delivery.toFixed(2)}`, `${deliveryPct.toFixed(1)}%`],
    ['', ''],
    ['🏆 ESTADÍSTICAS DESTACADAS', ''],
    ['Día con más ventas', mejorDia.fecha, `S/ ${mejorDia.total.toFixed(2)}`],
    ['Promedio diario', `S/ ${(totalVentas / ventasPorDia.size).toFixed(2)}`, '']
  ];
};

/**
 * Genera los datos para la hoja de desglose diario
 */
const generateDiarioSheet = (orders: Order[], startDate: Date, endDate: Date): DailySummary[] => {
  const dailyMap = new Map<string, DailySummary>();

  // Inicializar todos los días del rango
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
      total: 0,
      phone: 0,
      walkIn: 0,
      delivery: 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Acumular órdenes
  orders.forEach(order => {
    const dateStr = formatDate(order.createdAt);
    const day = dailyMap.get(dateStr);
    
    if (day) {
      day.orders++;
      day.total += order.total;

      // Por método de pago
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

      // Por tipo de pedido
      switch (order.source.type) {
        case 'phone':
          day.phone += order.total;
          break;
        case 'walk-in':
          day.walkIn += order.total;
          break;
        case 'delivery':
          day.delivery += order.total;
          break;
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
 * Exporta órdenes a Excel con formato profesional (mantener por compatibilidad)
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
      'TIPO': order.source.type === 'phone' ? 'COCINA' : 
              order.source.type === 'walk-in' ? 'LOCAL' : 'DELIVERY',
      'FECHA': fecha,
      'HORA': hora,
      'N° ORDEN': order.orderNumber || `ORD-${order.id.slice(-8)}`,
      'TELÉFONO': order.phone,
      'PRODUCTOS': productosList,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
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
 * Exporta órdenes a Excel con resumen (mantener por compatibilidad)
 */
export const exportOrdersWithSummary = (orders: Order[]) => {
  if (orders.length === 0) {
    alert('No hay órdenes para exportar');
    return;
  }

  // Calcular resúmenes por método de pago
  const totalEfectivo = orders
    .filter(o => o.paymentMethod === 'EFECTIVO')
    .reduce((sum, o) => sum + o.total, 0);
    
  const totalYapePlin = orders
    .filter(o => o.paymentMethod === 'YAPE/PLIN')
    .reduce((sum, o) => sum + o.total, 0);
    
  const totalTarjeta = orders
    .filter(o => o.paymentMethod === 'TARJETA')
    .reduce((sum, o) => sum + o.total, 0);
    
  const totalNoAplica = orders
    .filter(o => !o.paymentMethod)
    .reduce((sum, o) => sum + o.total, 0);

  const totalVentas = orders.reduce((sum, order) => sum + order.total, 0);
  const totalPedidos = orders.length;
  const promedio = totalVentas / totalPedidos;

  const wb = XLSX.utils.book_new();

  // Hoja de resumen
  const resumenData = [
    ['📊 REPORTE DE VENTAS COMPLETO', ''],
    ['Fecha', new Date().toLocaleDateString('es-PE')],
    ['Total Pedidos', totalPedidos],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['Promedio por Pedido', `S/ ${promedio.toFixed(2)}`],
    ['', ''],
    ['💰 VENTAS POR MÉTODO DE PAGO', ''],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`],
    ['YAPE/PLIN', `S/ ${totalYapePlin.toFixed(2)}`],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Hoja de detalle
  const detalleData = orders.map(order => ({
    'Cliente': order.customerName,
    'Monto': `S/ ${order.total.toFixed(2)}`,
    'Método': order.paymentMethod || 'NO APLICA',
    'Tipo': order.source.type === 'phone' ? 'COCINA' : 
            order.source.type === 'walk-in' ? 'LOCAL' : 'DELIVERY',
    'Fecha': order.createdAt.toLocaleDateString('es-PE'),
    'Hora': order.createdAt.toLocaleTimeString('es-PE'),
  }));

  const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `ventas_completo_${fecha}.xlsx`);
};