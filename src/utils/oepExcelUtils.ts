// ============================================================
// ARCHIVO: src/utils/oepExcelUtils.ts
// Exportación a Excel del módulo OEP
// Equivalente exacto de: src/utils/fulldayExcelUtils.ts
// (referencias a exportFullDayToCSV, exportFullDayToExcel, exportFullDayByDateRange)
// ============================================================

import * as XLSX from 'xlsx';
import { OEPOrder } from '../hooks/useOEP';
import { formatDateForDisplay, formatTimeForDisplay, getStartOfDay, getEndOfDay } from './dateUtils';

// ── CSV ──────────────────────────────────────────────────────
export const exportOEPToCSV = (orders: OEPOrder[], fileName: string = 'oep_pedidos') => {
  if (orders.length === 0) { alert('No hay pedidos para exportar'); return; }

  const headers = ['Fecha','Hora','N° Orden','Alumno','Grado','Sección','Apoderado','Teléfono','Monto','Método Pago','Productos'];
  const rows = orders.map(order => [
    formatDateForDisplay(new Date(order.created_at)),
    formatTimeForDisplay(new Date(order.created_at)),
    order.order_number,
    order.student_name,
    order.grade,
    order.section,
    order.guardian_name,
    order.phone || '',
    order.total.toFixed(2),
    order.payment_method || 'NO APLICA',
    order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM  = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ── Helper: categorizar items ────────────────────────────────
const listOEPItemsByCategory = (order: OEPOrder) => {
  const result = { entradas: [] as string[], fondos: [] as string[], bebidas: [] as string[] };

  order.items.forEach(item => {
    const display  = `${item.quantity}x ${item.name}`;
    // @ts-ignore
    const category = item.category ? item.category.toLowerCase() : null;

    if (category) {
      if (category.includes('entrada'))                         { result.entradas.push(display); return; }
      if (category.includes('fondo') || category.includes('plato')) { result.fondos.push(display);  return; }
      if (category.includes('bebida'))                          { result.bebidas.push(display); return; }
    }

    const name = item.name.toLowerCase();
    if (['gaseosa','inca kola','coca cola','sprite','fanta','agua','jugo','chicha','maracuya','limonada']
        .some(k => name.includes(k)))                           { result.bebidas.push(display); return; }
    if (['entrada','ensalada','sopa','caldo','causa','papa a la huancaina']
        .some(k => name.includes(k)))                           { result.entradas.push(display); return; }

    result.fondos.push(display);
  });

  return {
    entradas: result.entradas.join('\n'),
    fondos:   result.fondos.join('\n'),
    bebidas:  result.bebidas.join('\n'),
  };
};

// ── Excel básico (hoy / todos) ───────────────────────────────
export const exportOEPToExcel = (orders: OEPOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) { alert('No hay pedidos para exportar'); return; }

  const data = orders.map(order => {
    const items = listOEPItemsByCategory(order);
    return {
      '📅 FECHA':          formatDateForDisplay(new Date(order.created_at)),
      '⏰ HORA':           formatTimeForDisplay(new Date(order.created_at)),
      '🔢 N° ORDEN':       order.order_number,
      '👤 ALUMNO':         order.student_name.toUpperCase(),
      '📚 GRADO':          order.grade,
      '📌 SECCIÓN':        order.section,
      '📞 TELÉFONO':       order.phone || '',
      '💰 MONTO TOTAL':    `S/ ${order.total.toFixed(2)}`,
      '💳 MÉTODO PAGO':    order.payment_method || 'NO APLICA',
      '🥗 ENTRADAS':       items.entradas,
      '🍽️ PLATOS DE FONDO': items.fondos,
      '🥤 BEBIDAS':        items.bebidas,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    {wch:12},{wch:8},{wch:15},{wch:30},{wch:20},{wch:8},{wch:15},{wch:12},{wch:12},{wch:40},{wch:40},{wch:40}
  ];

  XLSX.utils.book_append_sheet(wb, ws, tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos');

  const fecha    = new Date().toISOString().split('T')[0];
  const tipoText = tipo === 'today' ? 'diarios' : 'todos';
  XLSX.writeFile(wb, `oep_${tipoText}_${fecha}.xlsx`);
};

// ── Excel por rango de fechas ────────────────────────────────
export const exportOEPByDateRange = (orders: OEPOrder[], startDate: Date, endDate: Date) => {
  const startOfDay = getStartOfDay(startDate);
  const endOfDay   = getEndOfDay(endDate);

  const filtered = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= startOfDay && d <= endOfDay;
  });

  if (filtered.length === 0) { alert('No hay pedidos en el rango de fechas seleccionado'); return; }

  const wb      = XLSX.utils.book_new();
  const startSt = startDate.toISOString().split('T')[0].replace(/-/g,'');
  const endSt   = endDate.toISOString().split('T')[0].replace(/-/g,'');

  // HOJA 1: Resumen general
  const totalOrders   = filtered.length;
  const totalVentas   = filtered.reduce((s, o) => s + o.total, 0);
  const totalEfectivo = filtered.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
  const totalYape     = filtered.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
  const totalTarjeta  = filtered.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
  const totalNoAplica = filtered.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);

  const summaryData: any[][] = [
    ['REPORTE DE PEDIDOS OEP'],
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
    ['EFECTIVO',  `S/ ${totalEfectivo.toFixed(2)}`, totalVentas > 0 ? `${((totalEfectivo / totalVentas)*100).toFixed(1)}%` : '0%'],
    ['YAPE/PLIN', `S/ ${totalYape.toFixed(2)}`,     totalVentas > 0 ? `${((totalYape     / totalVentas)*100).toFixed(1)}%` : '0%'],
    ['TARJETA',   `S/ ${totalTarjeta.toFixed(2)}`,  totalVentas > 0 ? `${((totalTarjeta  / totalVentas)*100).toFixed(1)}%` : '0%'],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{wch:30},{wch:15},{wch:10}];
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 RESUMEN');

  // HOJA 2: Detalle por alumno
  const detailData: any[][] = [
    ['DETALLE DE PEDIDOS'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['FECHA','HORA','N° ORDEN','GRADO','SECCIÓN','ALUMNO','APODERADO','TELÉFONO','PAGO','PRODUCTOS','TOTAL']
  ];

  [...filtered]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .forEach(order => {
      detailData.push([
        formatDateForDisplay(new Date(order.created_at)),
        formatTimeForDisplay(new Date(order.created_at)),
        order.order_number,
        order.grade,
        order.section,
        order.student_name,
        order.guardian_name,
        order.phone || '---',
        order.payment_method || 'NO APLICA',
        order.items.map(i => `${i.quantity}x ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join('\n'),
        `S/ ${order.total.toFixed(2)}`
      ]);
    });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  wsDetail['!cols'] = [{wch:12},{wch:8},{wch:15},{wch:20},{wch:8},{wch:30},{wch:30},{wch:15},{wch:12},{wch:50},{wch:12}];
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 DETALLE');

  // HOJA 3: Top 10 productos
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  filtered.forEach(order => {
    order.items.forEach(item => {
      const ex = productMap.get(item.id);
      if (ex) { ex.quantity += item.quantity; ex.total += item.price * item.quantity; }
      else    { productMap.set(item.id, { name: item.name, quantity: item.quantity, total: item.price * item.quantity }); }
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((p, i) => [i+1, p.name, p.quantity, `S/ ${p.total.toFixed(2)}`]);

  const wsProducts = XLSX.utils.aoa_to_sheet([
    ['🏆 TOP 10 PRODUCTOS'],
    [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
    [],
    ['#','PRODUCTO','CANTIDAD','TOTAL VENDIDO'],
    ...topProducts
  ]);
  wsProducts['!cols'] = [{wch:5},{wch:40},{wch:10},{wch:15}];
  XLSX.utils.book_append_sheet(wb, wsProducts, '🏆 TOP 10');

  XLSX.writeFile(wb, `OEP_${startSt}_al_${endSt}.xlsx`);
};
