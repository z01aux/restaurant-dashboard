// ============================================
// ARCHIVO: src/utils/oepTicketUtils.ts
// ✅ ACTUALIZADO: Mismo formato, estilo y datos que ticketUtils.ts (Órdenes)
//    - PAGO MIXTO distribuido en sus métodos (no aparece línea MIXTO)
//    - TODOS los productos vendidos con total de platos
//    - Desglose diario (cuando el rango es > 1 día)
//    - Centrado y autoajuste correcto para impresora de 80mm
//    - bold + uppercase + separadores dashed
// ============================================

import { OEPOrder } from '../types/oep';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';

interface OEPTicketSummary {
  totalOrders: number;
  totalAmount: number;
  byPaymentMethod: {
    EFECTIVO:  number;
    YAPE_PLIN: number;
    TARJETA:   number;
    NO_APLICA: number;
  };
  // Todos los productos vendidos (no solo top 5)
  productsSold: Array<{ name: string; quantity: number; total: number }>;
  // Desglose diario
  dailyBreakdown: Array<{ date: string; orders: number; total: number }>;
}

/**
 * Genera el resumen para el ticket OEP.
 * PAGO MIXTO se distribuye en sus métodos (igual que Órdenes).
 */
export const generateOEPTicketSummary = (
  orders: OEPOrder[],
  startDate: Date,
  endDate: Date
): OEPTicketSummary => {
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);

  // Totales por método — MIXTO distribuido, NO aparece como línea propia
  let efectivo = 0;
  let yapePlin = 0;
  let tarjeta  = 0;
  let noAplica = 0;

  orders.forEach(order => {
    const method = order.payment_method as string | null;
    const sp = (order as any).split_payment;
    if (method === 'MIXTO' && sp) {
      efectivo += sp.efectivo || 0;
      yapePlin += sp.yapePlin  || 0;
      tarjeta  += sp.tarjeta   || 0;
    } else {
      switch (method) {
        case 'EFECTIVO':  efectivo += order.total; break;
        case 'YAPE/PLIN': yapePlin += order.total; break;
        case 'TARJETA':   tarjeta  += order.total; break;
        default:          noAplica += order.total; break;
      }
    }
  });

  // Todos los productos
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  orders.forEach(order => {
    order.items.forEach(item => {
      const ex = productMap.get(item.id);
      if (ex) {
        ex.quantity += item.quantity;
        ex.total    += item.price * item.quantity;
      } else {
        productMap.set(item.id, {
          name:     item.name,
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
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
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

const getCurrentUserName = (): string => {
  try {
    const saved = localStorage.getItem('restaurant-user');
    if (saved) return JSON.parse(saved).name || 'Sistema';
  } catch { /* noop */ }
  return 'Sistema';
};

/**
 * Genera el HTML del ticket — idéntico en estilo al de Órdenes.
 */
export const generateOEPTicketHTML = (
  summary: OEPTicketSummary,
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
        <div style="font-size:11px;font-weight:bold;text-align:center;">OEP - RESUMEN</div>
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

      <!-- MÉTODOS DE PAGO (solo los que tienen monto > 0; MIXTO ya distribuido) -->
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
            <span>TOTAL PLATOS:</span>
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

/**
 * Imprime el ticket con configuración idéntica a Órdenes.
 */
export const printOEPResumenTicket = (
  summary: OEPTicketSummary,
  startDate: Date,
  endDate: Date
) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const ticketContent = generateOEPTicketHTML(summary, startDate, endDate);
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OEP ${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
                padding: 0;
              }
              html, body {
                width: 80mm;
                margin: 0 auto !important;
                padding: 0 !important;
                background: white !important;
              }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: auto;
                font-family: 'Courier New', monospace !important;
                font-size: 12px !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
              }
              * {
                font-family: 'Courier New', monospace !important;
                font-weight: bold !important;
                box-sizing: border-box !important;
              }
              .ticket {
                width: 78mm !important;
                max-width: 78mm !important;
                margin: 0 auto !important;
                padding: 4mm !important;
                background: white !important;
                color: black !important;
                box-sizing: border-box !important;
              }
            }
            @media screen {
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                background: #f0f0f0;
                font-family: 'Courier New', monospace;
              }
              .ticket {
                width: 80mm;
                margin: 0 auto;
                padding: 8px;
                background: white;
                color: black;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                border-radius: 4px;
              }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .ticket {
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              padding: 8px;
              box-sizing: border-box;
            }
            .ticket > div { width: 100%; }
          </style>
        </head>
        <body>
          ${ticketContent}
        </body>
      </html>
    `);
    iframeDoc.close();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
};
