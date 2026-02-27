// ============================================
// ARCHIVO: src/components/fullday/FullDayTicket.tsx
// Ticket FullDay — mismo diseño que OrderTicket (sin emoticonos)
// Nombres truncados: apellidos + primer nombre
// ============================================

import React from 'react';
import { FullDayOrder } from '../../types/fullday';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface FullDayTicketProps {
  order: FullDayOrder;
}

const FullDayTicket: React.FC<FullDayTicketProps> = ({ order }) => {

  // ── Truncar nombre: apellidos + primer nombre ────────────────
  // Asume formato "Nombre(s) Apellido1 Apellido2"
  // Devuelve "Apellido1 Apellido2, PrimerNombre"
  const truncateName = (fullName: string): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 2) return fullName; // Solo 2 palabras, mostrar tal cual
    // Tomar último y penúltimo como apellidos, el primero como nombre
    const firstName = parts[0];
    const lastNames = parts.slice(1).join(' ');
    return `${lastNames}, ${firstName}`;
  };

  const studentDisplay  = truncateName(order.student_name);
  const guardianDisplay = truncateName(order.guardian_name);

  // ── Constantes de diseño (igual que OrderTicket) ─────────────
  const TICKET_WIDTH = 80;
  const PAGE_WIDTH   = TICKET_WIDTH * 2.83465;

  const FONT_SIZE_SMALL   = 8;
  const FONT_SIZE_NORMAL  = 9;
  const FONT_SIZE_LARGE   = 10;
  const FONT_SIZE_XLARGE  = 11;
  const FONT_SIZE_PRODUCT = 10;
  const PADDING = 8;

  const getCurrentUserName = (): string => {
    try {
      const saved = localStorage.getItem('restaurant-user');
      if (saved) return JSON.parse(saved).name || 'Sistema';
    } catch { /* noop */ }
    return 'Sistema';
  };

  const getPaymentText = (): string => {
    const map: Record<string, string> = {
      'EFECTIVO':  'EFECTIVO',
      'YAPE/PLIN': 'YAPE/PLIN',
      'TARJETA':   'TARJETA',
    };
    return order.payment_method ? (map[order.payment_method] || 'NO APLICA') : 'NO APLICA';
  };

  const subtotal = order.total / 1.10;
  const igv      = order.total - subtotal;
  const createdDate = new Date(order.created_at);

  // ── ESTILOS PDF (copiados de normalStyles en OrderTicket) ────
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: PADDING,
      fontSize: FONT_SIZE_NORMAL,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      width: PAGE_WIDTH,
    },
    header: {
      textAlign: 'center',
      marginBottom: 6,
    },
    title: {
      fontSize: FONT_SIZE_XLARGE,
      fontWeight: 'bold',
      marginBottom: 3,
    },
    subtitle: {
      fontSize: FONT_SIZE_SMALL,
      marginBottom: 1,
      fontWeight: 'normal',
    },
    boldSubtitle: {
      fontSize: FONT_SIZE_SMALL,
      marginBottom: 1,
      fontWeight: 'bold',
    },
    divider: {
      borderBottom: '1pt solid #000000',
      marginVertical: 3,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    bold: {
      fontWeight: 'bold',
    },
    section: {
      marginBottom: 6,
    },
    table: {
      marginBottom: 6,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottom: '1pt solid #000000',
      paddingBottom: 2,
      marginBottom: 2,
    },
    tableRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    colQuantity: {
      width: '15%',
      fontSize: FONT_SIZE_PRODUCT,
      fontWeight: 'bold',
    },
    colDescription: {
      width: '50%',
      fontSize: FONT_SIZE_PRODUCT,
      fontWeight: 'normal',
    },
    colPrice: {
      width: '35%',
      textAlign: 'right',
      fontSize: FONT_SIZE_PRODUCT,
      fontWeight: 'normal',
    },
    productName: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_PRODUCT,
      flexWrap: 'wrap',
      lineHeight: 1.4,
    },
    notes: {
      fontStyle: 'italic',
      fontSize: FONT_SIZE_SMALL,
      marginLeft: 0,
      marginTop: 1,
      flexWrap: 'wrap',
      fontWeight: 'normal',
    },
    calculations: {
      marginTop: 3,
    },
    calculationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
      fontSize: FONT_SIZE_SMALL,
      fontWeight: 'normal',
    },
    total: {
      borderTop: '1pt solid #000000',
      paddingTop: 3,
      marginTop: 3,
    },
    footer: {
      textAlign: 'center',
      marginTop: 8,
    },
    footerDate: {
      marginTop: 6,
      fontSize: FONT_SIZE_SMALL - 1,
      fontWeight: 'normal',
    },
    valueBold: {
      fontWeight: 'bold',
      fontSize: FONT_SIZE_SMALL,
      maxWidth: '60%',
      flexWrap: 'wrap',
    },
  });

  // ── DOCUMENTO PDF ─────────────────────────────────────────────
  const TicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={styles.page}>

        {/* Encabezado — idéntico al NormalTicketDocument */}
        <View style={styles.header}>
          <Text style={styles.title}>MARY'S RESTAURANT</Text>
          <Text style={styles.subtitle}>INVERSIONES AROMO S.A.C.</Text>
          <Text style={styles.subtitle}>RUC: 20505262086</Text>
          <Text style={styles.subtitle}>AV. ISABEL LA CATOLICA 1254</Text>
          <Text style={styles.subtitle}>Tel: 941 778 599</Text>
          <View style={styles.divider} />
        </View>

        {/* Info pedido */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.bold}>PEDIDO:</Text>
            <Text>#{order.order_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>TIPO:</Text>
            <Text>FULLDAY</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>FECHA:</Text>
            <Text>{createdDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>HORA:</Text>
            <Text>{createdDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>PAGO:</Text>
            <Text>{getPaymentText()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info alumno — misma estructura que sección CLIENTE en OrderTicket */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.bold}>ALUMNO:</Text>
            <Text style={styles.valueBold}>{studentDisplay.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>GRADO:</Text>
            <Text>{order.grade} - {order.section}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>APODERADO:</Text>
            <Text style={{ maxWidth: '60%', flexWrap: 'wrap', fontSize: FONT_SIZE_SMALL }}>
              {guardianDisplay.toUpperCase()}
            </Text>
          </View>
          {order.phone && (
            <View style={styles.row}>
              <Text style={styles.bold}>TELEFONO:</Text>
              <Text>{order.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Tabla de productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colQuantity}>Cant</Text>
            <Text style={styles.colDescription}>Descripcion</Text>
            <Text style={styles.colPrice}>Precio</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index}>
              <View style={styles.tableRow}>
                <Text style={[styles.colQuantity, styles.bold]}>{item.quantity}x</Text>
                <View style={styles.colDescription}>
                  <Text style={styles.productName}>{item.name}</Text>
                </View>
                <Text style={styles.colPrice}>
                  S/ {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              {item.notes?.trim() && (
                <View style={styles.tableRow}>
                  <Text style={styles.colQuantity}></Text>
                  <View style={styles.colDescription}>
                    <Text style={styles.notes}>Nota: {item.notes}</Text>
                  </View>
                  <Text style={styles.colPrice}></Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.calculations}>
          <View style={styles.calculationRow}>
            <Text>Subtotal:</Text>
            <Text>S/ {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.calculationRow}>
            <Text>IGV (10%):</Text>
            <Text>S/ {igv.toFixed(2)}</Text>
          </View>
          <View style={[styles.row, styles.total, styles.bold]}>
            <Text>TOTAL:</Text>
            <Text>S/ {order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.bold}>GRACIAS POR SU PEDIDO!</Text>
          <Text>*** FULLDAY ***</Text>
          {order.notes && (
            <Text style={{ fontSize: FONT_SIZE_SMALL, fontStyle: 'italic', marginTop: 3 }}>
              Nota: {order.notes}
            </Text>
          )}
          <Text style={styles.footerDate}>
            {new Date().toLocaleString('es-ES', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>

      </Page>
    </Document>
  );

  // ── HTML PARA IMPRESIÓN (copia exacta del estilo de OrderTicket) ──
  const generateTicketHTML = (): string => `
    <div class="ticket">
      <div class="center">
        <div class="header-title" style="font-size:14px;">MARY'S RESTAURANT</div>
        <div class="header-subtitle">INVERSIONES AROMO S.A.C.</div>
        <div class="header-subtitle">RUC: 20505262086</div>
        <div class="header-subtitle">AV. ISABEL LA CATOLICA 1254</div>
        <div class="header-subtitle">Tel: 941 778 599</div>
        <div class="divider"></div>
      </div>

      <div class="info-row">
        <span class="label">PEDIDO:</span>
        <span class="value">#${order.order_number}</span>
      </div>
      <div class="info-row">
        <span class="label">TIPO:</span>
        <span class="value">FULLDAY</span>
      </div>
      <div class="info-row">
        <span class="label">FECHA:</span>
        <span class="value">${createdDate.toLocaleDateString()}</span>
      </div>
      <div class="info-row">
        <span class="label">HORA:</span>
        <span class="value">${createdDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="info-row">
        <span class="label">PAGO:</span>
        <span class="value">${getPaymentText()}</span>
      </div>

      <div class="divider"></div>

      <div class="info-row">
        <span class="label">ALUMNO:</span>
        <span class="customer-name-bold">${studentDisplay.toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="label">GRADO:</span>
        <span class="value">${order.grade} - ${order.section}</span>
      </div>
      <div class="info-row">
        <span class="label">APODERADO:</span>
        <span class="value" style="max-width:60%;word-wrap:break-word;">${guardianDisplay.toUpperCase()}</span>
      </div>
      ${order.phone ? `
      <div class="info-row">
        <span class="label">TELEFONO:</span>
        <span class="value">${order.phone}</span>
      </div>` : ''}

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th>Cant</th>
            <th>Descripcion</th>
            <th style="text-align:right;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td class="quantity" style="vertical-align:top;font-size:12px;">${item.quantity}x</td>
              <td style="vertical-align:top;font-size:12px;">
                <div class="product-name bold" style="font-size:12px;">${item.name}</div>
                ${item.notes?.trim() ? `<div class="table-notes" style="font-size:10px;">Nota: ${item.notes}</div>` : ''}
              </td>
              <td style="text-align:right;vertical-align:top;font-size:12px;">S/ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <div style="font-size:11px;">
        <div class="info-row">
          <span class="normal">Subtotal:</span>
          <span class="normal">S/ ${subtotal.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span class="normal">IGV (10%):</span>
          <span class="normal">S/ ${igv.toFixed(2)}</span>
        </div>
        <div class="info-row" style="border-top:2px solid #000;padding-top:5px;margin-top:5px;">
          <span class="label">TOTAL:</span>
          <span class="label">S/ ${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="center">
        <div class="header-title">GRACIAS POR SU PEDIDO!</div>
        <div class="normal">*** FULLDAY ***</div>
        ${order.notes ? `<div class="normal" style="font-style:italic;margin-top:4px;font-size:10px;">Nota: ${order.notes}</div>` : ''}
        <div class="normal" style="margin-top:10px;font-size:10px;">
          ${new Date().toLocaleString('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  `;

  // ── HANDLERS ─────────────────────────────────────────────────
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right    = '0';
    iframe.style.bottom   = '0';
    iframe.style.width    = '0';
    iframe.style.height   = '0';
    iframe.style.border   = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket ${order.order_number}</title>
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
                  font-family: "Courier New", monospace !important;
                  font-weight: normal !important;
                }
                * { font-family: "Courier New", monospace !important; }
              }
              body {
                font-family: "Courier New", monospace;
                font-weight: normal;
                font-size: 12px;
                line-height: 1.3;
                width: 80mm;
                margin: 0 auto;
                padding: 8px;
                background: white;
                color: black;
              }
              .ticket, .ticket *, div, span, td, th {
                font-family: "Courier New", monospace !important;
              }
              .center  { text-align: center; }
              .bold    { font-weight: bold !important; }
              .normal  { font-weight: normal !important; }
              .uppercase { text-transform: uppercase; }
              .divider { border-top: 1px solid #000; margin: 6px 0; }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 11px;
              }
              .label { font-weight: bold !important; }
              .value { font-weight: normal !important; }
              .customer-name-bold {
                font-weight: bold !important;
                max-width: 60%;
                word-wrap: break-word;
                font-size: 12px;
              }
              .header-title {
                font-weight: bold !important;
                font-size: 13px;
              }
              .header-subtitle {
                font-weight: normal !important;
                font-size: 11px;
              }
              .notes {
                font-style: italic;
                font-size: 10px;
                margin-left: 15%;
                margin-bottom: 3px;
                display: block;
                width: 85%;
                font-weight: normal !important;
              }
              .table-notes {
                font-style: italic;
                font-size: 10px;
                margin-left: 0;
                margin-top: 2px;
                display: block;
                font-weight: normal !important;
              }
              .product-row {
                display: flex;
                margin-bottom: 4px;
              }
              .quantity {
                width: 15%;
                font-weight: bold !important;
                font-size: 12px;
              }
              .product-name {
                width: 85%;
                font-weight: bold !important;
                text-transform: uppercase;
                font-size: 12px;
                line-height: 1.4;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
                font-size: 12px;
              }
              th, td {
                padding: 2px 0;
                text-align: left;
                vertical-align: top;
              }
              th {
                border-bottom: 1px solid #000;
                font-weight: bold !important;
                font-size: 11px;
              }
              td { font-size: 12px; }
            </style>
          </head>
          <body>
            ${generateTicketHTML()}
          </body>
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
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const slug = order.student_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      link.href     = url;
      link.download = `fullday-${order.order_number}-${slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF FullDay:', error);
    }
  };

  // ── RENDER — mismo estilo de botones que OrderTicket ─────────
  return (
    <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
      <button
        onClick={handlePrint}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Ticket Cliente #{order.order_number}
      </button>

      <button
        onClick={handleDownloadPDF}
        style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Descargar PDF
      </button>
    </div>
  );
};

export default FullDayTicket;
