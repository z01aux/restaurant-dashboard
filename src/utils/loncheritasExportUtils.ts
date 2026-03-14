// ============================================
// ARCHIVO: src/utils/loncheritasExportUtils.ts
// VERSIÓN ACTUALIZADA - Sin apoderado, con columna "Desayunos"
// ============================================

import * as XLSX from 'xlsx';
import { LoncheritasOrder } from '../types/loncheritas';

const formatDate = (d: Date) =>
  d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (d: Date) =>
  d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

const getStartOfDay = (d: Date) => { const s = new Date(d); s.setHours(0, 0, 0, 0); return s; };
const getEndOfDay = (d: Date) => { const e = new Date(d); e.setHours(23, 59, 59, 999); return e; };

/**
 * Formatea los items del pedido como una lista de desayunos en mayúsculas
 * SIEMPRE COMPLETA, sin truncar
 */
const formatDesayunosCompleto = (items: LoncheritasOrder['items']): string => {
  return items
    .map(item => {
      const base = `${item.quantity}x ${item.name.toUpperCase()}`;
      return item.notes ? `${base} (${item.notes.toUpperCase()})` : base;
    })
    .join('\n');
};

// ─── EXCEL HOY / TODOS ────────────────────────────────────────
export const exportLoncheritasToExcel = (orders: LoncheritasOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) { alert('No hay pedidos para exportar'); return; }

  const data = orders.map(order => {
    const fecha = formatDate(new Date(order.created_at));
    const hora = formatTime(new Date(order.created_at));
    
    // AHORA SIEMPRE USA EL FORMATO COMPLETO, sin importar la cantidad de items
    const desayunos = formatDesayunosCompleto(order.items);

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
      '🥪 DESAYUNOS': desayunos, // Ahora siempre completo
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajustar el ancho de las columnas
  ws['!cols'] = [
    { wch: 12 }, // 📅 FECHA
    { wch: 8 },  // ⏰ HORA
    { wch: 15 }, // 🔢 N° ORDEN
    { wch: 35 }, // 👤 ALUMNO (más ancho para nombres completos)
    { wch: 20 }, // 📚 GRADO
    { wch: 8 },  // 📌 SECCIÓN
    { wch: 15 }, // 📞 TELÉFONO
    { wch: 12 }, // 💰 MONTO TOTAL
    { wch: 12 }, // 💳 MÉTODO PAGO
    { wch: 80 }, // 🥪 DESAYUNOS - AUMENTADO A 80 PARA QUE QUEPAN TODOS LOS PRODUCTOS
  ];

  const nombreHoja = tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos';
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

  const fecha = new Date().toISOString().split('T')[0];
  // CAMBIADO: Eliminado el tipoTexto para que el nombre sea solo loncheritas_fecha.xlsx
  XLSX.writeFile(wb, `loncheritas_${fecha}.xlsx`);
};

// ─── REPORTE POR RANGO DE FECHAS ──────────────────────────────
export const exportLoncheritasByDateRange = (orders: LoncheritasOrder[], startDate: Date, endDate: Date) => {
  const filtered = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= getStartOfDay(startDate) && d <= getEndOfDay(endDate);
  });

  if (filtered.length === 0) {
    alert('No hay pedidos en el rango de fechas seleccionado');
    return;
  }

  const wb = XLSX.utils.book_new();
  const totalAmount = filtered.reduce((s, o) => s + o.total, 0);
  const totalEfectivo = filtered.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
  const totalYape = filtered.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
  const totalTarjeta = filtered.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
  const totalNoAplica = filtered.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);

  // HOJA 1: RESUMEN
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['REPORTE DE PEDIDOS LONCHERITAS'],
    ["MARY'S RESTAURANT"],
    [],
    [`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`],
    [`Fecha de generación: ${new Date().toLocaleString('es-PE')}`],
    [],
    ['📊 RESUMEN GENERAL'],
    ['Total de Pedidos', filtered.length],
    ['Total Ventas', `S/ ${totalAmount.toFixed(2)}`],
    [],
    ['💰 VENTAS POR MÉTODO DE PAGO'],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`, totalAmount > 0 ? `${((totalEfectivo / totalAmount) * 100).toFixed(1)}%` : '0%'],
    ['YAPE/PLIN', `S/ ${totalYape.toFixed(2)}`, totalAmount > 0 ? `${((totalYape / totalAmount) * 100).toFixed(1)}%` : '0%'],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`, totalAmount > 0 ? `${((totalTarjeta / totalAmount) * 100).toFixed(1)}%` : '0%'],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`],
  ]);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 RESUMEN');

  // HOJA 2: DETALLE (SIN APODERADO, CON DESAYUNOS EN MAYÚSCULAS Y COMPLETOS)
  const detailRows: any[][] = [
    ['DETALLE DE PEDIDOS LONCHERITAS'],
    [`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`],
    [],
    ['FECHA', 'HORA', 'N° ORDEN', 'ALUMNO', 'GRADO', 'SECCIÓN', 'TELÉFONO', 'MÉTODO PAGO', 'DESAYUNOS', 'TOTAL'],
  ];

  [...filtered]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .forEach(o => {
      // AHORA SIEMPRE COMPLETO, sin truncar
      const desayunos = o.items.map(i => {
        const base = `${i.quantity}x ${i.name.toUpperCase()}`;
        return i.notes ? `${base} (${i.notes.toUpperCase()})` : base;
      }).join('\n');

      detailRows.push([
        formatDate(new Date(o.created_at)),
        formatTime(new Date(o.created_at)),
        o.order_number,
        o.student_name,
        o.grade,
        o.section,
        o.phone || '---',
        o.payment_method || 'NO APLICA',
        desayunos,
        `S/ ${o.total.toFixed(2)}`,
      ]);
    });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 12 }, // FECHA
    { wch: 8 },  // HORA
    { wch: 15 }, // N° ORDEN
    { wch: 35 }, // ALUMNO
    { wch: 20 }, // GRADO
    { wch: 8 },  // SECCIÓN
    { wch: 15 }, // TELÉFONO
    { wch: 12 }, // MÉTODO PAGO
    { wch: 80 }, // DESAYUNOS - AUMENTADO A 80
    { wch: 12 }, // TOTAL
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 DETALLE');

  // HOJA 3: TOP PRODUCTOS (ahora en mayúsculas)
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  filtered.forEach(o => o.items.forEach(item => {
    const ex = productMap.get(item.id);
    if (ex) {
      ex.quantity += item.quantity;
      ex.total += item.price * item.quantity;
    } else {
      productMap.set(item.id, { name: item.name, quantity: item.quantity, total: item.price * item.quantity });
    }
  }));

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity).slice(0, 10)
    .map((p, i) => [i + 1, p.name.toUpperCase(), p.quantity, `S/ ${p.total.toFixed(2)}`]);

  const wsProducts = XLSX.utils.aoa_to_sheet([
    ['🏆 TOP 10 PRODUCTOS LONCHERITAS'],
    [`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`],
    [],
    ['#', 'PRODUCTO', 'CANTIDAD', 'TOTAL VENDIDO'],
    ...topProducts,
  ]);
  wsProducts['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsProducts, '🏆 TOP 10');

  const s = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const e = endDate.toISOString().split('T')[0].replace(/-/g, '');
  // CAMBIADO: Nombre del archivo en minúsculas
  XLSX.writeFile(wb, `loncheritas_${s}_al_${e}.xlsx`);
};