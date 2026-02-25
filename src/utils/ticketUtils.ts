// ============================================
// ARCHIVO: src/utils/ticketUtils.ts
// ============================================

import { Order } from '../types';

interface TicketSummary {
  totalOrders: number;
  totalAmount: number;
  byPaymentMethod: {
    EFECTIVO: number;
    YAPE_PLIN: number;
    TARJETA: number;
    NO_APLICA: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    orders: number;
    total: number;
  }>;
}

/**
 * Genera un resumen para ticket a partir de las órdenes
 */
export const generateTicketSummary = (orders: Order[], startDate: Date, endDate: Date): TicketSummary => {
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);

  // Totales por método de pago
  const byPaymentMethod = {
    EFECTIVO: orders.filter(o => o.paymentMethod === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0),
    YAPE_PLIN: orders.filter(o => o.paymentMethod === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0),
    TARJETA: orders.filter(o => o.paymentMethod === 'TARJETA').reduce((sum, o) => sum + o.total, 0),
    NO_APLICA: orders.filter(o => !o.paymentMethod).reduce((sum, o) => sum + o.total, 0),
  };

  // Top productos
  const productMap = new Map<string, { quantity: number; total: number; name: string }>();
  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.menuItem.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += item.menuItem.price * item.quantity;
      } else {
        productMap.set(item.menuItem.id, {
          name: item.menuItem.name,
          quantity: item.quantity,
          total: item.menuItem.price * item.quantity
        });
      }
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      quantity: p.quantity,
      total: p.total
    }));

  // Desglose diario
  const dailyMap = new Map<string, { orders: number; total: number }>();
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toLocaleDateString('es-PE');
    dailyMap.set(dateStr, { orders: 0, total: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  orders.forEach(order => {
    const dateStr = order.createdAt.toLocaleDateString('es-PE');
    const day = dailyMap.get(dateStr);
    if (day) {
      day.orders++;
      day.total += order.total;
    }
  });

  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      orders: data.orders,
      total: data.total
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalOrders,
    totalAmount,
    byPaymentMethod,
    topProducts,
    dailyBreakdown
  };
};

/**
 * Genera el contenido HTML para el ticket de resumen (SIN EMOTICONES)
 */
export const generateResumenTicketHTML = (
  summary: TicketSummary,
  startDate: Date,
  endDate: Date
): string => {
  const formatDate = (date: Date) => date.toLocaleDateString('es-PE');
  const formatTime = () => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`;

  const getCurrentUserName = () => {
    try {
      const savedUser = localStorage.getItem('restaurant-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        return userData.name || 'Sistema';
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
    }
    return 'Sistema';
  };

  const periodText = startDate.toDateString() === endDate.toDateString()
    ? `DIA: ${formatDate(startDate)}`
    : `PERIODO: ${formatDate(startDate)} AL ${formatDate(endDate)}`;

  return `
    <div class="ticket" style="font-family: 'Courier New', monospace; width: 80mm; padding: 8px; margin: 0 auto; background: white; color: black; font-size: 11px; line-height: 1.3;">
      
      <!-- HEADER -->
      <div style="text-align: center; margin-bottom: 8px;">
        <div style="font-size: 14px; font-weight: bold;">MARY'S RESTAURANT</div>
        <div style="font-size: 10px;">INVERSIONES AROMO S.A.C.</div>
        <div style="font-size: 10px;">RUC: 20505262086</div>
        <div style="font-size: 9px;">${periodText}</div>
        <div style="font-size: 9px;">EMITIDO: ${formatDate(new Date())} ${formatTime()}</div>
        <div style="font-size: 9px;">USUARIO: ${getCurrentUserName().toUpperCase()}</div>
        <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
      </div>

      <!-- RESUMEN GENERAL -->
      <div style="margin-bottom: 8px;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">RESUMEN GENERAL</div>
        <div style="display: flex; justify-content: space-between;">
          <span>TOTAL ORDENES:</span>
          <span style="font-weight: bold;">${summary.totalOrders}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>TOTAL VENTAS:</span>
          <span style="font-weight: bold;">${formatCurrency(summary.totalAmount)}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

      <!-- METODO DE PAGO -->
      <div style="margin-bottom: 8px;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">METODO DE PAGO</div>
        <div style="display: flex; justify-content: space-between;">
          <span>EFECTIVO:</span>
          <span>${formatCurrency(summary.byPaymentMethod.EFECTIVO)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>YAPE/PLIN:</span>
          <span>${formatCurrency(summary.byPaymentMethod.YAPE_PLIN)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>TARJETA:</span>
          <span>${formatCurrency(summary.byPaymentMethod.TARJETA)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>NO APLICA:</span>
          <span>${formatCurrency(summary.byPaymentMethod.NO_APLICA)}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

      <!-- TOP 5 PRODUCTOS -->
      ${summary.topProducts.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">TOP 5 PRODUCTOS</div>
          ${summary.topProducts.map((p, i) => `
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>${i+1}. ${p.name.substring(0, 20)}${p.name.length > 20 ? '...' : ''}</span>
              <span>${p.quantity}x ${formatCurrency(p.total)}</span>
            </div>
          `).join('')}
        </div>
        <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
      ` : ''}

      <!-- DESGLOSE DIARIO -->
      ${summary.dailyBreakdown.length > 1 ? `
        <div style="margin-bottom: 8px;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">DESGLOSE DIARIO</div>
          ${summary.dailyBreakdown.map(day => `
            <div style="display: flex; justify-content: space-between; font-size: 9px;">
              <span>${day.date}:</span>
              <span>${day.orders} ped - ${formatCurrency(day.total)}</span>
            </div>
          `).join('')}
        </div>
        <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
      ` : ''}

      <!-- FOOTER -->
      <div style="text-align: center; font-size: 9px;">
        <div>GRACIAS POR SU TRABAJO</div>
        <div style="margin-top: 4px;">********************************</div>
      </div>
    </div>
  `;
};

/**
 * Imprime el ticket de resumen
 */
export const printResumenTicket = (summary: TicketSummary, startDate: Date, endDate: Date) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);

  const ticketContent = generateResumenTicketHTML(summary, startDate, endDate);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resumen ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
                padding: 0;
              }
              body {
                width: 80mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
                background: white !important;
                font-family: 'Courier New', monospace !important;
              }
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: 'Courier New', monospace;
            }
            .ticket {
              font-family: 'Courier New', monospace;
            }
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
