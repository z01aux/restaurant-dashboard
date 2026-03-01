// ============================================================
// ARCHIVO: src/utils/oepReports.ts (CORREGIDO - SIN XLSX)
// Utilidades para generar reportes de cocina del módulo OEP
// ============================================================

import { OEPOrder } from '../types/oep';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';

export const generateOEPKitchenTicketHTML = (
    orders: OEPOrder[],
    selectedDate: Date
): string => {
    const productMap = new Map<string, { name: string; quantity: number }>();

    orders.forEach(order => {
        order.items.forEach(item => {
            const existing = productMap.get(item.id);
            if (existing) {
                existing.quantity += item.quantity;
            } else {
                productMap.set(item.id, { name: item.name, quantity: item.quantity });
            }
        });
    });

    const products = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const formatDate = formatDateForDisplay(selectedDate);
    const formatTime = formatTimeForDisplay(new Date());

    return `
        <div class="ticket" style="font-family:'Courier New',monospace;width:80mm;padding:8px;margin:0 auto;background:white;color:black;font-size:12px;">
            <div style="text-align:center;margin-bottom:10px;">
                <div style="font-size:16px;font-weight:bold;">MARY'S RESTAURANT</div>
                <div style="font-size:12px;">OEP - REPORTE DE COCINA</div>
                <div style="font-size:11px;">${formatDate}</div>
                <div style="font-size:10px;">${formatTime}</div>
                <div style="border-top:1px dashed #000;margin:8px 0;"></div>
            </div>

            ${products.map(p => `
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;">
                    <span style="font-weight:bold;">${p.name}</span>
                    <span style="font-weight:bold;">${p.quantity}</span>
                </div>
            `).join('')}

            <div style="border-top:1px dashed #000;margin:8px 0;"></div>

            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:12px;">
                <span>TOTAL PLATOS:</span>
                <span>${totalItems}</span>
            </div>

            <div style="text-align:center;margin-top:10px;font-size:10px;">
                <div>===========================</div>
            </div>
        </div>
    `;
};

export const printOEPKitchenTicket = (orders: OEPOrder[], selectedDate: Date) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const ticketContent = generateOEPKitchenTicketHTML(orders, selectedDate);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

    if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Ticket OEP Cocina ${formatDateForDisplay(selectedDate)}</title>
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