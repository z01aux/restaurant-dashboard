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

  // CONSTANTES PARA EL ANCHO DE IMPRESIÓN
  const TICKET_WIDTH = 72; // 72mm para tu impresora
  const PAGE_WIDTH = TICKET_WIDTH * 2.83465; // Convertir mm a puntos (1mm = 2.83465 puntos)
  const FONT_SIZE_SMALL = 7;
  const FONT_SIZE_NORMAL = 8;
  const FONT_SIZE_LARGE = 9;
  const FONT_SIZE_XLARGE = 10;
  const PADDING = 8;

  // Estilos para el PDF de COCINA (sin precios) - MODIFICADO para 72mm
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
      marginBottom: 3,
    },
    quantity: {
      width: '20%',
      fontWeight: 'bold',
      fontSize: FONT_SIZE_SMALL,
    },
    productName: {
      width: '80%',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_SMALL,
      flexWrap: 'wrap',
    },
    notes: {
      fontStyle: 'italic',
      fontSize: FONT_SIZE_SMALL - 1,
      marginLeft: 12,
      marginBottom: 1,
      flexWrap: 'wrap',
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

  // Estilos normales para otros tipos de pedido - MODIFICADO para 72mm
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
      width: '20%',
      fontSize: FONT_SIZE_SMALL,
    },
    colDescription: {
      width: '45%',
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
      marginLeft: 8,
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

  // Componente del documento PDF para COCINA
  const KitchenTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={kitchenStyles.page}>
        {/* Header - Nombre del cliente en lugar del restaurante */}
        <View style={kitchenStyles.header}>
          <Text style={kitchenStyles.restaurantName}>{order.customerName.toUpperCase()}</Text>
          <Text style={kitchenStyles.area}>** COCINA **</Text>
        </View>

        {/* Información de la comanda */}
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

        {/* Header de productos - "DESCRIPCION" en lugar de "PRODUCTOS" */}
        <Text style={kitchenStyles.productsHeader}>DESCRIPCION</Text>
        
        <View style={kitchenStyles.divider} />

        {/* Lista de productos */}
        <View style={kitchenStyles.productsContainer}>
          {order.items.map((item, index) => (
            <View key={index}>
              <View style={kitchenStyles.productRow}>
                <Text style={kitchenStyles.quantity}>{item.quantity}x</Text>
                <Text style={kitchenStyles.productName}>{item.menuItem.name.toUpperCase()}</Text>
              </View>
              {item.notes && (
                <Text style={kitchenStyles.notes}>- {item.notes}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={kitchenStyles.divider} />

        {/* Footer - Solo una línea de asteriscos */}
        <View style={kitchenStyles.footer}>
          <Text style={kitchenStyles.asteriskLine}>********************************</Text>
        </View>
      </Page>
    </Document>
  );

  // Componente del documento PDF normal (ACTUALIZADO para mostrar método de pago)
  const NormalTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={normalStyles.page}>
        <View style={normalStyles.header}>
          <Text style={normalStyles.title}>MARY'S RESTAURANT</Text>
          <Text style={normalStyles.subtitle}>Av. Isabel La Católica 1254</Text>
          <Text style={normalStyles.subtitle}>Tel: 941 778 599</Text>
          <View style={normalStyles.divider} />
        </View>

        {/* Información de la orden */}
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
          {/* Nuevo: Método de Pago */}
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>PAGO:</Text>
            <Text>{getPaymentText()}</Text>
          </View>
        </View>

        <View style={normalStyles.divider} />

        {/* Información del cliente ACTUALIZADA con mesa */}
        <View style={normalStyles.section}>
          <View style={[normalStyles.row, normalStyles.bold]}>
            <Text>CLIENTE:</Text>
            <Text style={{ maxWidth: '60%', flexWrap: 'wrap' }}>{order.customerName.toUpperCase()}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text>TELÉFONO:</Text>
            <Text>{order.phone}</Text>
          </View>
          {order.tableNumber && (
            <View style={normalStyles.row}>
              <Text>MESA:</Text>
              <Text>{order.tableNumber}</Text>
            </View>
          )}
        </View>

        <View style={normalStyles.divider} />

        {/* Tabla de productos */}
        <View style={normalStyles.table}>
          <View style={normalStyles.tableHeader}>
            <Text style={normalStyles.colQuantity}>Cant</Text>
            <Text style={normalStyles.colDescription}>Descripción</Text>
            <Text style={normalStyles.colPrice}>Precio</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={normalStyles.tableRow}>
              <Text style={[normalStyles.colQuantity, normalStyles.quantity]}>{item.quantity}x</Text>
              <View style={normalStyles.colDescription}>
                <Text style={normalStyles.productName}>{item.menuItem.name}</Text>
                {item.notes && (
                  <Text style={normalStyles.notes}>Nota: {item.notes}</Text>
                )}
              </View>
              <Text style={normalStyles.colPrice}>
                S/ {(item.menuItem.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Cálculos con IGV */}
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

  // Función para imprimir - USANDO EL MISMO DISEÑO QUE RESTAURANT POS
  const handlePrint = async () => {
    try {
      const isMobile = window.innerWidth <= 768;
      const windowFeatures = isMobile 
        ? 'width=320,height=600,scrollbars=no,toolbar=no,location=no'
        : 'width=400,height=600,scrollbars=no,toolbar=no,location=no';
      
      const printWindow = window.open('', '_blank', windowFeatures);
      
      if (printWindow) {
        // Obtener fecha y hora actual
        const now = new Date();
        const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        
        const currentDateTime = {
          date: now.toLocaleDateString('es-PE', dateOptions),
          time: now.toLocaleTimeString('es-PE', timeOptions)
        };

        // Generar contenido específico según el tipo de ticket
        const printContent = generatePrintContent(order, isPhoneOrder, currentDateTime);
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${isPhoneOrder ? 'Ticket Cocina' : 'Ticket Cliente'} - ${isPhoneOrder ? getDisplayKitchenNumber() : getDisplayOrderNumber()}</title>
              <style>
                @media print {
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                  body {
                    width: 80mm !important;
                    margin: 0 auto !important;
                    padding: 5mm !important;
                    background: white !important;
                  }
                }
                
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: 'Courier New', monospace !important;
                  font-size: 11px !important;
                  line-height: 1.4 !important;
                  width: 80mm;
                  margin: 0 auto;
                  padding: 5mm;
                  background: white;
                  color: black;
                }
                
                .pos-container {
                  width: 80mm !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  font-family: 'Courier New', monospace !important;
                  font-size: 11px !important;
                  line-height: 1.4 !important;
                }
                
                .pos-header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 8px;
                  margin-bottom: 8px;
                  page-break-inside: avoid;
                }
                
                .pos-title {
                  font-size: 16px !important;
                  font-weight: bold;
                  margin-bottom: 4px;
                  text-transform: uppercase;
                }
                
                .pos-subtitle {
                  font-size: 10px !important;
                  margin-bottom: 2px;
                }
                
                .client-row {
                  display: flex;
                  border-bottom: 1px dotted #999;
                  padding: 6px 0;
                  font-size: 10px;
                  line-height: 1.3;
                  min-height: 28px;
                  align-items: flex-start;
                  page-break-inside: avoid;
                }
                
                .header-row {
                  font-weight: bold;
                  border-bottom: 2px solid #000 !important;
                  background: none !important;
                  padding: 8px 0 !important;
                }
                
                .client-number {
                  width: 12%;
                  text-align: center;
                  font-weight: bold;
                  font-size: 10px;
                }
                
                .client-name {
                  width: 48%;
                  padding: 0 4px;
                  word-break: break-word;
                  line-height: 1.3;
                  font-weight: bold;
                }
                
                .client-payment {
                  width: 20%;
                  text-align: center;
                  line-height: 1.3;
                  font-size: 9px;
                }
                
                .client-amount {
                  width: 20%;
                  text-align: right;
                  padding-right: 4px;
                  font-weight: bold;
                  line-height: 1.3;
                  font-size: 10px;
                }
                
                .payment-option-print {
                  border: 1.5px solid #000;
                  padding: 2px 4px;
                  font-size: 8px;
                  display: inline-block;
                  min-width: 40px;
                  font-weight: bold;
                }
                
                .pos-total {
                  text-align: right;
                  margin-top: 12px;
                  padding-top: 8px;
                  border-top: 2px solid #000;
                  font-size: 11px;
                  font-weight: bold;
                }
                
                .pos-footer {
                  text-align: center;
                  margin-top: 15px;
                  padding-top: 10px;
                  border-top: 2px dashed #000;
                  font-size: 10px;
                  line-height: 1.3;
                  page-break-inside: avoid;
                }
                
                .product-row {
                  display: flex;
                  margin-bottom: 4px;
                  padding: 2px 0;
                }
                
                .quantity {
                  width: 20%;
                  font-weight: bold;
                }
                
                .product-name {
                  width: 80%;
                  font-weight: bold;
                  text-transform: uppercase;
                  font-size: 10px;
                }
                
                .notes {
                  font-style: italic;
                  font-size: 9px;
                  margin-left: 12px;
                  margin-bottom: 2px;
                }
                
                .divider {
                  border-bottom: 1px solid #000;
                  margin: 6px 0;
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
                
                /* Estilos para vista previa en pantalla */
                @media screen {
                  body {
                    background: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                  }
                  .pos-container {
                    background: white;
                    padding: 15px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    border: 1px solid #ddd;
                  }
                }
              </style>
            </head>
            <body>
              <div class="pos-container">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 1000);
                  }, 100);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      // Fallback a la implementación anterior si hay error
      const printContent = document.getElementById(`ticket-${order.id}`);
      if (printContent) {
        const isMobile = window.innerWidth <= 768;
        const windowFeatures = isMobile 
          ? 'width=320,height=600,scrollbars=no,toolbar=no,location=no'
          : 'width=400,height=600,scrollbars=no,toolbar=no,location=no';
        
        const printWindow = window.open('', '_blank', windowFeatures);
        if (printWindow) {
          const ticketContent = generateTicketContent(order, isPhoneOrder);
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Ticket ${order.id}</title>
                <style>
                  @media print {
                    @page {
                      margin: 0;
                      size: 72mm auto;
                    }
                    body {
                      width: 72mm !important;
                      margin: 0 auto !important;
                      padding: 5px !important;
                    }
                  }
                  body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    width: 72mm;
                    margin: 0 auto;
                    padding: 10px;
                    background: white;
                    color: black;
                    box-sizing: border-box;
                  }
                  .ticket {
                    width: 100%;
                    max-width: 72mm;
                    margin: 0 auto;
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
                    border-top: 1px dashed #000;
                    margin: 5px 0;
                  }
                  .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3px;
                  }
                  .notes {
                    font-style: italic;
                    font-size: 10px;
                    margin-left: 15px;
                  }
                  .products-header {
                    text-align: center;
                    font-weight: bold;
                    margin: 5px 0;
                    text-transform: uppercase;
                    border-bottom: 1px dashed #000;
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
                    letterSpacing: 1px;
                    margin-bottom: 1px;
                  }
                  
                  /* Estilos para vista previa */
                  @media screen and (min-width: 769px) {
                    body {
                      width: 100%;
                      max-width: 72mm;
                      background: #f5f5f5;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      min-height: 100vh;
                    }
                    .ticket {
                      background: white;
                      padding: 15px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                      border-radius: 8px;
                    }
                  }
                </style>
              </head>
              <body>
                ${ticketContent}
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.print();
                      setTimeout(function() {
                        window.close();
                      }, 1000);
                  }, 100);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    }
  };

  // Función para generar contenido de impresión en formato POS
  const generatePrintContent = (order: Order, isKitchenTicket: boolean, currentDateTime: { date: string, time: string }) => {
    if (isKitchenTicket) {
      // TICKET COCINA en formato POS
      return `
        <div class="pos-header">
          <div class="pos-title">${order.customerName.toUpperCase()}</div>
          <div class="pos-subtitle bold">** COCINA **</div>
          <div class="pos-subtitle">Comanda: #${getDisplayKitchenNumber()}</div>
          <div class="pos-subtitle">Fecha: ${currentDateTime.date}</div>
          <div class="pos-subtitle">Hora: ${currentDateTime.time}</div>
        </div>
        
        <div class="client-row header-row">
          <div class="client-number">N°</div>
          <div class="client-name">DESCRIPCIÓN</div>
          <div class="client-payment">CANT</div>
          <div class="client-amount">NOTAS</div>
        </div>
        
        ${order.items.map((item) => `
          <div class="client-row">
            <div class="client-number">${order.items.indexOf(item) + 1}</div>
            <div class="client-name">${item.menuItem.name.toUpperCase()}</div>
            <div class="client-payment">
              <span class="payment-option-print">${item.quantity}x</span>
            </div>
            <div class="client-amount">${item.notes ? 'SI' : 'NO'}</div>
          </div>
          ${item.notes ? `
            <div class="client-row">
              <div class="client-number"></div>
              <div class="client-name" style="font-style: italic; font-size: 9px;">- ${item.notes}</div>
              <div class="client-payment"></div>
              <div class="client-amount"></div>
            </div>
          ` : ''}
        `).join('')}
        
        <div class="pos-footer">
          <div class="bold">*** COMANDA COCINA ***</div>
          <div style="margin: 8px 0;">Atendido por: ${getCurrentUserName().toUpperCase()}</div>
          <div>--------------------------------</div>
        </div>
      `;
    } else {
      // TICKET NORMAL en formato POS
      const subtotal = order.total / 1.18;
      const igv = order.total - subtotal;
      
      return `
        <div class="pos-header">
          <div class="pos-title">MARY'S RESTAURANT</div>
          <div class="pos-subtitle">RUC: 20505262086</div>
          <div class="pos-subtitle">Fecha: ${currentDateTime.date}</div>
          <div class="pos-subtitle">Hora: ${currentDateTime.time}</div>
          <div class="pos-subtitle">Orden: #${getDisplayOrderNumber()}</div>
          <div class="pos-subtitle">Tipo: ${getSourceText(order.source.type)}</div>
          <div class="pos-subtitle">Pago: ${getPaymentText()}</div>
        </div>
        
        <div class="client-row header-row">
          <div class="client-number">N°</div>
          <div class="client-name">CLIENTE</div>
          <div class="client-payment">PAGO</div>
          <div class="client-amount">MONTO</div>
        </div>
        
        <div class="client-row">
          <div class="client-number">1</div>
          <div class="client-name">${order.customerName.toUpperCase()}</div>
          <div class="client-payment">
            <span class="payment-option-print ${getPaymentText().toLowerCase().includes('efectivo') ? 'efectivo' : getPaymentText().toLowerCase().includes('yape') ? 'yape' : ''}">${getPaymentText()}</span>
          </div>
          <div class="client-amount">S/ ${order.total.toFixed(2)}</div>
        </div>
        
        ${order.tableNumber ? `
          <div class="client-row">
            <div class="client-number"></div>
            <div class="client-name">Mesa: ${order.tableNumber}</div>
            <div class="client-payment"></div>
            <div class="client-amount"></div>
          </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="client-row header-row">
          <div class="client-number">CANT</div>
          <div class="client-name">PRODUCTO</div>
          <div class="client-payment">PRECIO</div>
          <div class="client-amount">TOTAL</div>
        </div>
        
        ${order.items.map((item) => `
          <div class="client-row">
            <div class="client-number">${item.quantity}x</div>
            <div class="client-name">${item.menuItem.name}</div>
            <div class="client-payment">S/ ${item.menuItem.price.toFixed(2)}</div>
            <div class="client-amount">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</div>
          </div>
          ${item.notes ? `
            <div class="client-row">
              <div class="client-number"></div>
              <div class="client-name" style="font-style: italic; font-size: 9px;">Nota: ${item.notes}</div>
              <div class="client-payment"></div>
              <div class="client-amount"></div>
            </div>
          ` : ''}
        `).join('')}
        
        <div class="pos-total">
          <div>Subtotal: S/ ${subtotal.toFixed(2)}</div>
          <div>IGV (18%): S/ ${igv.toFixed(2)}</div>
          <div style="font-size: 13px; margin-top: 4px;">TOTAL: S/ ${order.total.toFixed(2)}</div>
        </div>
        
        <div class="pos-footer">
          <div class="bold">*** ${getSourceText(order.source.type)} ***</div>
          <div style="margin: 8px 0;">¡GRACIAS POR SU VISITA!</div>
          <div>--------------------------------</div>
          <div style="margin-top: 15px; font-size: 9px;">
            --- CORTAR AQUÍ ---
          </div>
        </div>
      `;
    }
  };

  // Generar contenido HTML para impresión (MANTENIENDO EL DISEÑO QUE TE GUSTA)
  const generateTicketContent = (order: Order, isKitchenTicket: boolean) => {
    if (isKitchenTicket) {
      // TICKET COCINA
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
            <span>${order.createdAt.toLocaleDateString('es-ES')} - ${order.createdAt.toLocaleTimeString('es-ES')}</span>
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
            ${item.notes ? `<div class="notes">- ${item.notes}</div>` : ''}
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="asterisk-line">********************************</div>
          </div>
        </div>
      `;
    } else {
      // TICKET NORMAL ACTUALIZADO con método de pago
      const subtotal = order.total / 1.18;
      const igv = order.total - subtotal;
      
      return `
        <div class="ticket">
          <div class="center">
            <div class="bold">MARY'S RESTAURANT</div>
            <div>Av. Isabel La Católica 1254</div>
            <div>Tel: 941 778 599</div>
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
            <span>${order.createdAt.toLocaleTimeString()}</span>
          </div>
          <div class="info-row">
            <span class="bold">PAGO:</span>
            <span>${getPaymentText()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-row bold">
            <span>CLIENTE:</span>
            <span>${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span>TELÉFONO:</span>
            <span>${order.phone}</span>
          </div>
          ${order.tableNumber ? `
          <div class="info-row">
            <span>MESA:</span>
            <span>${order.tableNumber}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 2px 0; border-bottom: 1px solid #000;">Cant</th>
                <th style="text-align: left; padding: 2px 0; border-bottom: 1px solid #000;">Descripción</th>
                <th style="text-align: right; padding: 2px 0; border-bottom: 1px solid #000;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td style="padding: 2px 0; font-weight: bold;">${item.quantity}x</td>
                  <td style="padding: 2px 0;">
                    <div style="font-weight: bold; text-transform: uppercase;">${item.menuItem.name}</div>
                    ${item.notes ? `<div style="font-style: italic; font-size: 10px; margin-left: 10px;">Nota: ${item.notes}</div>` : ''}
                  </td>
                  <td style="text-align: right; padding: 2px 0;">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</td>
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
              ${new Date().toLocaleString()}
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
