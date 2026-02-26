// ============================================
// ARCHIVO: src/utils/fulldayReports.ts
// Utilidades para generar reportes de FullDay (Cocina)
// ============================================

import * as XLSX from 'xlsx';
import { FullDayOrder } from '../hooks/useFullDay';
import { formatDateForDisplay, formatTimeForDisplay } from './dateUtils';

// ============================================
// REPORTE DE COCINA (TICKET 80mm)
// ============================================
export const generateKitchenTicketHTML = (
  orders: FullDayOrder[],
  selectedDate: Date
): string => {
  // Agrupar productos
  const productMap = new Map<string, { name: string; quantity: number }>();
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        productMap.set(item.id, {
          name: item.name,
          quantity: item.quantity
        });
      }
    });
  });

  const products = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);

  const formatDate = formatDateForDisplay(selectedDate);
  const formatTime = formatTimeForDisplay(new Date());

  return `
    <div class="ticket" style="font-family: 'Courier New', monospace; width: 80mm; padding: 8px; margin: 0 auto; background: white; color: black; font-size: 12px;">
      
      <!-- HEADER -->
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 16px; font-weight: bold;">MARY'S RESTAURANT</div>
        <div style="font-size: 12px;">COCINA - FULLDAY</div>
        <div style="font-size: 11px;">${formatDate}</div>
        <div style="font-size: 10px;">${formatTime}</div>
        <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
      </div>

      <!-- PRODUCTOS -->
      ${products.map(p => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
          <span style="font-weight: bold;">${p.name}</span>
          <span style="font-weight: bold;">${p.quantity}</span>
        </div>
      `).join('')}

      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

      <!-- TOTAL -->
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px;">
        <span>TOTAL PLATOS:</span>
        <span>${totalItems}</span>
      </div>

      <!-- FOOTER -->
      <div style="text-align: center; margin-top: 10px; font-size: 10px;">
        <div>===========================</div>
      </div>
    </div>
  `;
};

// ============================================
// REPORTE DE COCINA (EXCEL PROFESIONAL)
// ============================================
export const exportKitchenReportToExcel = (orders: FullDayOrder[], selectedDate: Date) => {
  console.log('👨‍🍳 Generando reporte de cocina...');
  
  // Agrupar productos
  const productMap = new Map<string, { name: string; quantity: number; byGrade: Map<string, number> }>();
  
  orders.forEach(order => {
    const gradeKey = `${order.grade} - ${order.section}`;
    
    order.items.forEach(item => {
      const existing = productMap.get(item.id);
      if (existing) {
        existing.quantity += item.quantity;
        
        const gradeCount = existing.byGrade.get(gradeKey) || 0;
        existing.byGrade.set(gradeKey, gradeCount + item.quantity);
      } else {
        const byGrade = new Map<string, number>();
        byGrade.set(gradeKey, item.quantity);
        
        productMap.set(item.id, {
          name: item.name,
          quantity: item.quantity,
          byGrade
        });
      }
    });
  });

  const products = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);

  // Crear libro de Excel
  const wb = XLSX.utils.book_new();
  const dateStr = formatDateForDisplay(selectedDate).replace(/\//g, '-');

  // HOJA 1: RESUMEN GENERAL COCINA
  const summaryData: any[][] = [
    ['👨‍🍳 REPORTE DE COCINA - FULLDAY'],
    ['Colegio San José y El Redentor'],
    [],
    [`Fecha: ${formatDateForDisplay(selectedDate)}`],
    [`Total de pedidos: ${orders.length}`],
    [`Total de productos: ${totalItems}`],
    [],
    ['PRODUCTO', 'CANTIDAD TOTAL', '% DEL TOTAL']
  ];

  products.forEach(p => {
    const porcentaje = ((p.quantity / totalItems) * 100).toFixed(1);
    summaryData.push([p.name, p.quantity, `${porcentaje}%`]);
  });

  summaryData.push([]);
  summaryData.push(['TOTAL GENERAL', totalItems, '100%']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 40 },
    { wch: 15 },
    { wch: 10 }
  ];
  
  XLSX.utils.book_append_sheet(wb, wsSummary, '👨‍🍳 Resumen Cocina');

  // HOJA 2: DESGLOSE POR GRADO (para que cocina sepa a dónde va cada cosa)
  const allGrades = new Set<string>();
  products.forEach(p => {
    p.byGrade.forEach((_, grade) => allGrades.add(grade));
  });

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

  // Agregar totales por grado
  const totalRow: any[] = ['TOTAL POR GRADO'];
  gradesArray.forEach(grade => {
    let gradeTotal = 0;
    products.forEach(p => {
      gradeTotal += p.byGrade.get(grade) || 0;
    });
    totalRow.push(gradeTotal);
  });
  totalRow.push(totalItems);
  
  detailData.push([]);
  detailData.push(totalRow);

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  wsDetail['!cols'] = [
    { wch: 40 },
    ...gradesArray.map(() => ({ wch: 12 })),
    { wch: 12 }
  ];
  
  XLSX.utils.book_append_sheet(wb, wsDetail, '📋 Por Grado');

  // Guardar archivo
  const hora = new Date().toLocaleTimeString('es-PE').replace(/:/g, '-');
  const fileName = `COCINA_${dateStr}_${hora}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
  console.log('✅ Reporte de cocina generado:', fileName);
};

// ============================================
// IMPRIMIR TICKET DE COCINA
// ============================================
export const printKitchenTicket = (orders: FullDayOrder[], selectedDate: Date) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);

  const ticketContent = generateKitchenTicketHTML(orders, selectedDate);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket Cocina ${formatDateForDisplay(selectedDate)}</title>
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
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
};