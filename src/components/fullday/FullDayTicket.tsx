// ============================================
// ARCHIVO: src/components/fullday/FullDayTicket.tsx
// Ticket de impresión y PDF para pedidos FullDay
// ============================================

import React from 'react';
import { FullDayOrder } from '../../types/fullday';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface FullDayTicketProps {
  order: FullDayOrder;
}

const FullDayTicket: React.FC<FullDayTicketProps> = ({ order }) => {

  const TICKET_WIDTH = 80;
  const PAGE_WIDTH = TICKET_WIDTH * 2.83465;
  const FONT_SIZE_SMALL = 8;
  const FONT_SIZE_NORMAL = 9;
  const FONT_SIZE_LARGE = 10;
  const FONT_SIZE_XLARGE = 11;
  const FONT_SIZE_PRODUCT = 10;
  const PADDING = 8;

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

  const getPaymentText = () => {
    const map: Record<string, string> = {
      'EFECTIVO': 'EFECTIVO',
      'YAPE/PLIN': 'YAPE/PLIN',
      'TARJETA': 'TARJETA',
    };
    return order.payment_method ? map[order.payment_method] || 'NO APLICA' : 'NO APLICA';
  };

  // ── ESTILOS PDF ──────────────────────────────────────────────
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: PADDING,
      fontSize: FONT_SIZE_NORMAL,
      fontFamily: 'Helvetica',
      width: PAGE_WIDTH,
    },
    header: { textAlign: 'center', marginBottom: 6, borderBottom: '1pt solid #000', paddingBottom: 4 },
    title: { fontSize: FONT_SIZE_XLARGE, fontWeight: 'bold', marginBottom: 2 },
    subtitle: { fontSize: FONT_SIZE_SMALL, marginBottom: 1 },
    divider: { borderBottom: '1pt solid #000', marginVertical: 3 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    label: { fontWeight: 'bold', fontSize: FONT_SIZE_SMALL },
    value: { fontSize: FONT_SIZE_SMALL, maxWidth: '65%', flexWrap: 'wrap' },
    valueBold: { fontWeight: 'bold', fontSize: FONT_SIZE_SMALL, maxWidth: '65%', flexWrap: 'wrap' },
    section: { marginBottom: 6 },
    tableHeader: { flexDirection: 'row', borderBottom: '1pt solid #000', paddingBottom: 2, marginBottom: 2 },
    tableRow: { flexDirection: 'row', marginBottom: 3 },
    colQty: { width: '15%', fontSize: FONT_SIZE_PRODUCT, fontWeight: 'bold' },
    colDesc: { width: '55%', fontSize: FONT_SIZE_PRODUCT },
    colPrice: { width: '30%', textAlign: 'right', fontSize: FONT_SIZE_PRODUCT },
    productName: { fontWeight: 'bold', textTransform: 'uppercase', fontSize: FONT_SIZE_PRODUCT, flexWrap: 'wrap', lineHeight: 1.4 },
    notes: { fontStyle: 'italic', fontSize: FONT_SIZE_SMALL - 1, marginTop: 1, flexWrap: 'wrap' },
    calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1, fontSize: FONT_SIZE_SMALL },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTop: '1pt solid #000', paddingTop: 3, marginTop: 3, fontWeight: 'bold', fontSize: FONT_SIZE_LARGE },
    footer: { textAlign: 'center', marginTop: 8 },
    footerText: { fontSize: FONT_SIZE_SMALL, marginBottom: 1 },
    badge: { fontSize: FONT_SIZE_SMALL, fontWeight: 'bold', marginBottom: 2 },
  });

  const subtotal = order.total / 1.10;
  const igv = order.total - subtotal;
  const createdDate = new Date(order.created_at);

  // ── DOCUMENTO PDF ────────────────────────────────────────────
  const TicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={styles.page}>

        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>MARY'S RESTAURANT</Text>
          <Text style={styles.subtitle}>INVERSIONES AROMO S.A.C.</Text>
          <Text style={styles.subtitle}>RUC: 20505262086</Text>
          <Text style={styles.subtitle}>AV. ISABEL LA CATÓLICA 1254</Text>
          <Text style={styles.subtitle}>Tel: 941 778 599</Text>
          <Text style={{ ...styles.badge, marginTop: 4 }}>🎒 PEDIDO FULLDAY</Text>
        </View>

        {/* Info pedido */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>PEDIDO:</Text>
            <Text style={styles.value}>#{order.order_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>FECHA:</Text>
            <Text style={styles.value}>{createdDate.toLocaleDateString('es-ES')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>HORA:</Text>
            <Text style={styles.value}>{createdDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>PAGO:</Text>
            <Text style={styles.value}>{getPaymentText()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info alumno */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>ALUMNO:</Text>
            <Text style={styles.valueBold}>{order.student_name.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>GRADO:</Text>
            <Text style={styles.value}>{order.grade} - Sección {order.section}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>APODERADO:</Text>
            <Text style={styles.value}>{order.guardian_name}</Text>
          </View>
          {order.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>TELÉFONO:</Text>
              <Text style={styles.value}>{order.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Productos */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.colQty}>Cant</Text>
            <Text style={styles.colDesc}>Descripción</Text>
            <Text style={styles.colPrice}>Precio</Text>
          </View>
          {order.items.map((item, i) => (
            <View key={i}>
              <View style={styles.tableRow}>
                <Text style={styles.colQty}>{item.quantity}x</Text>
                <View style={styles.colDesc}>
                  <Text style={styles.productName}>{item.name}</Text>
                </View>
                <Text style={styles.colPrice}>S/ {(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              {item.notes?.trim() && (
                <View style={styles.tableRow}>
                  <Text style={styles.colQty}></Text>
                  <View style={styles.colDesc}>
                    <Text style={styles.notes}>Nota: {item.notes}</Text>
                  </View>
                  <Text style={styles.colPrice}></Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Totales */}
        <View>
          <View style={styles.calcRow}>
            <Text>Subtotal:</Text>
            <Text>S/ {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text>IGV (10%):</Text>
            <Text>S/ {igv.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TOTAL:</Text>
            <Text>S/ {order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ ...styles.footerText, fontWeight: 'bold' }}>¡GRACIAS POR SU PEDIDO!</Text>
          <Text style={styles.footerText}>*** FULLDAY ***</Text>
          {order.notes && <Text style={{ ...styles.footerText, fontStyle: 'italic' }}>Nota: {order.notes}</Text>}
          <Text style={{ ...styles.footerText, marginTop: 6, fontSize: FONT_SIZE_SMALL - 1 }}>
            Atendido por: {getCurrentUserName().toUpperCase()}
          </Text>
          <Text style={{ ...styles.footerText, fontSize: FONT_SIZE_SMALL - 1 }}>
            {new Date().toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

      </Page>
    </Document>
  );

  // ── HTML PARA IMPRESIÓN DIRECTA ──────────────────────────────
  const generateTicketHTML = () => `
    <div class="ticket">
      <div class="center">
        <div class="header-title">MARY'S RESTAURANT</div>
        <div class="header-subtitle">INVERSIONES AROMO S.A.C.</div>
        <div class="header-subtitle">RUC: 20505262086</div>
        <div class="header-subtitle">AV. ISABEL LA CATÓLICA 1254</div>
        <div class="header-subtitle">Tel: 941 778 599</div>
        <div class="badge">🎒 PEDIDO FULLDAY</div>
        <div class="divider"></div>
      </div>

      <div class="info-row"><span class="label">PEDIDO:</span><span class="value">#${order.order_number}</span></div>
      <div class="info-row"><span class="label">FECHA:</span><span class="value">${new Date(order.created_at).toLocaleDateString('es-ES')}</span></div>
      <div class="info-row"><span class="label">HORA:</span><span class="value">${new Date(order.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span></div>
      <div class="info-row"><span class="label">PAGO:</span><span class="value">${getPaymentText()}</span></div>

      <div class="divider"></div>

      <div class="info-row"><span class="label">ALUMNO:</span><span class="customer-name-bold">${order.student_name.toUpperCase()}</span></div>
      <div class="info-row"><span class="label">GRADO:</span><span class="value">${order.grade} - Sección ${order.section}</span></div>
      <div class="info-row"><span class="label">APODERADO:</span><span class="value">${order.guardian_name}</span></div>
      ${order.phone ? `<div class="info-row"><span class="label">TELÉFONO:</span><span class="value">${order.phone}</span></div>` : ''}

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th>Cant</th>
            <th>Descripción</th>
            <th style="text-align:right">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td style="vertical-align:top">${item.quantity}x</td>
              <td style="vertical-align:top">
                <div class="product-name">${item.name}</div>
                ${item.notes?.trim() ? `<div class="table-notes">Nota: ${item.notes}</div>` : ''}
              </td>
              <td style="text-align:right;vertical-align:top">S/ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <div style="font-size:11px">
        <div class="info-row"><span>Subtotal:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
        <div class="info-row"><span>IGV (10%):</span><span>S/ ${igv.toFixed(2)}</span></div>
        <div class="info-row" style="border-top:2px solid #000;padding-top:5px;margin-top:5px;font-weight:bold">
          <span>TOTAL:</span><span>S/ ${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="center">
        <div class="header-title">¡GRACIAS POR SU PEDIDO!</div>
        <div class="normal">*** FULLDAY ***</div>
        ${order.notes ? `<div class="normal" style="font-style:italic;margin-top:4px">Nota: ${order.notes}</div>` : ''}
        <div class="normal" style="margin-top:8px;font-size:10px">Atendido por: ${getCurrentUserName().toUpperCase()}</div>
        <div class="normal" style="font-size:10px">${new Date().toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
  `;

  // ── HANDLERS ────────────────────────────────────────────────
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket FullDay #${order.order_number}</title>
            <style>
              @media print {
                @page { size: 80mm auto; margin: 0; padding: 0; }
                body { width: 80mm !important; margin: 0 auto !important; padding: 0 !important; font-family: "Courier New", monospace !important; }
              }
              body { font-family: "Courier New", monospace; font-size: 12px; line-height: 1.3; width: 80mm; margin: 0 auto; padding: 8px; background: white; color: black; }
              .center { text-align: center; }
              .bold { font-weight: bold !important; }
              .normal { font-weight: normal !important; }
              .divider { border-top: 1px solid #000; margin: 6px 0; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
              .label { font-weight: bold !important; }
              .value { font-weight: normal !important; max-width: 65%; word-wrap: break-word; }
              .customer-name-bold { font-weight: bold !important; max-width: 65%; word-wrap: break-word; }
              .header-title { font-weight: bold !important; font-size: 13px; margin-bottom: 2px; }
              .header-subtitle { font-weight: normal !important; font-size: 11px; margin-bottom: 1px; }
              .badge { font-weight: bold !important; font-size: 12px; margin: 4px 0; }
              .product-name { font-weight: bold !important; text-transform: uppercase; font-size: 12px; line-height: 1.4; }
              .table-notes { font-style: italic; font-size: 10px; margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 12px; }
              th, td { padding: 2px 0; text-align: left; vertical-align: top; }
              th { border-bottom: 1px solid #000; font-weight: bold !important; font-size: 11px; }
            </style>
          </head>
          <body>${generateTicketHTML()}</body>
        </html>
      `);
      iframeDoc.close();
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 500);
      };
    }
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = await pdf(<TicketDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const studentSlug = order.student_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      link.href = url;
      link.download = `fullday-${order.order_number}-${studentSlug}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF FullDay:', error);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={handlePrint}
        style={{
          padding: '8px 14px',
          backgroundColor: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '13px',
        }}
      >
        🖨️ Imprimir Ticket
      </button>
      <button
        onClick={handleDownloadPDF}
        style={{
          padding: '8px 14px',
          backgroundColor: '#059669',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '13px',
        }}
      >
        📄 PDF
      </button>
    </div>
  );
};

export default FullDayTicket;
