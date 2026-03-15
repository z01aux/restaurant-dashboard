// ============================================
// ARCHIVO: src/utils/fulldayTicketUtils.ts
// ✅ ACTUALIZADO: Mismo formato, estilo y datos que ticketUtils.ts (Órdenes)
//    - PAGO MIXTO distribuido en sus métodos
//    - TODOS los productos vendidos (no solo top 5)
//    - Desglose diario (cuando el rango es > 1 día)
//    - Centrado y autoajuste para impresión correcta
//    - Estilos bold + uppercase + separadores dashed
// ============================================

import { FullDayOrder } from '../types/fullday';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';

interface FullDayTicketSummary {
  totalOrders: number;
  totalAmount: number;
  byPaymentMethod: {
    EFECTIVO: number;
    YAPE_PLIN: number;
    TARJETA: number;
    NO_APLICA: number;
  };
  // TODOS los productos vendidos (no solo top 5)
  productsSold: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
  // Desglose diario (igual que Órdenes)
  dailyBreakdown: Array<{
    date: string;
    orders: number;
    total: number;
  }>;
}

/**
 * Genera el resumen para el ticket FullDay
 * PAGO MIXTO se distribuye en sus métodos correspondientes (igual que Órdenes)
 */
export const generateFullDayTicketSummary = (
  orders: FullDayOrder[],
  startDate: Date,
  endDate: Date
): FullDayTicketSummary => {
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);

  // Totales por método de pago — MIXTO se distribuye en sus componentes
  let efectivo = 0;
  let yapePlin = 0;
  let tarjeta  = 0;
  let noAplica = 0;

  orders.forEach(order => {
    if (order.payment_method === 'MIXTO' && order.split_payment) {
      efectivo += order.split_payment.efectivo || 0;
      yapePlin += order.split_payment.yapePlin  || 0;
      tarjeta  += order.split_payment.tarjeta   || 0;
    } else {
      switch (order.payment_method) {
        case 'EFECTIVO':  efectivo += order.total; break;
        case 'YAPE/PLIN': yapePlin += order.total; break;
        case 'TARJETA':   tarjeta  += order.total; break;
        default:          noAplica += order.total; break;
      }
    }
  });

  // TODOS los productos vendidos (ordenados por cantidad)
  const productMap = new Map<string, { quantity: number; total: number; name: string }>();
  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total    += item.price * item.quantity;
      } else {
        productMap.set(item.id, {
          name:     item.name,
          quantity: item.quantity,
          total:    item.price * item.quantity
        });
      }
    });
  });

  const productsSold = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity); // todos, sin slice

  // Desglose diario (igual que Órdenes)
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
    dailyBreakdown
  };
};

/**
 * Genera el HTML del ticket — idéntico en estilo al de Órdenes
 * (bold, uppercase, dashed, centrado, autoajuste)
 */
export const generateFullDayTicketHTML = (
  summary: FullDayTicketSummary,
  startDate: Date,
  endDate: Date
): string => {
  const fmt = (amount: number) => `S/ ${amount.toFixed(2)}`;

  const getCurrentUserName = () => {
    try {
      const savedUser = localStorage.getItem('restaurant-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        return userData.name || 'Sistema';
      }
    } catch { /* noop */ }
    return 'Sistema';
  };

  const periodText = formatDateForDisplay(startDate) === formatDateForDisplay(endDate)
    ? `DIA: ${formatDateForDisplay(startDate)}`
    : `PERIODO: ${formatDateForDisplay(startDate)} AL ${formatDateForDisplay(endDate)}`;

  return `
    <div class="ticket" style="font-family: 'Courier New', monospace; width: 100%; max-width: 80mm; margin: 0 auto; padding: 8px; background: white; color: black; font-size: 12px; line-height: 1.3; font-weight: bold; text-transform: uppercase; box-sizing: border-box;">

      <!-- HEADER -->
      <div style="text-align: center; margin-bottom: 10px; width: 100%;">
        <div style="font-size: 16px; font-weight: bold; text-align: center;">MARY'S RESTAURANT</div>
        <div style="font-size: 12px; font-weight: bold; text-align: center;">INVERSIONES AROMO S.A.C.</div>
        <div style="font-size: 12px; font-weight: bold; text-align: center;">RUC: 20505262086</div>
        <div style="font-size: 11px; font-weight: bold; text-align: center;">FULLDAY - RESUMEN</div>
        <div style="font-size: 11px; font-weight: bold; text-align: center;">${periodText}</div>
        <div style="font-size: 10px; font-weight: bold; text-align: center;">EMITIDO: ${formatDateForDisplay(new Date())} ${formatTimeForDisplay(new Date())}</div>
        <div style="font-size: 10px; font-weight: bold; text-align: center;">USUARIO: ${getCurrentUserName().toUpperCase()}</div>
        <div style="border-top: 1px dashed #000; margin: 8px auto; width: 100%;"></div>
      </div>

      <!-- RESUMEN GENERAL -->
      <div style="margin-bottom: 8px; width: 100%;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 4px; font-size: 12px; width: 100%;">RESUMEN GENERAL</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; font-weight: bold; width: 100%;">
          <span>TOTAL PEDIDOS:</span>
          <span>${summary.totalOrders}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; font-weight: bold; width: 100%;">
          <span>TOTAL VENTAS:</span>
          <span>${fmt(summary.totalAmount)}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px auto; width: 100%;"></div>

      <!-- MÉTODOS DE PAGO (solo los que tienen monto > 0) -->
      <div style="margin-bottom: 8px; width: 100%;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 4px; font-size: 12px; width: 100%;">METODO DE PAGO</div>
        ${summary.byPaymentMethod.EFECTIVO > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; font-weight: bold; width: 100%;">
            <span>EFECTIVO:</span><span>${fmt(summary.byPaymentMethod.EFECTIVO)}</span>
          </div>` : ''}
        ${summary.byPaymentMethod.YAPE_PLIN > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; font-weight: bold; width: 100%;">
            <span>YAPE/PLIN:</span><span>${fmt(summary.byPaymentMethod.YAPE_PLIN)}</span>
          </div>` : ''}
        ${summary.byPaymentMethod.TARJETA > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; font-weight: bold; width: 100%;">
            <span>TARJETA:</span><span>${fmt(summary.byPaymentMethod.TARJETA)}</span>
          </div>` : ''}

        ${summary.byPaymentMethod.NO_APLICA > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; font-weight: bold; width: 100%;">
            <span>NO APLICA:</span><span>${fmt(summary.byPaymentMethod.NO_APLICA)}</span>
          </div>` : ''}
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px auto; width: 100%;"></div>

      <!-- PRODUCTOS VENDIDOS (TODOS, igual que Órdenes) -->
      ${summary.productsSold.length > 0 ? `
        <div style="margin-bottom: 8px; width: 100%;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 4px; font-size: 12px; width: 100%;">PRODUCTOS VENDIDOS</div>
          ${summary.productsSold.map(p => `
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 3px; width: 100%;">
              <span>${p.name}</span>
              <span>${p.quantity}</span>
            </div>
          `).join('')}
          <div style="border-top: 1px dashed #000; margin: 8px auto; width: 100%;"></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; width: 100%;">
            <span>TOTAL PRODUCTOS:</span>
            <span>${summary.productsSold.reduce((sum, p) => sum + p.quantity, 0)}</span>
          </div>
        </div>
        <div style="border-top: 1px dashed #000; margin: 8px auto; width: 100%;"></div>
      ` : ''}

      <!-- DESGLOSE DIARIO (solo si rango > 1 día, igual que Órdenes) -->
      ${summary.dailyBreakdown.length > 1 ? `
        <div style="margin-bottom: 8px; width: 100%;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 4px; font-size: 12px; width: 100%;">DESGLOSE DIARIO</div>
          ${summary.dailyBreakdown.map(day => `
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 3px; width: 100%;">
              <span>${day.date}:</span>
              <span>${day.orders} PED - ${fmt(day.total)}</span>
            </div>
          `).join('')}
        </div>
        <div style="border-top: 1px dashed #000; margin: 8px auto; width: 100%;"></div>
      ` : ''}

      <!-- FOOTER -->
      <div style="text-align: center; margin-top: 10px; font-size: 10px; font-weight: bold; width: 100%;">
        <div>GRACIAS POR SU TRABAJO</div>
        <div style="margin-top: 4px;">********************************</div>
      </div>

    </div>
  `;
};

/**
 * Imprime el ticket con configuración idéntica a Órdenes
 * (centrado, autoajuste, @page 80mm auto, html centrado)
 */
export const printFullDayResumenTicket = (
  summary: FullDayTicketSummary,
  startDate: Date,
  endDate: Date
) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right  = '0';
  iframe.style.bottom = '0';
  iframe.style.width  = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const ticketContent = generateFullDayTicketHTML(summary, startDate, endDate);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FullDay ${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}</title>
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
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  }
};
