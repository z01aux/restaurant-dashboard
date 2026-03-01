// ============================================================
// ARCHIVO: src/utils/oepTicketUtils.ts
// Utilidades para tickets del módulo OEP
// ============================================================

import { OEPOrder } from '../types/oep';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';

export interface OEPTicketSummary {
    totalOrders: number;
    totalAmount: number;
    byPaymentMethod: {
        EFECTIVO: number;
        YAPE_PLIN: number;
        TARJETA: number;
        NO_APLICA: number;
    };
    topProducts: Array<{ name: string; quantity: number; total: number }>;
}

export const generateOEPTicketSummary = (orders: OEPOrder[]): OEPTicketSummary => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);

    const byPaymentMethod = {
        EFECTIVO: orders.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0),
        YAPE_PLIN: orders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0),
        TARJETA: orders.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0),
        NO_APLICA: orders.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0),
    };

    const productMap = new Map<string, { quantity: number; total: number; name: string }>();
    orders.forEach(order => {
        order.items.forEach(item => {
            const existing = productMap.get(item.id);
            if (existing) {
                existing.quantity += item.quantity;
                existing.total += item.price * item.quantity;
            } else {
                productMap.set(item.id, { name: item.name, quantity: item.quantity, total: item.price * item.quantity });
            }
        });
    });

    const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(p => ({ name: p.name, quantity: p.quantity, total: p.total }));

    return { totalOrders, totalAmount, byPaymentMethod, topProducts };
};

export const generateOEPTicketHTML = (
    summary: OEPTicketSummary,
    startDate: Date,
    endDate: Date
): string => {
    const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

    const getCurrentUserName = () => {
        try {
            const savedUser = localStorage.getItem('restaurant-user');
            if (savedUser) return JSON.parse(savedUser).name || 'Sistema';
        } catch { }
        return 'Sistema';
    };

    const periodText = formatDateForDisplay(startDate) === formatDateForDisplay(endDate)
        ? `DIA: ${formatDateForDisplay(startDate)}`
        : `PERIODO: ${formatDateForDisplay(startDate)} AL ${formatDateForDisplay(endDate)}`;

    return `
        <div class="ticket" style="font-family:'Courier New',monospace;width:80mm;padding:8px;margin:0 auto;background:white;color:black;font-size:11px;line-height:1.3;">
            <div style="text-align:center;margin-bottom:8px;">
                <div style="font-size:14px;font-weight:bold;">MARY'S RESTAURANT</div>
                <div style="font-size:10px;">OEP - REPORTE DE VENTAS</div>
                <div style="font-size:10px;">${periodText}</div>
                <div style="font-size:9px;">EMITIDO: ${formatDateForDisplay(new Date())} ${formatTimeForDisplay(new Date())}</div>
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
                            <span>${i + 1}. ${p.name.substring(0, 20)}${p.name.length > 20 ? '...' : ''}</span>
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

    const ticketContent = generateOEPTicketHTML(summary, startDate, endDate);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

    if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>OEP ${formatDateForDisplay(startDate)}</title>
                    <style>
                        @media print { @page { size: 80mm auto; margin: 0; } body { width: 80mm !important; margin: 0 auto !important; } }
                        body { margin: 0; padding: 0; background: white; font-family: 'Courier New', monospace; }
                    </style>
                </head>
                <body>${ticketContent}</body>
            </html>
        `);
        iframeDoc.close();
        setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 500);
    }
};