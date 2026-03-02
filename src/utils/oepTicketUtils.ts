// ARCHIVO: src/utils/oepTicketUtils.ts
// =========================================

import { OEPOrder } from '../types/oep';

const formatDate = (d: Date) =>
  d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (d: Date) =>
  d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

interface OEPTicketSummary {
  totalOrders: number;
  totalAmount: number;
  byPaymentMethod: { EFECTIVO: number; YAPE_PLIN: number; TARJETA: number; NO_APLICA: number };
  topProducts: Array<{ name: string; quantity: number; total: number }>;
}

export const generateOEPTicketSummary = (orders: OEPOrder[]): OEPTicketSummary => {
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  orders.forEach(o => o.items.forEach(item => {
    const ex = productMap.get(item.id);
    if (ex) { ex.quantity += item.quantity; ex.total += item.price * item.quantity; }
    else productMap.set(item.id, { name: item.name, quantity: item.quantity, total: item.price * item.quantity });
  }));

  return {
    totalOrders: orders.length,
    totalAmount: orders.reduce((s, o) => s + o.total, 0),
    byPaymentMethod: {
      EFECTIVO:  orders.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0),
      YAPE_PLIN: orders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0),
      TARJETA:   orders.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0),
      NO_APLICA: orders.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0),
    },
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity).slice(0, 5),
  };
};

const getCurrentUserName = (): string => {
  try {
    const saved = localStorage.getItem('restaurant-user');
    if (saved) return JSON.parse(saved).name || 'Sistema';
  } catch {}
  return 'Sistema';
};

export const generateOEPTicketHTML = (
  summary: OEPTicketSummary,
  startDate: Date,
  endDate: Date
): string => {
  const fmt = (n: number) => `S/ ${n.toFixed(2)}`;
  const periodText =
    formatDate(startDate) === formatDate(endDate)
      ? `DIA: ${formatDate(startDate)}`
      : `PERIODO: ${formatDate(startDate)} AL ${formatDate(endDate)}`;

  return `
    <div style="font-family:'Courier New',monospace;width:80mm;padding:8px;margin:0 auto;background:white;color:black;font-size:11px;line-height:1.3;">
      <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:14px;font-weight:bold;">MARY'S RESTAURANT</div>
        <div style="font-size:10px;">OEP - PEDIDOS</div>
        <div style="font-size:10px;">${periodText}</div>
        <div style="font-size:9px;">EMITIDO: ${formatDate(new Date())} ${formatTime(new Date())}</div>
        <div style="font-size:9px;">USUARIO: ${getCurrentUserName().toUpperCase()}</div>
        <div style="border-top:1px dashed #000;margin:8px 0;"></div>
      </div>
      <div style="margin-bottom:8px;">
        <div style="text-align:center;font-weight:bold;margin-bottom:4px;">RESUMEN GENERAL</div>
        <div style="display:flex;justify-content:space-between;"><span>TOTAL PEDIDOS:</span><span style="font-weight:bold;">${summary.totalOrders}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>TOTAL VENTAS:</span><span style="font-weight:bold;">${fmt(summary.totalAmount)}</span></div>
      </div>
      <div style="border-top:1px dashed #000;margin:8px 0;"></div>
      <div style="margin-bottom:8px;">
        <div style="text-align:center;font-weight:bold;margin-bottom:4px;">METODO DE PAGO</div>
        <div style="display:flex;justify-content:space-between;"><span>EFECTIVO:</span><span>${fmt(summary.byPaymentMethod.EFECTIVO)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>YAPE/PLIN:</span><span>${fmt(summary.byPaymentMethod.YAPE_PLIN)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>TARJETA:</span><span>${fmt(summary.byPaymentMethod.TARJETA)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>NO APLICA:</span><span>${fmt(summary.byPaymentMethod.NO_APLICA)}</span></div>
      </div>
      <div style="border-top:1px dashed #000;margin:8px 0;"></div>
      ${summary.topProducts.length > 0 ? `
        <div style="margin-bottom:8px;">
          <div style="text-align:center;font-weight:bold;margin-bottom:4px;">TOP 5 PRODUCTOS</div>
          ${summary.topProducts.map((p, i) => `
            <div style="display:flex;justify-content:space-between;font-size:10px;">
              <span>${i+1}. ${p.name.substring(0,20)}${p.name.length>20?'...':''}</span>
              <span>${p.quantity}x ${fmt(p.total)}</span>
            </div>
          `).join('')}
        </div>
        <div style="border-top:1px dashed #000;margin:8px 0;"></div>
      ` : ''}
      <div style="text-align:center;font-size:9px;">
        <div>GRACIAS POR SU TRABAJO</div>
        <div style="margin-top:4px;">********************************</div>
      </div>
    </div>
  `;
};

export const printOEPResumenTicket = (summary: OEPTicketSummary, startDate: Date, endDate: Date) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html><head><title>OEP ${formatDate(startDate)}</title>
      <style>
        @media print { @page { size:80mm auto;margin:0; } body { width:80mm !important;margin:0 auto !important;padding:0 !important; } }
        body { margin:0;padding:0;background:white;font-family:'Courier New',monospace; }
      </style></head><body>${generateOEPTicketHTML(summary, startDate, endDate)}</body></html>`);
    iframeDoc.close();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  }
};
