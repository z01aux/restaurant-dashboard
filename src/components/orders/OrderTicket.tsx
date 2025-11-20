import React from 'react';
import { Order } from '../../types';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface OrderTicketProps {
  order: Order;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order }) => {
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
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener número de cocina para display
  const getDisplayKitchenNumber = () => {
    return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener texto del método de pago
  const getPaymentText = () => {
    if (order.paymentMethod) {
      const paymentMap = {
        'EFECTIVO': 'EFECTIVO',
        'YAPE/PLIN': 'YAPE/PLIN', 
        'TARJETA': 'TARJETA'
      };
      return paymentMap[order.paymentMethod];
    }
    return 'NO APLICA';
  };

  // CONSTANTES PARA EL ANCHO DE IMPRESIÓN - CAMBIADO A 80mm
  const TICKET_WIDTH = 80; // 80mm para impresoras térmicas estándar
  const PAGE_WIDTH = TICKET_WIDTH * 2.83465; // Convertir mm a puntos (1mm = 2.83465 puntos)
  const FONT_SIZE_SMALL = 7;
  const FONT_SIZE_NORMAL = 8;
  const FONT_SIZE_LARGE = 9;
  const FONT_SIZE_XLARGE = 10;
  const PADDING = 8;

  // Estilos para el PDF de COCINA (sin precios) - MODIFICADO para 80mm
  const kitchenStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: PADDING,
      fontSize: FONT_SIZE_NORMAL,
      fontFamily: 'Helvetica-Bold',
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
      marginBottom: 2,
    },
    quantity: {
      width: '15%',
      fontWeight: 'bold',
      fontSize: FONT_SIZE_SMALL,
    },
    productName: {
      width: '85%',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_SMALL,
      flexWrap: 'wrap',
    },
    notes: {
      fontStyle: 'italic',
      fontSize: FONT_SIZE_SMALL - 1,
      marginLeft: '15%',
      marginBottom: 3,
      flexWrap: 'wrap',
      width: '85%',
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
    }
  });

  // Estilos normales para otros tipos de pedido - MODIFICADO para 80mm
  const normalStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: PADDING,
      fontSize: FONT_SIZE_NORMAL,
      fontFamily: 'Helvetica',
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
      marginBottom: 2,
    },
    colQuantity: {
      width: '15%',
      fontSize: FONT_SIZE_SMALL,
    },
    colDescription: {
      width: '50%',
      fontSize: FONT_SIZE_SMALL,
    },
    colPrice: {
      width: '35%',
      textAlign: 'right',
      fontSize: FONT_SIZE_SMALL,
    },
    quantity: {
      fontWeight: 'bold',
    },
    productName: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_SMALL,
      flexWrap: 'wrap',
    },
    notes: {
      fontStyle: 'italic',
      fontSize: FONT_SIZE_SMALL - 1,
      marginLeft: 0,
      marginTop: 1,
      flexWrap: 'wrap',
    },
    calculations: {
      marginTop: 3,
    },
    calculationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
      fontSize: FONT_SIZE_SMALL,
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
    }
  });

  // Componente del documento PDF para COCINA - CORREGIDO para mostrar notas
  const KitchenTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={kitchenStyles.page}>
        <View style={kitchenStyles.header}>
          <Text style={kitchenStyles.restaurantName}>{order.customerName.toUpperCase()}</Text>
          <Text style={kitchenStyles.area}>** COCINA **</Text>
        </View>

        <View style={kitchenStyles.infoSection}>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>CLIENTE:</Text>
            <Text style={kitchenStyles.value}>{order.customerName.toUpperCase()}</Text>
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

        <Text style={kitchenStyles.productsHeader}>DESCRIPCION</Text>
        
        <View style={kitchenStyles.divider} />

        {/* LISTA DE PRODUCTOS CON NOTAS - CORREGIDO */}
        <View style={kitchenStyles.productsContainer}>
          {order.items.map((item, index) => (
            <View key={index}>
              <View style={kitchenStyles.productRow}>
                <Text style={kitchenStyles.quantity}>{item.quantity}x</Text>
                <Text style={kitchenStyles.productName}>{item.menuItem.name.toUpperCase()}</Text>
              </View>
              {/* NOTAS - AHORA SE MUESTRAN CORRECTAMENTE */}
              {item.notes && item.notes.trim() !== '' && (
                <Text style={kitchenStyles.notes}>- {item.notes}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={kitchenStyles.divider} />

        <View style={kitchenStyles.footer}>
          <Text style={kitchenStyles.asteriskLine}>********************************</Text>
        </View>
      </Page>
    </Document>
  );

  // Componente del documento PDF normal - CORREGIDO para mostrar notas y MESA en negrita
  const NormalTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={normalStyles.page}>
        <View style={normalStyles.header}>
          <Text style={normalStyles.title}>MARY'S RESTAURANT</Text>
          <Text style={normalStyles.boldSubtitle}>Av. Isabel La Católica 1254</Text>
          <Text style={normalStyles.boldSubtitle}>Tel: 941 778 599</Text>
          <View style={normalStyles.divider} />
        </View>

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

        <View style={normalStyles.section}>
          <View style={[normalStyles.row, normalStyles.bold]}>
            <Text>CLIENTE:</Text>
            <Text style={{ maxWidth: '60%', flexWrap: 'wrap' }}>{order.customerName.toUpperCase()}</Text>
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
          {/* MESA EN NEGRITA - CORREGIDO */}
          {order.tableNumber && (
            <View style={normalStyles.row}>
              <Text style={normalStyles.bold}>MESA:</Text>
              <Text>{order.tableNumber}</Text>
            </View>
          )}
        </View>

        <View style={normalStyles.divider} />

        <View style={normalStyles.table}>
          <View style={normalStyles.tableHeader}>
            <Text style={normalStyles.colQuantity}>Cant</Text>
            <Text style={normalStyles.colDescription}>Descripción</Text>
            <Text style={normalStyles.colPrice}>Precio</Text>
          </View>

          {/* PRODUCTOS CON NOTAS - CORREGIDO */}
          {order.items.map((item, index) => (
            <View key={index}>
              <View style={normalStyles.tableRow}>
                <Text style={[normalStyles.colQuantity, normalStyles.quantity]}>{item.quantity}x</Text>
                <View style={normalStyles.colDescription}>
                  <Text style={normalStyles.productName}>{item.menuItem.name}</Text>
                </View>
                <Text style={normalStyles.colPrice}>
                  S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              {/* NOTAS - AHORA SE MUESTRAN CORRECTAMENTE */}
              {item.notes && item.notes.trim() !== '' && (
                <View style={normalStyles.tableRow}>
                  <Text style={normalStyles.colQuantity}></Text>
                  <View style={normalStyles.colDescription}>
                    <Text style={normalStyles.notes}>Nota: {item.notes}</Text>
                  </View>
                  <Text style={normalStyles.colPrice}></Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={normalStyles.calculations}>
          <View style={normalStyles.calculationRow}>
            <Text>Subtotal:</Text>
            <Text>S/ {(order.total / 1.18).toFixed(2)}</Text>
          </View>
          <View style={normalStyles.calculationRow}>
            <Text>IGV (18%):</Text>
            <Text>S/ {(order.total - (order.total / 1.18)).toFixed(2)}</Text>
          </View>
          <View style={[normalStyles.row, normalStyles.total, normalStyles.bold]}>
            <Text>TOTAL:</Text>
            <Text>S/ {order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={normalStyles.divider} />

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

  // Función para descargar PDF
  const handleDownloadPDF = async () => {
    try {
      const blob = await pdf(
        isPhoneOrder ? <KitchenTicketDocument /> : <NormalTicketDocument />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const fileName = generateFileName(order, isPhoneOrder);
      
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  // Función para imprimir - CORREGIDO para mostrar notas
  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);

    const ticketContent = generateTicketContent(order, isPhoneOrder);
    
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
                  font-size: 12px !important;
                }
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                width: 80mm;
                margin: 0 auto;
                padding: 8px;
                background: white;
                color: black;
              }
              .ticket {
                width: 100%;
                max-width: 80mm;
              }
              .center {
                text-align: center;
              }
              .bold {
                font-weight: bold;
              }
              .uppercase {
                text-transform: uppercase;
              }
              .divider {
                border-top: 1px solid #000;
                margin: 6px 0;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
              }
              /* ESTILOS CORREGIDOS PARA NOTAS */
              .notes {
                font-style: italic;
                font-size: 10px;
                margin-left: 15%;
                margin-bottom: 3px;
                display: block;
                width: 85%;
              }
              .table-notes {
                font-style: italic;
                font-size: 10px;
                margin-left: 0;
                margin-top: 2px;
                display: block;
              }
              .products-header {
                text-align: center;
                font-weight: bold;
                margin: 6px 0;
                text-transform: uppercase;
                border-bottom: 1px solid #000;
                padding-bottom: 3px;
              }
              .product-row {
                display: flex;
                margin-bottom: 4px;
              }
              .quantity {
                width: 15%;
                font-weight: bold;
              }
              .product-name {
                width: 85%;
                font-weight: bold;
                text-transform: uppercase;
              }
              .asterisk-line {
                text-align: center;
                font-size: 9px;
                letter-spacing: 1px;
                margin: 3px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
              }
              th, td {
                padding: 2px 0;
                text-align: left;
                vertical-align: top;
              }
              th {
                border-bottom: 1px solid #000;
                font-weight: bold;
              }
              .notes-row td {
                padding-top: 0;
                padding-bottom: 3px;
              }
            </style>
          </head>
          <body>
            ${ticketContent}
          </body>
        </html>
      `);
      iframeDoc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };
    }
  };

  // Generar contenido HTML para impresión - CORREGIDO para mostrar notas
  const generateTicketContent = (order: Order, isKitchenTicket: boolean) => {
    if (isKitchenTicket) {
      return `
        <div class="ticket">
          <div class="center">
            <div class="bold uppercase" style="font-size: 16px; margin-bottom: 5px;">${order.customerName.toUpperCase()}</div>
            <div class="bold">** COCINA **</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="bold">CLIENTE:</span>
            <span>${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="bold">AREA:</span>
            <span>COCINA</span>
          </div>
          <div class="info-row">
            <span class="bold">COMANDA:</span>
            <span>#${getDisplayKitchenNumber()}</span>
          </div>
          <div class="info-row">
            <span class="bold">FECHA:</span>
            <span>${order.createdAt.toLocaleDateString('es-ES')} - ${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span class="bold">ATENDIDO POR:</span>
            <span>${getCurrentUserName().toUpperCase()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="products-header">DESCRIPCION</div>
          
          <div class="divider"></div>
          
          ${order.items.map(item => `
            <div class="product-row">
              <div class="quantity">${item.quantity}x</div>
              <div class="product-name">${item.menuItem.name.toUpperCase()}</div>
            </div>
            ${item.notes && item.notes.trim() !== '' ? `<div class="notes">- ${item.notes}</div>` : ''}
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="asterisk-line">********************************</div>
          </div>
        </div>
      `;
    } else {
      const subtotal = order.total / 1.18;
      const igv = order.total - subtotal;
      
      return `
        <div class="ticket">
          <div class="center">
            <div class="bold" style="font-size: 14px;">MARY'S RESTAURANT</div>
            <div class="bold">Av. Isabel La Católica 1254</div>
            <div class="bold">Tel: 941 778 599</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="bold">ORDEN:</span>
            <span>${getDisplayOrderNumber()}</span>
          </div>
          <div class="info-row">
            <span class="bold">TIPO:</span>
            <span>${getSourceText(order.source.type)}</span>
          </div>
          <div class="info-row">
            <span class="bold">FECHA:</span>
            <span>${order.createdAt.toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="bold">HORA:</span>
            <span>${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span class="bold">PAGO:</span>
            <span>${getPaymentText()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-row bold">
            <span>CLIENTE:</span>
            <span style="max-width: 60%; word-wrap: break-word;">${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="bold">TELÉFONO:</span>
            <span>${order.phone}</span>
          </div>
          ${order.address ? `
          <div class="info-row">
            <span class="bold">DIRECCIÓN:</span>
            <span style="max-width: 60%; word-wrap: break-word;">${order.address}</span>
          </div>
          ` : ''}
          ${order.tableNumber ? `
          <div class="info-row">
            <span class="bold">MESA:</span>
            <span>${order.tableNumber}</span>
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
              ${order.items.map(item => `
                <tr>
                  <td style="font-weight: bold; vertical-align: top;">${item.quantity}x</td>
                  <td style="vertical-align: top;">
                    <div style="font-weight: bold; text-transform: uppercase;">${item.menuItem.name}</div>
                    ${item.notes && item.notes.trim() !== '' ? `<div class="table-notes">Nota: ${item.notes}</div>` : ''}
                  </td>
                  <td style="text-align: right; vertical-align: top;">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div style="font-size: 11px;">
            <div class="info-row">
              <span>Subtotal:</span>
              <span>S/ ${subtotal.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span>IGV (18%):</span>
              <span>S/ ${igv.toFixed(2)}</span>
            </div>
            <div class="info-row" style="border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; font-weight: bold;">
              <span>TOTAL:</span>
              <span>S/ ${order.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="bold">¡GRACIAS POR SU PEDIDO!</div>
            <div>*** ${getSourceText(order.source.type)} ***</div>
            <div style="margin-top: 10px; font-size: 10px;">
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

  // Funciones auxiliares
  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': 'COCINA',
      'walk-in': 'LOCAL', 
      'delivery': 'DELIVERY',
    };
    return sourceMap[sourceType] || sourceType;
  };

  const generateFileName = (order: Order, isKitchenTicket: boolean) => {
    const orderNumber = isKitchenTicket ? getDisplayKitchenNumber() : getDisplayOrderNumber();
    const customerName = order.customerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const date = order.createdAt.toISOString().split('T')[0];
    const type = isKitchenTicket ? 'cocina' : 'cliente';
    
    return `comanda-${orderNumber}-${customerName}-${date}-${type}.pdf`;
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
        <button
          onClick={handlePrint}
          data-order-id={order.id}
          className="print-button"
          style={{
            padding: '10px 20px',
            backgroundColor: isPhoneOrder ? '#10b981' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isPhoneOrder ? '📋 Ticket Cocina' : '🧾 Ticket Cliente'} #{isPhoneOrder ? getDisplayKitchenNumber() : getDisplayOrderNumber()}
        </button>

        <button
          onClick={handleDownloadPDF}
          className="download-pdf-button"
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Descargar PDF
        </button>
      </div>

      <div id={`ticket-${order.id}`} style={{ display: 'none' }}>
        <div>Ticket content for printing</div>
      </div>
    </>
  );
};

export default OrderTicket;
