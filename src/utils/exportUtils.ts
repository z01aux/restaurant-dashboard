// ============================================
// ARCHIVO: src/utils/exportUtils.ts
// ============================================

import * as XLSX from 'xlsx';
import { Order } from '../types';

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
 * Exporta órdenes a Excel con resumen
 */
export const exportOrdersWithSummary = (orders: Order[]) => {
  if (orders.length === 0) {
    alert('No hay órdenes para exportar');
    return;
  }

  const totalVentas = orders.reduce((sum, order) => sum + order.total, 0);
  const totalPedidos = orders.length;
  const promedio = totalVentas / totalPedidos;

  const wb = XLSX.utils.book_new();

  // Hoja de resumen
  const resumenData = [
    ['📊 REPORTE DE VENTAS', ''],
    ['Fecha', new Date().toLocaleDateString('es-PE')],
    ['Total Pedidos', totalPedidos],
    ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
    ['Promedio por Pedido', `S/ ${promedio.toFixed(2)}`],
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
  }));

  const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `ventas_completo_${fecha}.xlsx`);
};