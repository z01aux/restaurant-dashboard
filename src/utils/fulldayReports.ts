// ============================================
// ARCHIVO: src/utils/fulldayReports.ts
// Utilidades para generar reportes de FullDay
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
// REPORTE DE COCINA (EXCEL)
// ============================================
export const exportKitchenReportToExcel = (orders: FullDayOrder[], selectedDate: Date) => {
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

  // HOJA 1: RESUMEN GENERAL
  const summaryData: any[][] = [
    ['REPORTE DE COCINA - FULLDAY'],
    [`Fecha: ${formatDateForDisplay(selectedDate)}`],
    [],
    ['PRODUCTO', 'CANTIDAD TOTAL']
  ];

  products.forEach(p => {
    summaryData.push([p.name, p.quantity]);
  });

  summaryData.push([]);
  summaryData.push(['TOTAL PLATOS', totalItems]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Cocina');

  // HOJA 2: DESGLOSE POR GRADO
  const allGrades = new Set<string>();
  products.forEach(p => {
    p.byGrade.forEach((_, grade) => allGrades.add(grade));
  });

  const gradesArray = Array.from(allGrades).sort();

  const detailData: any[][] = [
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

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Por Grado');

  // Guardar archivo
  const dateStr = selectedDate.toISOString().split('T')[0];
  XLSX.writeFile(wb, `cocina_fullday_${dateStr}.xlsx`);
};

// ============================================
// REPORTE ADMINISTRATIVO (EXCEL COMPLETO)
// ============================================
export const exportAdminReportToExcel = (orders: FullDayOrder[], selectedDate: Date) => {
  // Agrupar por grado y sección
  const groupedByGrade: Record<string, FullDayOrder[]> = {};
  
  orders.forEach(order => {
    const key = `${order.grade} - Sección ${order.section}`;
    if (!groupedByGrade[key]) groupedByGrade[key] = [];
    groupedByGrade[key].push(order);
  });

  // Calcular totales
  const totalVentas = orders.reduce((sum, o) => sum + o.total, 0);
  const totalEfectivo = orders.filter(o => o.payment_method === 'EFECTIVO').reduce((sum, o) => sum + o.total, 0);
  const totalYape = orders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((sum, o) => sum + o.total, 0);
  const totalTarjeta = orders.filter(o => o.payment_method === 'TARJETA').reduce((sum, o) => sum + o.total, 0);
  const totalNoAplica = orders.filter(o => !o.payment_method).reduce((sum, o) => sum + o.total, 0);

  // Crear libro
  const wb = XLSX.utils.book_new();

  // HOJA 1: RESUMEN GENERAL
  const summaryData: any[][] = [
    ['REPORTE ADMINISTRATIVO - FULLDAY'],
    [`Fecha: ${formatDateForDisplay(selectedDate)}`],
    [`Total Pedidos: ${orders.length}`],
    [`Total Ventas: S/ ${totalVentas.toFixed(2)}`],
    [],
    ['RESUMEN POR MÉTODO DE PAGO'],
    ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`, `${((totalEfectivo / totalVentas) * 100).toFixed(1)}%`],
    ['YAPE/PLIN', `S/ ${totalYape.toFixed(2)}`, `${((totalYape / totalVentas) * 100).toFixed(1)}%`],
    ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`, `${((totalTarjeta / totalVentas) * 100).toFixed(1)}%`],
    ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`, `${((totalNoAplica / totalVentas) * 100).toFixed(1)}%`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // HOJA 2: DETALLE POR GRADO
  const detailData: any[][] = [
    ['GRADO', 'SECCIÓN', 'ALUMNO', 'APODERADO', 'TELÉFONO', 'PAGO', 'PRODUCTOS', 'TOTAL']
  ];

  Object.keys(groupedByGrade).sort().forEach(gradeKey => {
    groupedByGrade[gradeKey].forEach(order => {
      const productos = order.items.map(item => 
        `${item.quantity}x ${item.name}`
      ).join(', ');
      
      detailData.push([
        order.grade,
        order.section,
        order.student_name,
        order.guardian_name,
        order.phone || '---',
        order.payment_method || 'NO APLICA',
        productos,
        `S/ ${order.total.toFixed(2)}`
      ]);
    });
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle');

  // HOJA 3: TOP PRODUCTOS
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += item.price * item.quantity;
      } else {
        productMap.set(item.id, {
          name: item.name,
          quantity: item.quantity,
          total: item.price * item.quantity
        });
      }
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .map(p => [p.name, p.quantity, `S/ ${p.total.toFixed(2)}`]);

  const productsData: any[][] = [
    ['PRODUCTO', 'CANTIDAD', 'TOTAL VENDIDO'],
    ...topProducts
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Productos');

  // Guardar archivo
  const dateStr = selectedDate.toISOString().split('T')[0];
  XLSX.writeFile(wb, `administrativo_fullday_${dateStr}.xlsx`);
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