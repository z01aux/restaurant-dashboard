// ============================================
// ARCHIVO: src/utils/loncheritasTicketUtils.ts
// ✅ ACTUALIZADO: Cambiado "TOTAL PLATOS" por "TOTAL PRODUCTOS"
//    - PAGO MIXTO distribuido (no aparece línea MIXTO)
//    - TODOS los productos vendidos + total de productos
//    - Desglose diario cuando rango > 1 día
//    - Centrado y autoajuste para impresora 80mm
//    - Exporta printLoncheritasA4 (requerido por LoncheritasDashboard)
//    - generateLoncheritasTicketSummary acepta fechas opcionales
//      (compatibilidad con LoncheritasDashboard que llama sin fechas)
// ============================================

import { LoncheritasOrder } from '../types/loncheritas';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';

// ── Interfaz A4 (requerida por LoncheritasDashboard) ─────────────
export interface LoncheritasA4Data {
  orders: LoncheritasOrder[];
  selectedDate: string; // YYYY-MM-DD
}

interface LoncheritasTicketSummary {
  totalOrders: number;
  totalAmount: number;
  byPaymentMethod: {
    EFECTIVO:  number;
    YAPE_PLIN: number;
    TARJETA:   number;
    NO_APLICA: number;
  };
  productsSold: Array<{ name: string; quantity: number; total: number }>;
  dailyBreakdown: Array<{ date: string; orders: number; total: number }>;
}

const getCurrentUserName = (): string => {
  try {
    const saved = localStorage.getItem('restaurant-user');
    if (saved) return JSON.parse(saved).name || 'Sistema';
  } catch { /* noop */ }
  return 'Sistema';
};

// ─────────────────────────────────────────────────────────────────
// generateLoncheritasTicketSummary
// startDate y endDate son OPCIONALES para mantener compatibilidad
// con LoncheritasDashboard que llama: generateLoncheritasTicketSummary(orders)
// ─────────────────────────────────────────────────────────────────
export const generateLoncheritasTicketSummary = (
  orders: LoncheritasOrder[],
  startDate?: Date,
  endDate?: Date
): LoncheritasTicketSummary => {
  const _start = startDate ?? new Date();
  const _end   = endDate   ?? new Date();

  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);

  // MIXTO se distribuye en sus métodos — NO aparece como línea propia
  let efectivo = 0;
  let yapePlin = 0;
  let tarjeta  = 0;
  let noAplica = 0;

  orders.forEach(order => {
    if (order.payment_method === 'MIXTO' && (order as any).split_payment) {
      const sp = (order as any).split_payment;
      efectivo += sp.efectivo || 0;
      yapePlin += sp.yapePlin  || 0;
      tarjeta  += sp.tarjeta   || 0;
    } else {
      switch (order.payment_method) {
        case 'EFECTIVO':  efectivo += order.total; break;
        case 'YAPE/PLIN': yapePlin += order.total; break;
        case 'TARJETA':   tarjeta  += order.total; break;
        default:          noAplica += order.total; break;
      }
    }
  });

  // Todos los productos agrupados por nombre
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const key = item.name.trim().toUpperCase();
      const ex  = productMap.get(key);
      if (ex) {
        ex.quantity += item.quantity;
        ex.total    += item.price * item.quantity;
      } else {
        productMap.set(key, {
          name:     item.name.trim().toUpperCase(),
          quantity: item.quantity,
          total:    item.price * item.quantity,
        });
      }
    });
  });

  const productsSold = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity);

  // Desglose diario
  const dailyMap = new Map<string, { orders: number; total: number }>();
  const cursor = new Date(_start);
  while (cursor <= _end) {
    dailyMap.set(formatDateForDisplay(cursor), { orders: 0, total: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  orders.forEach(order => {
    const dateStr = formatDateForDisplay(new Date(order.created_at));
    const day = dailyMap.get(dateStr);
    if (day) { day.orders++; day.total += order.total; }
  });
  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, orders: data.orders, total: data.total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalOrders,
    totalAmount,
    byPaymentMethod: { EFECTIVO: efectivo, YAPE_PLIN: yapePlin, TARJETA: tarjeta, NO_APLICA: noAplica },
    productsSold,
    dailyBreakdown,
  };
};

// ─────────────────────────────────────────────────────────────────
// generateLoncheritasTicketHTML — idéntico al de Órdenes
// ─────────────────────────────────────────────────────────────────
export const generateLoncheritasTicketHTML = (
  summary: LoncheritasTicketSummary,
  startDate: Date,
  endDate: Date
): string => {
  const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

  const periodText =
    formatDateForDisplay(startDate) === formatDateForDisplay(endDate)
      ? `DIA: ${formatDateForDisplay(startDate)}`
      : `PERIODO: ${formatDateForDisplay(startDate)} AL ${formatDateForDisplay(endDate)}`;

  return `
    <div class="ticket" style="font-family:'Courier New',monospace;width:100%;max-width:80mm;margin:0 auto;padding:8px;background:white;color:black;font-size:12px;line-height:1.3;font-weight:bold;text-transform:uppercase;box-sizing:border-box;">

      <!-- HEADER -->
      <div style="text-align:center;margin-bottom:10px;width:100%;">
        <div style="font-size:16px;font-weight:bold;text-align:center;">MARY'S RESTAURANT</div>
        <div style="font-size:12px;font-weight:bold;text-align:center;">INVERSIONES AROMO S.A.C.</div>
        <div style="font-size:12px;font-weight:bold;text-align:center;">RUC: 20505262086</div>
        <div style="font-size:11px;font-weight:bold;text-align:center;">LONCHERITAS - RESUMEN</div>
        <div style="font-size:11px;font-weight:bold;text-align:center;">${periodText}</div>
        <div style="font-size:10px;font-weight:bold;text-align:center;">EMITIDO: ${formatDateForDisplay(new Date())} ${formatTimeForDisplay(new Date())}</div>
        <div style="font-size:10px;font-weight:bold;text-align:center;">USUARIO: ${getCurrentUserName().toUpperCase()}</div>
        <div style="border-top:1px dashed #000;margin:8px auto;width:100%;"></div>
      </div>

      <!-- RESUMEN GENERAL -->
      <div style="margin-bottom:8px;width:100%;">
        <div style="text-align:center;font-weight:bold;margin-bottom:4px;font-size:12px;width:100%;">RESUMEN GENERAL</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px;font-weight:bold;width:100%;">
          <span>TOTAL PEDIDOS:</span><span>${summary.totalOrders}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px;font-weight:bold;width:100%;">
          <span>TOTAL VENTAS:</span><span>${fmt(summary.totalAmount)}</span>
        </div>
      </div>

      <div style="border-top:1px dashed #000;margin:8px auto;width:100%;"></div>

      <!-- MÉTODOS DE PAGO (solo > 0; MIXTO ya distribuido) -->
      <div style="margin-bottom:8px;width:100%;">
        <div style="text-align:center;font-weight:bold;margin-bottom:4px;font-size:12px;width:100%;">METODO DE PAGO</div>
        ${summary.byPaymentMethod.EFECTIVO > 0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px;font-weight:bold;width:100%;">
            <span>EFECTIVO:</span><span>${fmt(summary.byPaymentMethod.EFECTIVO)}</span>
          </div>` : ''}
        ${summary.byPaymentMethod.YAPE_PLIN > 0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px;font-weight:bold;width:100%;">
            <span>YAPE/PLIN:</span><span>${fmt(summary.byPaymentMethod.YAPE_PLIN)}</span>
          </div>` : ''}
        ${summary.byPaymentMethod.TARJETA > 0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px;font-weight:bold;width:100%;">
            <span>TARJETA:</span><span>${fmt(summary.byPaymentMethod.TARJETA)}</span>
          </div>` : ''}
        ${summary.byPaymentMethod.NO_APLICA > 0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px;font-weight:bold;width:100%;">
            <span>NO APLICA:</span><span>${fmt(summary.byPaymentMethod.NO_APLICA)}</span>
          </div>` : ''}
      </div>

      <div style="border-top:1px dashed #000;margin:8px auto;width:100%;"></div>

      <!-- PRODUCTOS VENDIDOS (TODOS) -->
      ${summary.productsSold.length > 0 ? `
        <div style="margin-bottom:8px;width:100%;">
          <div style="text-align:center;font-weight:bold;margin-bottom:4px;font-size:12px;width:100%;">PRODUCTOS VENDIDOS</div>
          ${summary.productsSold.map(p => `
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;margin-bottom:3px;width:100%;">
              <span>${p.name}</span><span>${p.quantity}</span>
            </div>
          `).join('')}
          <div style="border-top:1px dashed #000;margin:8px auto;width:100%;"></div>
          <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:12px;width:100%;">
            <span>TOTAL PRODUCTOS:</span>
            <span>${summary.productsSold.reduce((s, p) => s + p.quantity, 0)}</span>
          </div>
        </div>
        <div style="border-top:1px dashed #000;margin:8px auto;width:100%;"></div>
      ` : ''}

      <!-- DESGLOSE DIARIO (solo si rango > 1 día) -->
      ${summary.dailyBreakdown.length > 1 ? `
        <div style="margin-bottom:8px;width:100%;">
          <div style="text-align:center;font-weight:bold;margin-bottom:4px;font-size:12px;width:100%;">DESGLOSE DIARIO</div>
          ${summary.dailyBreakdown.map(day => `
            <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:bold;margin-bottom:3px;width:100%;">
              <span>${day.date}:</span>
              <span>${day.orders} PED - ${fmt(day.total)}</span>
            </div>
          `).join('')}
        </div>
        <div style="border-top:1px dashed #000;margin:8px auto;width:100%;"></div>
      ` : ''}

      <!-- FOOTER -->
      <div style="text-align:center;margin-top:10px;font-size:10px;font-weight:bold;width:100%;">
        <div>GRACIAS POR SU TRABAJO</div>
        <div style="margin-top:4px;">********************************</div>
      </div>

    </div>
  `;
};

// ─────────────────────────────────────────────────────────────────
// printLoncheritasResumenTicket — centrado y autoajuste 80mm
// ─────────────────────────────────────────────────────────────────
export const printLoncheritasResumenTicket = (
  summary: LoncheritasTicketSummary,
  startDate: Date,
  endDate: Date
) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const ticketContent = generateLoncheritasTicketHTML(summary, startDate, endDate);
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loncheritas ${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; padding: 0; }
              html, body { width: 80mm; margin: 0 auto !important; padding: 0 !important; background: white !important; }
              body {
                display: flex; justify-content: center; align-items: center; min-height: auto;
                font-family: 'Courier New', monospace !important;
                font-size: 12px !important; font-weight: bold !important; text-transform: uppercase !important;
              }
              * { font-family: 'Courier New', monospace !important; font-weight: bold !important; box-sizing: border-box !important; }
              .ticket { width: 78mm !important; max-width: 78mm !important; margin: 0 auto !important; padding: 4mm !important; background: white !important; color: black !important; box-sizing: border-box !important; }
            }
            @media screen {
              body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; background: #f0f0f0; font-family: 'Courier New', monospace; }
              .ticket { width: 80mm; margin: 0 auto; padding: 8px; background: white; color: black; box-shadow: 0 0 10px rgba(0,0,0,0.1); border-radius: 4px; }
            }
            body { margin: 0; padding: 0; font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .ticket { width: 100%; max-width: 80mm; margin: 0 auto; padding: 8px; box-sizing: border-box; }
            .ticket > div { width: 100%; }
          </style>
        </head>
        <body>${ticketContent}</body>
      </html>
    `);
    iframeDoc.close();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
    }, 500);
  }
};

// ─────────────────────────────────────────────────────────────────
// printLoncheritasA4 — requerido por LoncheritasDashboard.tsx
// Genera un reporte A4 detallado con productos y ventas por grado
// ─────────────────────────────────────────────────────────────────
export const printLoncheritasA4 = ({ orders, selectedDate }: LoncheritasA4Data) => {
  const fmt   = (n: number) => `S/ ${n.toFixed(2)}`;
  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const totalOrders = orders.length;
  const totalVentas = orders.reduce((s, o) => s + o.total, 0);

  // Métodos de pago (MIXTO distribuido)
  let efectivo = 0, yapePlin = 0, tarjeta = 0, noAplica = 0;
  orders.forEach(order => {
    if (order.payment_method === 'MIXTO' && (order as any).split_payment) {
      const sp = (order as any).split_payment;
      efectivo += sp.efectivo || 0; yapePlin += sp.yapePlin || 0; tarjeta += sp.tarjeta || 0;
    } else {
      switch (order.payment_method) {
        case 'EFECTIVO':  efectivo += order.total; break;
        case 'YAPE/PLIN': yapePlin += order.total; break;
        case 'TARJETA':   tarjeta  += order.total; break;
        default:          noAplica += order.total; break;
      }
    }
  });

  // Todos los productos
  const prodMap = new Map<string, { name: string; qty: number; total: number }>();
  orders.forEach(o => {
    (o.items || []).forEach((item: any) => {
      const key = item.name.trim().toUpperCase();
      if (!prodMap.has(key)) prodMap.set(key, { name: item.name.trim().toUpperCase(), qty: 0, total: 0 });
      const p = prodMap.get(key)!;
      p.qty += item.quantity; p.total += (item.price || 0) * item.quantity;
    });
  });
  const productos = Array.from(prodMap.values()).sort((a, b) => b.qty - a.qty);
  const totalUnidades = productos.reduce((s, p) => s + p.qty, 0);

  // Por grado
  const gradeMap = new Map<string, { grade: string; section: string; count: number; total: number }>();
  orders.forEach(o => {
    const key = `${o.grade}||${o.section}`;
    if (!gradeMap.has(key)) gradeMap.set(key, { grade: o.grade, section: o.section, count: 0, total: 0 });
    const g = gradeMap.get(key)!; g.count++; g.total += o.total;
  });
  const grades = Array.from(gradeMap.values()).sort((a, b) =>
    a.grade !== b.grade ? a.grade.localeCompare(b.grade) : a.section.localeCompare(b.section));

  const pct = (n: number) => totalVentas > 0 ? ((n / totalVentas) * 100).toFixed(1) + '%' : '0%';

  const productRows = productos.map((p, i) => {
    const barPct = totalUnidades > 0 ? (p.qty / totalUnidades) * 100 : 0;
    return `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">${i + 1}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;">
        ${p.name}
        <div style="height:4px;background:#e5e7eb;border-radius:2px;margin-top:4px;width:100%;">
          <div style="height:4px;background:linear-gradient(90deg,#a855f7,#ec4899);border-radius:2px;width:${barPct.toFixed(1)}%;"></div>
        </div>
      </td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:20px;font-weight:900;color:#7c3aed;">${p.qty}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#111;">${fmt(p.total)}</td>
    </tr>`;
  }).join('');

  const gradeRows = grades.map(g => `<tr>
    <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:700;">${g.grade} &quot;${g.section}&quot;</td>
    <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${g.count}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">${fmt(g.total)}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ventas Loncheritas — ${dateLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    @media print { @page { size: A4; margin: 15mm 12mm; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; color: #111; font-size: 13px; line-height: 1.5; background: white; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; border-bottom: 3px solid #7c3aed; padding-bottom: 14px; }
    .header-left h1 { font-size: 22px; font-weight: 900; color: #7c3aed; margin-bottom: 2px; }
    .header-left .sub { font-size: 12px; color: #6b7280; }
    .header-right { text-align: right; font-size: 11px; color: #6b7280; }
    .header-right .date { font-size: 13px; font-weight: 700; color: #374151; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .kpi { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; }
    .kpi .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
    .kpi .kpi-value { font-size: 22px; font-weight: 900; color: #7c3aed; }
    .kpi .kpi-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .section-title { font-size: 11px; font-weight: 900; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 5px 12px; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
    .pago-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 4px; }
    .pago-box { border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; text-align: center; }
    .pago-box .pago-label { font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 3px; }
    .pago-box .pago-amt { font-size: 14px; font-weight: 900; color: #111; }
    .pago-box .pago-pct { font-size: 10px; color: #7c3aed; font-weight: 700; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #f3f4f6; }
    th { padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; color: #374141; font-weight: 700; }
    th:last-child { text-align: right; } th:nth-child(3) { text-align: center; }
    .grade-table th:nth-child(2) { text-align: center; } .grade-table th:nth-child(3) { text-align: right; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
    .total-foot { font-weight: 900; font-size: 14px; color: #111; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>🍱 VENTAS LONCHERITAS</h1>
      <div class="sub">MARY'S RESTAURANT &nbsp;·&nbsp; REPORTE DE PRODUCTOS VENDIDOS</div>
    </div>
    <div class="header-right">
      <div class="date">${dateLabel}</div>
      <div>Impreso: ${new Date().toLocaleString('es-PE')}</div>
      <div>Usuario: ${getCurrentUserName().toUpperCase()}</div>
    </div>
  </div>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-label">Total Ventas</div><div class="kpi-value">${fmt(totalVentas)}</div><div class="kpi-sub">${totalOrders} pedido${totalOrders !== 1 ? 's' : ''}</div></div>
    <div class="kpi"><div class="kpi-label">Ticket Promedio</div><div class="kpi-value">${fmt(totalOrders > 0 ? totalVentas / totalOrders : 0)}</div><div class="kpi-sub">por pedido</div></div>
    <div class="kpi"><div class="kpi-label">Unidades</div><div class="kpi-value">${totalUnidades}</div><div class="kpi-sub">${productos.length} producto${productos.length !== 1 ? 's' : ''} distintos</div></div>
    <div class="kpi"><div class="kpi-label">Grados</div><div class="kpi-value">${grades.length}</div><div class="kpi-sub">con pedidos</div></div>
  </div>
  <div class="section-title">💳 Métodos de Pago</div>
  <div class="pago-grid">
    <div class="pago-box"><div class="pago-label">💵 Efectivo</div><div class="pago-amt">${fmt(efectivo)}</div><div class="pago-pct">${pct(efectivo)}</div></div>
    <div class="pago-box"><div class="pago-label">📱 Yape/Plin</div><div class="pago-amt">${fmt(yapePlin)}</div><div class="pago-pct">${pct(yapePlin)}</div></div>
    <div class="pago-box"><div class="pago-label">💳 Tarjeta</div><div class="pago-amt">${fmt(tarjeta)}</div><div class="pago-pct">${pct(tarjeta)}</div></div>
    <div class="pago-box"><div class="pago-label">➖ No aplica</div><div class="pago-amt">${fmt(noAplica)}</div><div class="pago-pct">${pct(noAplica)}</div></div>
  </div>
  <div class="section-title">📦 Todos los Productos Vendidos</div>
  <table>
    <thead><tr><th style="width:30px;">#</th><th>Producto</th><th style="width:80px;text-align:center;">Unidades</th><th style="width:100px;text-align:right;">Total S/</th></tr></thead>
    <tbody>
      ${productRows}
      <tr style="background:#f9fafb;">
        <td colspan="2" style="padding:8px 10px;font-weight:900;font-size:13px;">TOTAL</td>
        <td style="padding:8px 10px;text-align:center;font-weight:900;font-size:18px;color:#7c3aed;">${totalUnidades}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:900;font-size:13px;">${fmt(totalVentas)}</td>
      </tr>
    </tbody>
  </table>
  ${grades.length > 0 ? `
  <div class="section-title">🎒 Ventas por Grado</div>
  <table class="grade-table">
    <thead><tr><th>Grado / Sección</th><th style="width:80px;text-align:center;">Pedidos</th><th style="width:100px;text-align:right;">Total S/</th></tr></thead>
    <tbody>${gradeRows}</tbody>
  </table>` : ''}
  <div class="footer">
    <span>© MARY'S RESTAURANT — Loncheritas</span>
    <span class="total-foot">TOTAL: ${fmt(totalVentas)}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400); }
};