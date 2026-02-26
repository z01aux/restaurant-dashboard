// ============================================
// ARCHIVO: src/utils/fulldayAdminReport.ts
// Reporte administrativo de FullDay con formato profesional
// ============================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../hooks/useFullDay';
import { formatDateForDisplay } from './dateUtils';

interface GradeSectionGroup {
  grade: string;
  section: string;
  orders: FullDayOrder[];
  totalAmount: number;
  totalOrders: number;
}

export const exportAdminReportByGrade = (orders: FullDayOrder[], selectedDate: Date) => {
  console.log('📊 Generando reporte administrativo profesional...');
  
  // ============================================
  // 1. Agrupar pedidos por GRADO y SECCIÓN
  // ============================================
  const groups: Record<string, GradeSectionGroup> = {};

  orders.forEach(order => {
    const key = `${order.grade}-${order.section}`;
    
    if (!groups[key]) {
      groups[key] = {
        grade: order.grade,
        section: order.section,
        orders: [],
        totalAmount: 0,
        totalOrders: 0
      };
    }
    
    groups[key].orders.push(order);
    groups[key].totalAmount += order.total;
    groups[key].totalOrders += 1;
  });

  // Ordenar grados en orden lógico
  const gradeOrder = [
    'RED ROOM',
    'YELLOW ROOM',
    'GREEN ROOM',
    'PRIMERO DE PRIMARIA',
    'SEGUNDO DE PRIMARIA',
    'TERCERO DE PRIMARIA',
    'CUARTO DE PRIMARIA',
    'QUINTO DE PRIMARIA',
    'SEXTO DE PRIMARIA',
    'PRIMERO DE SECUNDARIA',
    'SEGUNDO DE SECUNDARIA',
    'TERCERO DE SECUNDARIA',
    'CUARTO DE SECUNDARIA',
    'QUINTO DE SECUNDARIA'
  ];

  const sortedGroups = Object.values(groups).sort((a, b) => {
    const gradeAIndex = gradeOrder.indexOf(a.grade);
    const gradeBIndex = gradeOrder.indexOf(b.grade);
    
    if (gradeAIndex === gradeBIndex) {
      return a.section.localeCompare(b.section);
    }
    return (gradeAIndex === -1 ? 999 : gradeAIndex) - (gradeBIndex === -1 ? 999 : gradeBIndex);
  });

  // ============================================
  // 2. Crear libro de Excel
  // ============================================
  const wb = XLSX.utils.book_new();
  const dateStr = formatDateForDisplay(selectedDate).replace(/\//g, '-');
  const totalGeneral = orders.reduce((sum, o) => sum + o.total, 0);

  // ============================================
  // HOJA 1: RESUMEN POR GRADO (Vista ejecutiva)
  // ============================================
  const summaryData: any[][] = [
    ['REPORTE ADMINISTRATIVO - FULLDAY'],
    ['Colegio San José y El Redentor'],
    [],
    [`FECHA: ${formatDateForDisplay(selectedDate)}`],
    [`TOTAL PEDIDOS: ${orders.length}`],
    [`TOTAL VENTAS: S/ ${totalGeneral.toFixed(2)}`],
    [],
    ['RESUMEN POR GRADO Y SECCIÓN'],
    ['GRADO', 'SECCIÓN', 'CANTIDAD DE PEDIDOS', 'TOTAL VENDIDO', '% DEL TOTAL']
  ];

  sortedGroups.forEach(group => {
    const porcentaje = totalGeneral > 0 ? ((group.totalAmount / totalGeneral) * 100).toFixed(1) : '0';
    summaryData.push([
      group.grade,
      group.section,
      group.totalOrders,
      `S/ ${group.totalAmount.toFixed(2)}`,
      `${porcentaje}%`
    ]);
  });

  // Totales generales con formato
  summaryData.push([]);
  summaryData.push([
    'TOTALES GENERALES',
    '',
    orders.length,
    `S/ ${totalGeneral.toFixed(2)}`,
    '100%'
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Ajustar ancho de columnas para mejor legibilidad
  wsSummary['!cols'] = [
    { wch: 30 }, // Grado
    { wch: 10 }, // Sección
    { wch: 18 }, // Cantidad
    { wch: 15 }, // Total
    { wch: 10 }  // Porcentaje
  ];
  
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 Resumen Ejecutivo');

  // ============================================
  // HOJA 2: DETALLE POR ALUMNO (organizado)
  // ============================================
  const detailData: any[][] = [
    ['DETALLE DE PEDIDOS POR ALUMNO'],
    [`Fecha: ${formatDateForDisplay(selectedDate)}`],
    [],
    ['GRADO', 'SECCIÓN', 'ALUMNO', 'APODERADO', 'TELÉFONO', 'MÉTODO DE PAGO', 'PRODUCTOS', 'TOTAL']
  ];

  sortedGroups.forEach(group => {
    // Separador visual de grado
    detailData.push([`════════════════════════════════════════════════════════════════════════`]);
    detailData.push([`📚 ${group.grade} - SECCIÓN "${group.section}"`]);
    detailData.push([`════════════════════════════════════════════════════════════════════════`]);
    
    // Ordenar alumnos alfabéticamente
    const sortedOrders = [...group.orders].sort((a, b) => 
      a.student_name.localeCompare(b.student_name)
    );
    
    sortedOrders.forEach(order => {
      const productos = order.items.map(item => 
        `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`
      ).join('\n');

      detailData.push([
        group.grade,
        group.section,
        order.student_name,
        order.guardian_name,
        order.phone || '---',
        order.payment_method || 'NO APLICA',
        productos,
        `S/ ${order.total.toFixed(2)}`
      ]);
    });
    
    // Subtotal del grado con formato
    detailData.push([]);
    detailData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      `🔹 SUBTOTAL ${group.grade} - ${group.section}:`,
      `S/ ${group.totalAmount.toFixed(2)}`
    ]);
    detailData.push([]);
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  
  // Ajustar ancho de columnas
  wsDetail['!cols'] = [
    { wch: 25 }, // Grado
    { wch: 8 },  // Sección
    { wch: 35 }, // Alumno
    { wch: 35 }, // Apoderado
    { wch: 15 }, // Teléfono
    { wch: 15 }, // Pago
    { wch: 60 }, // Productos (más ancho)
    { wch: 15 }  // Total
  ];
  
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 Detalle por Alumno');

  // ============================================
  // HOJA 3: ESTADÍSTICAS DE PAGO
  // ============================================
  const totalEfectivo = orders.filter(o => o.payment_method === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0);
  const totalYape = orders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0);
  const totalTarjeta = orders.filter(o => o.payment_method === 'TARJETA').reduce((sum, o) => sum + o.total, 0);
  const totalNoAplica = orders.filter(o => !o.payment_method).reduce((sum, o) => sum + o.total, 0);

  const countEfectivo = orders.filter(o => o.payment_method === 'EFECTIVO').length;
  const countYape = orders.filter(o => o.payment_method === 'YAPE/PLIN').length;
  const countTarjeta = orders.filter(o => o.payment_method === 'TARJETA').length;
  const countNoAplica = orders.filter(o => !o.payment_method).length;

  const paymentData: any[][] = [
    ['ESTADÍSTICAS DE PAGO'],
    [`Fecha: ${formatDateForDisplay(selectedDate)}`],
    [],
    ['MÉTODO DE PAGO', 'MONTO', 'PORCENTAJE', 'CANTIDAD DE PEDIDOS', 'PROMEDIO POR PEDIDO'],
    [
      '💵 EFECTIVO',
      `S/ ${totalEfectivo.toFixed(2)}`,
      `${totalGeneral > 0 ? ((totalEfectivo / totalGeneral) * 100).toFixed(1) : '0'}%`,
      countEfectivo,
      countEfectivo > 0 ? `S/ ${(totalEfectivo / countEfectivo).toFixed(2)}` : 'S/ 0.00'
    ],
    [
      '📱 YAPE/PLIN',
      `S/ ${totalYape.toFixed(2)}`,
      `${totalGeneral > 0 ? ((totalYape / totalGeneral) * 100).toFixed(1) : '0'}%`,
      countYape,
      countYape > 0 ? `S/ ${(totalYape / countYape).toFixed(2)}` : 'S/ 0.00'
    ],
    [
      '💳 TARJETA',
      `S/ ${totalTarjeta.toFixed(2)}`,
      `${totalGeneral > 0 ? ((totalTarjeta / totalGeneral) * 100).toFixed(1) : '0'}%`,
      countTarjeta,
      countTarjeta > 0 ? `S/ ${(totalTarjeta / countTarjeta).toFixed(2)}` : 'S/ 0.00'
    ],
    [
      '❓ NO APLICA',
      `S/ ${totalNoAplica.toFixed(2)}`,
      `${totalGeneral > 0 ? ((totalNoAplica / totalGeneral) * 100).toFixed(1) : '0'}%`,
      countNoAplica,
      countNoAplica > 0 ? `S/ ${(totalNoAplica / countNoAplica).toFixed(2)}` : 'S/ 0.00'
    ],
    [],
    ['📊 TOTAL GENERAL', `S/ ${totalGeneral.toFixed(2)}`, '100%', orders.length, '-']
  ];

  const wsPayment = XLSX.utils.aoa_to_sheet(paymentData);
  wsPayment['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 }
  ];
  
  XLSX.utils.book_append_sheet(wb, wsPayment, '💰 Estadísticas de Pago');

  // ============================================
  // HOJA 4: TOP PRODUCTOS (ranking)
  // ============================================
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  
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
    // Extraer el monto del string "S/ X.XX"
    const amountStr = p[3] as string;
    const amount = parseFloat(amountStr.replace('S/ ', ''));
    totalProductAmount += amount;
  });

  const productsData: any[][] = [
    ['🏆 TOP PRODUCTOS MÁS VENDIDOS'],
    [`Fecha: ${formatDateForDisplay(selectedDate)}`],
    [],
    ['#', 'PRODUCTO', 'CANTIDAD VENDIDA', 'TOTAL VENDIDO', 'PRECIO PROMEDIO'],
    ...topProducts,
    [],
    ['📈 TOTAL DE PRODUCTOS', '', totalProductQuantity, `S/ ${totalProductAmount.toFixed(2)}`, '']
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
  wsProducts['!cols'] = [
    { wch: 5 },
    { wch: 40 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];
  
  XLSX.utils.book_append_sheet(wb, wsProducts, '🏆 Top Productos');

  // ============================================
  // Guardar archivo con nombre profesional
  // ============================================
  const fecha = new Date();
  const hora = fecha.toLocaleTimeString('es-PE').replace(/:/g, '-');
  const fileName = `FULLDAY_${dateStr}_${hora}_REPORTE_ADMIN.xlsx`;
  
  XLSX.writeFile(wb, fileName);
  console.log('✅ Reporte administrativo generado:', fileName);
};