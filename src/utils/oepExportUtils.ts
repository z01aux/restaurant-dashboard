// ============================================
// ARCHIVO: src/utils/oepExportUtils.ts
// VERSIÓN ACTUALIZADA - Con mejoras similares a Loncheritas
// ============================================

import * as XLSX from 'xlsx';
import { OEPOrder } from '../types/oep';

const formatDate = (d: Date) =>
  d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (d: Date) =>
  d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

const getStartOfDay = (d: Date) => { const s = new Date(d); s.setHours(0, 0, 0, 0); return s; };
const getEndOfDay = (d: Date) => { const e = new Date(d); e.setHours(23, 59, 59, 999); return e; };

/**
 * Formatea los items del pedido de forma legible
 */
const formatProductos = (items: OEPOrder['items']): string => {
  return items
    .map(item => {
      const itemName = item.name.toUpperCase();
      const base = `${item.quantity}x ${itemName}`;
      if (item.notes && item.notes.trim() !== '') {
        return `${base} (${item.notes.trim()})`;
      }
      return base;
    })
    .join(', ');
};

/**
 * Formato compacto para muchos items
 */
const formatProductosCompact = (items: OEPOrder['items']): string => {
  return items
    .map(item => {
      const itemName = item.name.length > 20 
        ? item.name.substring(0, 20) + '…' 
        : item.name;
      return `${item.quantity}x ${itemName}`;
    })
    .join(' + ');
};

// ─── EXCEL HOY / TODOS ────────────────────────────────────────
export const exportOEPToExcel = (orders: OEPOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) { alert('No hay pedidos para exportar'); return; }

  const data = orders.map(order => {
    const fecha = formatDate(new Date(order.created_at));
    const hora = formatTime(new Date(order.created_at));
    
    const productos = order.items.length > 3 
      ? formatProductosCompact(order.items)
      : formatProductos(order.items);

    return {
      '📅 FECHA': fecha,
      '⏰ HORA': hora,
      '🔢 N° ORDEN': order.order_number,
      '👤 CLIENTE': order.customer_name.toUpperCase(),
      '📞 TELÉFONO': order.phone || '',
      '📍 DIRECCIÓN': order.address || '',
      '💰 MONTO TOTAL': `S/ ${order.total.toFixed(2)}`,
      '💳 MÉTODO PAGO': order.payment_method || 'NO APLICA',
      '📦 PRODUCTOS': productos,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 35 },
    { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `oep_${tipo === 'today' ? 'hoy' : 'todos'}_${fecha}.xlsx`);
};

// ─── REPORTE POR RANGO DE FECHAS (ACTUALIZADO) ─────────────────
export const exportOEPByDateRange = (orders: OEPOrder[], startDate: Date, endDate: Date) => {
  const filtered = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= getStartOfDay(startDate) && d <= getEndOfDay(endDate);
  });

  if (filtered.length === 0) { alert('No hay pedidos en el rango de fechas seleccionado'); return; }

  const wb = XLSX.utils.book_new();
  const totalAmount = filtered.reduce((s, o) => s + o.total, 0);
  const totalEfectivo = filtered.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
  const totalYape = filtered.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
  const totalTarjeta = filtered.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
  const totalNoAplica = filtered.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);

  // HOJA 1: RESUMEN
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['REPORTE DE PEDIDOS OEP'],
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

  // HOJA 2: DETALLE (MEJORADO)
  const detailRows: any[][] = [
    ['DETALLE DE PEDIDOS OEP'],
    [`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`],
    [],
    ['FECHA', 'HORA', 'N° ORDEN', 'CLIENTE', 'TELÉFONO', 'DIRECCIÓN', 'MÉTODO PAGO', 'PRODUCTOS', 'TOTAL'],
  ];

  [...filtered]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .forEach(o => {
      const productos = o.items.length > 3
        ? o.items.map(i => {
            const base = `${i.quantity}x ${i.name}`;
            return i.notes ? `${base} (${i.notes})` : base;
          }).join('\n')
        : o.items.map(i => {
            const base = `${i.quantity}x ${i.name}`;
            return i.notes ? `${base} (${i.notes})` : base;
          }).join('\n');

      detailRows.push([
        formatDate(new Date(o.created_at)),
        formatTime(new Date(o.created_at)),
        o.order_number,
        o.customer_name,
        o.phone || '---',
        o.address || '---',
        o.payment_method || 'NO APLICA',
        productos,
        `S/ ${o.total.toFixed(2)}`,
      ]);
    });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 35 },
    { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 60 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 DETALLE');

  // HOJA 3: TOP PRODUCTOS
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
    .map((p, i) => [i + 1, p.name, p.quantity, `S/ ${p.total.toFixed(2)}`]);

  const wsProducts = XLSX.utils.aoa_to_sheet([
    ['🏆 TOP 10 PRODUCTOS OEP'],
    [`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`],
    [],
    ['#', 'PRODUCTO', 'CANTIDAD', 'TOTAL VENDIDO'],
    ...topProducts,
  ]);
  wsProducts['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsProducts, '🏆 TOP 10');

  const s = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const e = endDate.toISOString().split('T')[0].replace(/-/g, '');
  XLSX.writeFile(wb, `OEP_${s}_al_${e}.xlsx`);
};