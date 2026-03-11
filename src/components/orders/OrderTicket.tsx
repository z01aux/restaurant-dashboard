// ============================================
// ARCHIVO: src/components/orders/OrderTicket.tsx (MODIFICADO)
// AHORA EL PDF TIENE EL MISMO DISEÑO QUE LA IMPRESIÓN HTML
// ============================================

import React from 'react';
import { Order } from '../../types';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface OrderTicketProps {
  order: Order;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order, onMouseEnter, onMouseLeave }) => {
  // Verificar si es un pedido por teléfono para ticket de cocina
  const isPhoneOrder = order.source.type === 'phone';
  
  // Obtener el nombre del usuario actual desde localStorage
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

  // Función para obtener número de orden para display
  const getDisplayOrderNumber = () => {
    return order.orderNumber ?? `ORD-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener número de cocina para display
  const getDisplayKitchenNumber = () => {
    return order.kitchenNumber ?? `COM-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener texto del método de pago
  const getPaymentText = () => {
    if (order.paymentMethod) {
      const paymentMap: Record<string, string> = {
        'EFECTIVO': 'EFECTIVO',
        'YAPE/PLIN': 'YAPE/PLIN', 
        'TARJETA': 'TARJETA'
      };
      return paymentMap[order.paymentMethod] || 'NO APLICA';
    }
    return 'NO APLICA';
  };

  // CONSTANTES PARA EL ANCHO DE IMPRESIÓN
  const TICKET_WIDTH = 80;
  const PAGE_WIDTH = TICKET_WIDTH * 2.83465;
  
  // TAMAÑOS DE FUENTE
  const FONT_SIZE_SMALL = 8;
  const FONT_SIZE_NORMAL = 9;
  const FONT_SIZE_LARGE = 10;
  const FONT_SIZE_XLARGE = 11;
  const FONT_SIZE_PRODUCT = 10;
  
  const PADDING = 8;

  // ============================================
  // ESTILOS PARA TICKET DE COCINA (PDF) - IGUAL AL HTML
  // ============================================
  const kitchenStyles = StyleSheet.create({
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
      borderBottom: '1pt solid #000000',
      paddingBottom: 4,
    },
    restaurantName: {
      fontSize: FONT_SIZE_XLARGE,
      fontWeight: 'bold',
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    area: {
      fontSize: FONT_SIZE_LARGE,
      fontWeight: 'bold',
      marginBottom: 3,
      textTransform: 'uppercase',
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
    infoSection: {
      marginBottom: 6,
    },
    label: {
      fontWeight: 'bold',
      marginBottom: 1,
      fontSize: FONT_SIZE_SMALL,
    },
    value: {
      fontWeight: 'normal',
      fontSize: FONT_SIZE_SMALL,
      maxWidth: '60%',
      flexWrap: 'wrap',
    },
    valueBold: {
      fontWeight: 'bold',
      fontSize: FONT_SIZE_SMALL,
      maxWidth: '60%',
      flexWrap: 'wrap',
    },
    productsHeader: {
      textAlign: 'center',
      fontWeight: 'bold',
      marginBottom: 3,
      textTransform: 'uppercase',
      borderBottom: '1pt solid #000000',
      paddingBottom: 2,
      fontSize: FONT_SIZE_NORMAL,
    },
    productRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    quantity: {
      width: '15%',
      fontWeight: 'bold',
      fontSize: FONT_SIZE_PRODUCT,
    },
    productName: {
      width: '85%',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_PRODUCT,
      flexWrap: 'wrap',
      lineHeight: 1.4,
    },
    notes: {
      fontSize: FONT_SIZE_SMALL,
      marginLeft: '15%',
      marginBottom: 3,
      flexWrap: 'wrap',
      width: '85%',
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    productsContainer: {
      marginBottom: 8,
    },
    footer: {
      marginTop: 6,
      textAlign: 'center',
    },
    asteriskLine: {
      textAlign: 'center',
      fontSize: FONT_SIZE_SMALL,
      letterSpacing: 1,
      marginBottom: 1,
      fontWeight: 'normal',
    }
  });

  // ============================================
  // ESTILOS PARA TICKET NORMAL (PDF) - IDÉNTICO AL HTML
  // ============================================
  const normalStyles = StyleSheet.create({
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
    quantity: {
      fontWeight: 'bold',
    },
    productName: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_PRODUCT,
      flexWrap: 'wrap',
      lineHeight: 1.4,
    },
    notes: {
      fontSize: FONT_SIZE_SMALL,
      marginLeft: 0,
      marginTop: 1,
      flexWrap: 'wrap',
      fontWeight: 'normal',
      fontStyle: 'normal',
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

  // ============================================
  // DOCUMENTO PDF PARA COCINA (CON MISMO DISEÑO QUE HTML)
  // ============================================
  const KitchenTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={kitchenStyles.page}>
        {/* HEADER - IDÉNTICO AL HTML */}
        <View style={kitchenStyles.header}>
          <Text style={kitchenStyles.restaurantName}>{order.customerName.toUpperCase()}</Text>
          <Text style={kitchenStyles.area}>** COCINA **</Text>
        </View>

        {/* INFORMACIÓN - IDÉNTICA AL HTML */}
        <View style={kitchenStyles.infoSection}>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>CLIENTE:</Text>
            <Text style={kitchenStyles.valueBold}>{order.customerName.toUpperCase()}</Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>AREA:</Text>
            <Text style={kitchenStyles.value}>COCINA</Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>COMANDA:</Text>
            <Text style={kitchenStyles.value}>#{getDisplayKitchenNumber()}</Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>FECHA:</Text>
            <Text style={kitchenStyles.value}>
              {order.createdAt.toLocaleDateString('es-ES')} - {order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>ATENDIDO POR:</Text>
            <Text style={kitchenStyles.value}>{getCurrentUserName().toUpperCase()}</Text>
          </View>
        </View>

        <View style={kitchenStyles.divider} />

        {/* PRODUCTOS - IDÉNTICO AL HTML */}
        <Text style={kitchenStyles.productsHeader}>DESCRIPCION</Text>
        
        <View style={kitchenStyles.divider} />

        <View style={kitchenStyles.productsContainer}>
          {(order.items || []).map((item, index) => (
            <View key={index}>
              <View style={kitchenStyles.productRow}>
                <Text style={kitchenStyles.quantity}>{item.quantity}x</Text>
                <Text style={kitchenStyles.productName}>{item.menuItem.name.toUpperCase()}</Text>
              </View>
              {item.notes?.trim() && (
                <Text style={kitchenStyles.notes}>NOTA: {item.notes.toUpperCase()}</Text>
              )}
            </View>
          ))}
        </View>

        {/* NOTAS DEL PEDIDO (si existen) - COMO EN HTML */}
        {order.notes && order.notes.trim() !== '' && (
          <>
            <View style={kitchenStyles.divider} />
            <View style={kitchenStyles.row}>
              <Text style={kitchenStyles.label}>NOTAS DEL PEDIDO:</Text>
            </View>
            {order.notes.toUpperCase().trim().split('\n').map((line, i) => (
              <Text key={i} style={kitchenStyles.notes}>- {line.trim()}</Text>
            ))}
          </>
        )}

        <View style={kitchenStyles.divider} />

        {/* FOOTER - IDÉNTICO AL HTML */}
        <View style={kitchenStyles.footer}>
          <Text style={kitchenStyles.asteriskLine}>********************************</Text>
        </View>
      </Page>
    </Document>
  );

  // ============================================
  // DOCUMENTO PDF NORMAL (CON MISMO DISEÑO QUE HTML)
  // ============================================
  const NormalTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={normalStyles.page}>
        {/* HEADER - IDÉNTICO AL HTML */}
        <View style={normalStyles.header}>
          <Text style={normalStyles.title}>MARY'S RESTAURANT</Text>
          <Text style={normalStyles.subtitle}>INVERSIONES AROMO S.A.C.</Text>
          <Text style={normalStyles.subtitle}>RUC: 20505262086</Text>
          <Text style={normalStyles.subtitle}>AV. ISABEL LA CATOLICA 1254</Text>
          <Text style={normalStyles.subtitle}>Tel: 941 778 599</Text>
          <View style={normalStyles.divider} />
        </View>

        {/* INFORMACIÓN DEL PEDIDO */}
        <View style={normalStyles.section}>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>ORDEN:</Text>
            <Text>{getDisplayOrderNumber()}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>TIPO:</Text>
            <Text>{getSourceText(order.source.type)}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>FECHA:</Text>
            <Text>{order.createdAt.toLocaleDateString()}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>HORA:</Text>
            <Text>{order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>PAGO:</Text>
            <Text>{getPaymentText()}</Text>
          </View>
        </View>

        <View style={normalStyles.divider} />

        {/* INFORMACIÓN DEL CLIENTE */}
        <View style={normalStyles.section}>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>CLIENTE:</Text>
            <Text style={normalStyles.valueBold}>{order.customerName.toUpperCase()}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>TELÉFONO:</Text>
            <Text>{order.phone}</Text>
          </View>
          {order.address && (
            <View style={normalStyles.row}>
              <Text style={normalStyles.bold}>DIRECCIÓN:</Text>
              <Text style={{ maxWidth: '60%', flexWrap: 'wrap' }}>{order.address}</Text>
            </View>
          )}
          {order.tableNumber && (
            <View style={normalStyles.row}>
              <Text style={normalStyles.bold}>MESA:</Text>
              <Text>{order.tableNumber}</Text>
            </View>
          )}
        </View>

        <View style={normalStyles.divider} />

        {/* TABLA DE PRODUCTOS */}
        <View style={normalStyles.table}>
          <View style={normalStyles.tableHeader}>
            <Text style={normalStyles.colQuantity}>Cant</Text>
            <Text style={normalStyles.colDescription}>Descripción</Text>
            <Text style={normalStyles.colPrice}>Precio</Text>
          </View>

          {(order.items || []).map((item, index) => (
            <View key={index}>
              <View style={normalStyles.tableRow}>
                <Text style={[normalStyles.colQuantity, normalStyles.quantity]}>{item.quantity}x</Text>
                <View style={normalStyles.colDescription}>
                  <Text style={normalStyles.productName}>{item.menuItem.name.toUpperCase()}</Text>
                </View>
                <Text style={normalStyles.colPrice}>
                  S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              {item.notes?.trim() && (
                <View style={normalStyles.tableRow}>
                  <Text style={normalStyles.colQuantity}></Text>
                  <View style={normalStyles.colDescription}>
                    <Text style={normalStyles.notes}>NOTA: {item.notes.toUpperCase()}</Text>
                  </View>
                  <Text style={normalStyles.colPrice}></Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={normalStyles.divider} />

        {/* TOTAL */}
        <View style={[normalStyles.row, normalStyles.bold, { marginTop: 4, borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 4 }]}>
          <Text style={normalStyles.bold}>TOTAL:</Text>
          <Text style={normalStyles.bold}>S/ {order.total.toFixed(2)}</Text>
        </View>

        {/* NOTAS DEL PEDIDO */}
        {order.notes && order.notes.trim() !== '' && (
          <>
            <View style={normalStyles.divider} />
            <View style={normalStyles.row}>
              <Text style={normalStyles.bold}>NOTAS DEL PEDIDO:</Text>
            </View>
            {order.notes.toUpperCase().trim().split('\n').map((line, i) => (
              <Text key={i} style={normalStyles.notes}>- {line.trim()}</Text>
            ))}
          </>
        )}

        <View style={normalStyles.divider} />

        {/* FOOTER */}
        <View style={normalStyles.footer}>
          <Text style={normalStyles.bold}>¡GRACIAS POR SU PEDIDO!</Text>
          <Text>*** {getSourceText(order.source.type)} ***</Text>
          <Text style={normalStyles.footerDate}>
            {new Date().toLocaleString('es-ES', { 
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );

  // Función auxiliar para obtener texto del tipo de pedido
  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap: Record<Order['source']['type'], string> = {
      'phone': 'COCINA',
      'walk-in': 'LOCAL', 
      'delivery': 'DELIVERY',
      'fullDay': 'FULLDAY',
      'oep': 'OEP',
      'loncheritas': 'LONCHERITAS',
    };
    return sourceMap[sourceType] || sourceType;
  };

  // Función para generar nombre de archivo
  const generateFileName = () => {
    const orderNumber = isPhoneOrder ? getDisplayKitchenNumber() : getDisplayOrderNumber();
    const customerName = order.customerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const date = order.createdAt.toISOString().split('T')[0];
    const type = isPhoneOrder ? 'cocina' : 'cliente';
    
    return `ticket-${orderNumber}-${customerName}-${date}-${type}.pdf`;
  };

  // Handler para descargar PDF
  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!order || !order.items) {
        console.error('Orden inválida para generar PDF');
        return;
      }
      
      const blob = await pdf(
        isPhoneOrder ? <KitchenTicketDocument /> : <NormalTicketDocument />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = generateFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  // Handler para imprimir
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Usar el mismo método de impresión HTML que ya funciona bien
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);

    const ticketContent = generateTicketContent();
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket ${isPhoneOrder ? getDisplayKitchenNumber() : getDisplayOrderNumber()}</title>
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
                * {
                  font-family: "Courier New", monospace !important;
                }
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
              .center { text-align: center; }
              .bold { font-weight: bold !important; }
              .normal { font-weight: normal !important; }
              .divider { border-top: 1px solid #000; margin: 6px 0; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
              .label { font-weight: bold !important; }
              .value { font-weight: normal !important; }
              .customer-name-bold { font-weight: bold !important; max-width: 60%; word-wrap: break-word; font-size: 12px; }
              .header-title { font-weight: bold !important; font-size: 13px; }
              .header-subtitle { font-weight: normal !important; font-size: 11px; }
              .notes { font-size: 10px; margin-left: 15%; margin-bottom: 3px; display: block; width: 85%; font-weight: normal !important; }
              .table-notes { font-size: 10px; margin-left: 0; margin-top: 2px; display: block; font-weight: normal !important; }
              .products-header { text-align: center; font-weight: bold !important; margin: 6px 0; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px; font-size: 12px; }
              .product-row { display: flex; margin-bottom: 4px; }
              .quantity { width: 15%; font-weight: bold !important; font-size: 12px; }
              .product-name { width: 85%; font-weight: bold !important; text-transform: uppercase; font-size: 12px; line-height: 1.4; }
              table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 12px; }
              th, td { padding: 2px 0; text-align: left; vertical-align: top; }
              th { border-bottom: 1px solid #000; font-weight: bold !important; font-size: 11px; }
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

  // Generar contenido HTML para impresión (se mantiene igual)
  const generateTicketContent = () => {
    if (isPhoneOrder) {
      return `
        <div class="ticket">
          <div class="center">
            <div class="header-title uppercase" style="font-size: 16px; margin-bottom: 5px;">${order.customerName.toUpperCase()}</div>
            <div class="header-title">** COCINA **</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="label">CLIENTE:</span>
            <span class="customer-name-bold">${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">AREA:</span>
            <span class="value">COCINA</span>
          </div>
          <div class="info-row">
            <span class="label">COMANDA:</span>
            <span class="value">#${getDisplayKitchenNumber()}</span>
          </div>
          <div class="info-row">
            <span class="label">FECHA:</span>
            <span class="value">${order.createdAt.toLocaleDateString('es-ES')} - ${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span class="label">ATENDIDO POR:</span>
            <span class="value">${getCurrentUserName().toUpperCase()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="products-header">DESCRIPCION</div>
          
          <div class="divider"></div>
          
          ${(order.items || []).map(item => `
            <div class="product-row">
              <div class="quantity">${item.quantity}x</div>
              <div class="product-name bold">${item.menuItem.name.toUpperCase()}</div>
            </div>
            ${item.notes?.trim() ? `<div class="notes">NOTA: ${item.notes.toUpperCase()}</div>` : ''}
          `).join('')}
          
          ${order.notes && order.notes.trim() !== '' ? `
            <div class="divider"></div>
            <div class="info-row">
              <span class="label">NOTAS DEL PEDIDO:</span>
            </div>
            ${order.notes.toUpperCase().trim().split('\n').map(line => `<div class="notes">- ${line.trim()}</div>`).join('')}
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="asterisk-line">********************************</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="ticket">
          <div class="center">
            <div class="header-title" style="font-size: 14px;">MARY'S RESTAURANT</div>
            <div class="header-subtitle">INVERSIONES AROMO S.A.C.</div>
            <div class="header-subtitle">RUC: 20505262086</div>
            <div class="header-subtitle">AV. ISABEL LA CATOLICA 1254</div>
            <div class="header-subtitle">Tel: 941 778 599</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="label">ORDEN:</span>
            <span class="value">${getDisplayOrderNumber()}</span>
          </div>
          <div class="info-row">
            <span class="label">TIPO:</span>
            <span class="value">${getSourceText(order.source.type)}</span>
          </div>
          <div class="info-row">
            <span class="label">FECHA:</span>
            <span class="value">${order.createdAt.toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="label">HORA:</span>
            <span class="value">${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span class="label">PAGO:</span>
            <span class="value">${getPaymentText()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-row">
            <span class="label">CLIENTE:</span>
            <span class="customer-name-bold">${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">TELÉFONO:</span>
            <span class="value">${order.phone}</span>
          </div>
          ${order.address ? `
          <div class="info-row">
            <span class="label">DIRECCIÓN:</span>
            <span class="value" style="max-width: 60%; word-wrap: break-word;">${order.address}</span>
          </div>
          ` : ''}
          ${order.tableNumber ? `
          <div class="info-row">
            <span class="label">MESA:</span>
            <span class="value">${order.tableNumber}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Cant</th>
                <th>Descripción</th>
                <th style="text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => `
                <tr>
                  <td class="quantity" style="vertical-align: top; font-size: 12px;">${item.quantity}x</td>
                  <td style="vertical-align: top; font-size: 12px;">
                    <div class="product-name bold" style="font-size: 12px;">${item.menuItem.name.toUpperCase()}</div>
                    ${item.notes?.trim() ? `<div class="table-notes" style="font-size: 10px;">NOTA: ${item.notes.toUpperCase()}</div>` : ''}
                  </td>
                  <td style="text-align: right; vertical-align: top; font-size: 12px;">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div class="info-row" style="border-top: 2px solid #000; padding-top: 5px; margin-top: 5px;">
            <span class="label">TOTAL:</span>
            <span class="label">S/ ${order.total.toFixed(2)}</span>
          </div>
          
          ${order.notes && order.notes.trim() !== '' ? `
            <div class="divider"></div>
            <div class="info-row">
              <span class="label">NOTAS DEL PEDIDO:</span>
            </div>
            ${order.notes.toUpperCase().trim().split('\n').map(line => `<div class="notes" style="margin-left: 0;">- ${line.trim()}</div>`).join('')}
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="header-title">¡GRACIAS POR SU PEDIDO!</div>
            <div class="normal">*** ${getSourceText(order.source.type)} ***</div>
            <div class="normal" style="margin-top: 10px; font-size: 10px;">
              ${new Date().toLocaleString('es-ES', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      `;
    }
  };

  return (
    <div 
      style={{ display: 'flex', gap: '8px', margin: '5px 0' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={handlePrint}
        className="print-button"
        style={{
          padding: '8px 16px',
          backgroundColor: isPhoneOrder ? '#10b981' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span>🖨️</span>
        {isPhoneOrder ? 'Ticket Cocina' : 'Ticket Cliente'}
      </button>

      <button
        onClick={handleDownloadPDF}
        className="download-pdf-button"
        style={{
          padding: '8px 16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span>📥</span>
        PDF
      </button>
    </div>
  );
};

export default OrderTicket;
