// ============================================================
// ARCHIVO: src/utils/oepReports.ts
// Utilidades para generar reportes del módulo OEP
// Equivalente exacto de: src/utils/fulldayReports.ts
// ============================================================

import * as XLSX from 'xlsx';
import { OEPOrder, OEPOrderItem } from '../types/oep';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';

// ── Ticket de cocina (HTML 80mm) ────────────────────────────
export const generateOEPKitchenTicketHTML = (
  orders: OEPOrder[],
  selectedDate: Date
): string => {
  const productMap = new Map<string, { name: string; quantity: number }>();

  orders.forEach(order => {
    order.items.forEach((item: OEPOrderItem) => {
      const existing = productMap.get(item.id);
      if (existing) { existing.quantity += item.quantity; }
      else { productMap.set(item.id, { name: item.name, quantity: item.quantity }); }
    });
  });

  const products   = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const formatDate = formatDateForDisplay(selectedDate);
  const formatTime = formatTimeForDisplay(new Date());

  return `
    <div class="ticket" style="font-family:'Courier New',monospace;width:80mm;padding:8px;margin:0 auto;background:white;color:black;font-size:12px;">
      <div style="text-align:center;margin-bottom:10px;">
        <div style="font-size:16px;font-weight:bold;">MARY'S RESTAURANT</div>
        <div style="font-size:12px;">OEP - PEDIDOS</div>
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

// ── Imprimir ticket de cocina ────────────────────────────────
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
          <title>Ticket OEP ${formatDateForDisplay(selectedDate)}</title>
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

// ── Reporte de cocina en Excel ───────────────────────────────
export const exportOEPKitchenReportToExcel = (orders: OEPOrder[], selectedDate: Date) => {
  const productMap = new Map<string, { name: string; quantity: number; byGrade: Map<string, number> }>();

  orders.forEach(order => {
    const gradeKey = `${order.grade} - ${order.section}`;
    order.items.forEach((item: OEPOrderItem) => {
      const existing = productMap.get(item.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.byGrade.set(gradeKey, (existing.byGrade.get(gradeKey) || 0) + item.quantity);
      } else {
        const byGrade = new Map<string, number>();
        byGrade.set(gradeKey, item.quantity);
        productMap.set(item.id, { name: item.name, quantity: item.quantity, byGrade });
      }
    });
  });

  const products   = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const wb         = XLSX.utils.book_new();
  const dateStr    = formatDateForDisplay(selectedDate).replace(/\//g, '-');

  // HOJA 1: Resumen general
  const summaryData: any[][] = [
    ['OEP - REPORTE DE PEDIDOS'],
    ['Colegio San José y El Redentor'],
    [],
    [`Fecha: ${formatDateForDisplay(selectedDate)}`],
    [`Total de pedidos: ${orders.length}`],
    [`Total de productos: ${totalItems}`],
    [],
    ['PRODUCTO', 'CANTIDAD TOTAL', '% DEL TOTAL']
  ];

  products.forEach(p => {
    summaryData.push([p.name, p.quantity, `${((p.quantity / totalItems) * 100).toFixed(1)}%`]);
  });
  summaryData.push([], ['TOTAL GENERAL', totalItems, '100%']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen OEP');

  // HOJA 2: Desglose por grado
  const allGrades   = new Set<string>();
  products.forEach(p => p.byGrade.forEach((_, grade) => allGrades.add(grade)));
  const gradesArray = Array.from(allGrades).sort();

  const detailData: any[][] = [
    ['DESGLOSE DE PRODUCTOS POR GRADO Y SECCIÓN'],
    [`Fecha: ${formatDateForDisplay(selectedDate)}`],
    [],
    ['PRODUCTO', ...gradesArray, 'TOTAL']
  ];

  products.forEach(p => {
    const row: any[] = [p.name];
    let total = 0;
    gradesArray.forEach(grade => {
      const qty = p.byGrade.get(grade) || 0;
      row.push(qty);
      total += qty;
    });
    row.push(total);
    detailData.push(row);
  });

  const totalRow: any[] = ['TOTAL POR GRADO'];
  gradesArray.forEach(grade => {
    let gradeTotal = 0;
    products.forEach(p => { gradeTotal += p.byGrade.get(grade) || 0; });
    totalRow.push(gradeTotal);
  });
  totalRow.push(totalItems);
  detailData.push([], totalRow);

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  wsDetail['!cols'] = [{ wch: 40 }, ...gradesArray.map(() => ({ wch: 12 })), { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Por Grado');

  const hora     = new Date().toLocaleTimeString('es-PE').replace(/:/g, '-');
  const fileName = `OEP_${dateStr}_${hora}.xlsx`;
  XLSX.writeFile(wb, fileName);
};